# Prompt para Generar el Sistema de Gestión Festo GT (Gen Técnico)

Copia y pega este prompt en una nueva conversación o utilízalo para guiar el desarrollo de este sistema paso a paso.

---

```markdown
Actúa como un Ingeniero de Software Full-Stack y Diseñador de UX/UI Senior. Tu objetivo es diseñar e implementar un sistema web completo, moderno y visualmente impactante para la gestión de cursos de **Festo Neumática (Básico y Avanzado)** dictados en la **Escuela Técnica Roberto Rocca (ETRR)** bajo el programa **Gen Técnico (GT)**.

El sistema debe tener una interfaz interactiva, limpia, con estética premium (preferiblemente tema oscuro con efectos de glassmorphism, gradientes suaves y micro-animaciones) y estar optimizado para escritorio y tabletas.

---

## 1. Reglas de Negocio y Lógica del Curso

### Duración y Modalidades:
*   Los cursos constan de: **6 clases teóricas/prácticas + 1 clase de examen práctico + 1 clase de recuperatorio**.
*   Las clases estándar son de **8 horas diarias**.
*   **Grupo Técnica 4 (Día Completo):**
    *   Asisten el día completo (8 horas).
    *   Tardan **7 días/clases** en total en completar el ciclo básico (6 clases de teoría/práctica + 1 clase de examen práctico).
    *   Requieren **coordinación de transporte especial** (empresa externa provista por nosotros). Esto debe estar explícito y editable en el cronograma.
*   **Grupo Técnica 1 (Medio Turno - Mañana o Tarde):**
    *   Asisten medio turno (4 horas).
    *   Tardan el doble de clases calendario en completar el ciclo: **12 clases de teoría/práctica + 2 clases de examen práctico** (equivalente a las horas del grupo de día completo).

### Exámenes y Recuperatorios:
1.  **Examen Teórico:**
    *   Se realiza en el último tramo de la última hora de la clase teórica final (clase 6 para T4, clase 12 para T1).
    *   Consta de **3 exámenes individuales**: **Neumática**, **Electroneumática** y **PLC**.
    *   **Condición de Aprobación Teórica:** Nota mínima de **6.0 en cada examen** Y promedio ponderado de los tres **mayor o igual a 7.0**.
    *   Si no se cumple la condición, el alumno debe ir a recuperatorio **solo de las materias necesarias** para volver a cumplir la condición.
    *   Se debe registrar la nota del examen inicial, la fecha, la nota del recuperatorio y la fecha en que se alcanzó la aprobación teórica final.
2.  **Examen Práctico:**
    *   Solo acceden a la clase de examen práctico los alumnos que ya tienen el **Teórico Aprobado**.
    *   Si aprueban el práctico, acreditan el curso. Si reprueban, van a recuperatorio práctico.
3.  **Lógica de Recuperatorios:**
    *   Máximo **1 recuperatorio para el teórico** y **1 recuperatorio para el práctico**.
    *   **Programación:** Los recuperatorios no son inmediatos; se deben programar idealmente después de que hayan pasado **2 grupos aproximadamente** (este parámetro debe ser configurable en el sistema, por ejemplo, "Margen de Recuperatorio: N grupos").
    *   **Acreditación:** El estado de acreditación final del alumno es **"Acreditó" (Sí/No)** y solo se activa cuando se aprueba tanto el examen práctico como el teórico.

---

## 2. Control de Acceso y Roles (Usuarios)
*   **Administrador (Yo):** Control total del sistema. Puede ver y modificar todos los cronogramas, coordinar el transporte, cargar notas de todos los alumnos, crear usuarios y ver todas las escuelas.
*   **Coordinador de Escuela (Técnica 1 / Técnica 4):**
    *   Tiene su propia cuenta de acceso.
    *   **Restricción estricta:** Solo puede visualizar la información de su propia escuela (sus alumnos, sus cronogramas, sus resultados). No puede ver datos de la otra escuela.
    *   Puede **subir la lista de estudiantes** que van a participar en el curso mediante un formulario o plantilla (Campos obligatorios: Nombre, Apellido, DNI, Correo Electrónico, Turno [Mañana/Tarde/Completo] y Escuela).
*   **Docentes (Profesores):**
    *   Pueden cargar las notas de los estudiantes directamente en la interfaz del sistema o mediante la subida de un archivo Excel.
    *   Registran las fechas de evaluaciones y recuperatorios.
*   **Alumnos:** No tienen usuario ni acceso directo al sistema (el coordinador de su escuela les transmite la información o exporta el cronograma).

---

## 3. Módulos y Pantallas Clave

### 1. Dashboard Principal (Vista Administrador vs. Vista Coordinador)
*   **Métricas clave (KPIs):** Porcentaje de alumnos acreditados, alumnos en estado de recuperatorio, grupos activos, estado del transporte para la semana.
*   **Gráficos dinámicos:** Progreso de los cursos, comparativa de aprobación por escuela, distribución de notas (Neumática, Electroneumática, PLC).
*   **Alertas:** Alumnos en riesgo (desaprobados), transportes sin coordinar, próximos exámenes prácticos.

### 2. Planificador e Historial de Cronogramas
*   Visualización interactiva (calendario o diagrama de Gantt) de los encuentros de cada grupo.
*   Indicadores claros de las fechas de clases teóricas, exámenes teóricos, prácticos y recuperatorios estimados.
*   **Sección de Transporte (Técnica 4):** Campos para ingresar la empresa de transporte, horarios de salida/regreso, estado de confirmación, chofer/contacto, y observaciones.
*   Botón para **Exportar Cronograma (PDF/Imagen/Excel)** filtrado por escuela, listo para enviar.

### 3. Gestión de Alumnos y Carga de Matrícula
*   Formulario para que el Coordinador cargue individualmente o de forma masiva (importar CSV/Excel) la lista de alumnos.
*   Tabla de alumnos con filtros rápidos por Escuela, Turno, Estado Académico (Cursando, Pendiente Examen, En Recuperatorio, Acreditado, No Acreditado).

### 4. Portal de Calificaciones y Acreditación (Libreta Digital)
*   Tabla interactiva tipo hoja de cálculo (Excel-like) para que los profesores carguen notas rápidamente.
*   Campos de notas para:
    *   Teórico: Neumática, Electroneumática, PLC (con cálculo automático de promedio y estado de aprobación en tiempo real).
    *   Fecha de Examen Teórico.
    *   Recuperatorios Teóricos (de las materias reprobadas) y fechas.
    *   Práctico (Nota/Aprobado/Desaprobado) y fecha.
    *   Recuperatorio Práctico y fecha.
*   Cálculo automático de la **Acreditación Final (Sí/No)** con visualización de estado mediante badges de colores (ej. Verde = Acreditado, Amarillo = Pendiente Recuperatorio, Rojo = No Acreditado).

---

## 4. Requisitos Tecnológicos y Estética Visual

*   **Tecnologías:** Frontend moderno y rápido utilizando HTML5 semántico, JavaScript vanilla o un framework como React/Next.js/Vite (según la complejidad). Estilos con CSS puro o Tailwind CSS si se prefiere.
*   **Visual y UX (Premium):**
    *   Diseño limpio y moderno, alejado de tablas aburridas de administración.
    *   Esquema de colores sofisticado (tema oscuro por defecto con acentos en azul eléctrico, verde esmeralda para aprobados y naranja/rojo para recuperatorios/alertas).
    *   Efectos de vidrio (glassmorphism), bordes suaves, sombras realistas.
    *   Transiciones suaves en botones, filtros y modales.
*   **Interactividad:** Carga dinámica de datos, filtros instantáneos sin recargar la página, alertas Toast no intrusivas.
```
