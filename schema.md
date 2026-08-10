# Esquema de Base de Datos y Reglas de Seguridad - Firestore

Este documento define la estructura NoSQL detallada de Firestore y las reglas de seguridad asociadas para el sistema de gestión "Gen Técnico" de la ETRR.

---

## 1. Colecciones de Firestore

### Colección: `escuelas`
Representa las instituciones invitadas que participan en el programa.
* **ID del Documento:** Autogenerado por Firestore (o código corto de la escuela, ej. `etrr`).
* **Campos:**
```json
{
  "nombre": "Escuela Técnica Roberto Rocca",
  "direccion": "Ruta 9 Km 75.5, Campana, Buenos Aires",
  "contacto_enlace": {
    "nombre": "Juan Pérez",
    "email": "juan.perez@etrr.edu.ar",
    "telefono": "+54 3489 123456"
  },
  "transporte_coordinado": true,
  "comedor_default": {
    "desayuno": true,
    "almuerzo": true,
    "cena": false
  },
  "turnos_habilitados": ["Mañana", "Tarde"],
  "creado_en": "2026-07-16T12:00:00Z",
  "creado_por": "uid_del_coordinador"
}
```

### Colección: `usuarios`
Contiene los perfiles de los usuarios y define sus roles de acceso en la plataforma.
* **ID del Documento:** Debe coincidir exactamente con el `uid` provisto por Firebase Authentication.
* **Campos:**
```json
{
  "nombre": "Sofía",
  "apellido": "Rodríguez",
  "email": "sofia.docente@example.com",
  "rol": "docente", 
  "escuela_id": "etrr", 
  "activo": true,
  "creado_en": "2026-07-16T12:00:00Z"
}
```
* **Roles admitidos:**
  * `coordinador`: Acceso total a todas las escuelas, estudiantes, configuraciones de comedor/transporte y asignación de roles.
  * `escuela_admin`: Acceso de lectura/escritura limitado a los estudiantes, transporte y comedor de su propia escuela (`escuela_id`).
  * `docente`: Acceso de lectura a estudiantes y comisiones asignadas, y escritura en calificaciones/asistencia de su propia escuela o comisiones.

### Colección: `estudiantes`
Almacena el padrón de alumnos participantes.
* **ID del Documento:** Autogenerado o DNI del estudiante.
* **Campos:**
```json
{
  "nombre": "Martín",
  "apellido": "Gómez",
  "DNI": "45678912",
  "correo": "martin.gomez@example.com",
  "escuela_id": "etrr",
  "turno": "Mañana",
  "estado_acreditacion": "Pendiente",
  "asistencia_porcentaje": 87.5,
  "historial_asistencia": [
    {
      "fecha": "2026-07-01",
      "presente": true
    },
    {
      "fecha": "2026-07-08",
      "presente": true
    },
    {
      "fecha": "2026-07-15",
      "presente": false
    }
  ],
  "creado_en": "2026-07-16T12:00:00Z"
}
```

### Colección: `comisiones`
Define los grupos de cursada y sus respectivas configuraciones.
* **ID del Documento:** Autogenerado (ej. `comision_neumatica_a`).
* **Campos:**
```json
{
  "nombre": "Comisión A - Neumática Básica",
  "curso": "Neumática Básica",
  "escuela_id": "etrr",
  "docentes": ["uid_docente_1", "uid_docente_2"],
  "transporte_id": "ruta_campana_etrr_01",
  "comedor_config": {
    "desayuno": true,
    "almuerzo": true,
    "cena": false
  },
  "estudiantes": ["45678912", "45678913", "45678914"]
}
```

### Colección: `calificaciones`
Contiene el rendimiento académico e incluye las notas y la lógica de acreditación.
* **ID del Documento:** Debe coincidir con el `estudiante_id` (relación 1-a-1).
* **Campos:**
```json
{
  "estudiante_id": "45678912",
  "notas_teorico": {
    "neumatica": 8.0,
    "electroneumatica": 7.0,
    "plc": 6.0
  },
  "promedio_teorico": 7.0,
  "teorico_aprobado": true,
  "notas_practico": 8.0,
  "acreditado": true,
  "comentarios_mapa": "Buen desempeño práctico, asimiló rápidamente los conceptos de PLC.",
  "actualizado_en": "2026-07-16T12:30:00Z",
  "actualizado_por": "uid_docente_1"
}
```

---

## 2. Reglas de Seguridad de Firestore (`firestore.rules`)

Para asegurar la privacidad de los datos académicos y logísticos de cada institución, utiliza el siguiente archivo de reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Funciones auxiliares para validación de roles
    function estaAutenticado() {
      return request.auth != null;
    }

    function getUsuarioData() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data;
    }

    function esCoordinador() {
      return estaAutenticado() && getUsuarioData().rol == 'coordinador';
    }

    function esAdminDeEscuela(escuelaId) {
      return estaAutenticado() && 
             (getUsuarioData().rol == 'escuela_admin' && getUsuarioData().escuela_id == escuelaId);
    }

    function esDocenteDeEscuela(escuelaId) {
      return estaAutenticado() && 
             (getUsuarioData().rol == 'docente' && getUsuarioData().escuela_id == escuelaId);
    }

    // Reglas para la colección de usuarios
    match /usuarios/{usuarioId} {
      allow read: if estaAutenticado();
      // Solo coordinadores pueden modificar roles. Usuarios normales pueden escribir su propio perfil inicial
      allow write: if esCoordinador() || (estaAutenticado() && request.auth.uid == usuarioId);
    }

    // Reglas para la colección de escuelas
    match /escuelas/{escuelaId} {
      allow read: if estaAutenticado();
      // Solo el coordinador puede crear/modificar escuelas
      allow write: if esCoordinador();
    }

    // Reglas para estudiantes
    match /estudiantes/{estudianteId} {
      allow read: if esCoordinador() || 
                  esAdminDeEscuela(resource.data.escuela_id) || 
                  esDocenteDeEscuela(resource.data.escuela_id);
      
      allow write: if esCoordinador() || 
                   esAdminDeEscuela(request.resource.data.escuela_id) ||
                   esDocenteDeEscuela(request.resource.data.escuela_id);
    }

    // Reglas para comisiones
    match /comisiones/{comisionId} {
      allow read: if estaAutenticado();
      allow write: if esCoordinador() || esAdminDeEscuela(request.resource.data.escuela_id);
    }

    // Reglas para calificaciones
    match /calificaciones/{calificacionId} {
      // Para leer, el usuario debe ser coordinador o pertenecer a la misma escuela que el estudiante relacionado
      allow read: if esCoordinador() || 
                  esAdminDeEscuela(get(/databases/$(database)/documents/estudiantes/$(resource.data.estudiante_id)).data.escuela_id) ||
                  esDocenteDeEscuela(get(/databases/$(database)/documents/estudiantes/$(resource.data.estudiante_id)).data.escuela_id);
      
      // Permitir actualizar calificaciones solo si es docente asignado, admin de la escuela del alumno, o coordinador
      allow write: if esCoordinador() || 
                   esAdminDeEscuela(get(/databases/$(database)/documents/estudiantes/$(request.resource.data.estudiante_id)).data.escuela_id) ||
                   esDocenteDeEscuela(get(/databases/$(database)/documents/estudiantes/$(request.resource.data.estudiante_id)).data.escuela_id);
    }
  }
}
```
