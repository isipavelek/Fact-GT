// =================================================================
// FESTO GT - CONFIGURACIÓN DE FIREBASE CLOUD FIRESTORE (REAL)
// Proyecto: fact-gt
// =================================================================

const firebaseConfig = {
  apiKey: "AIzaSyCJ0NLDNzHNUJYlQz6BDxew_h-BXB9VW5I",
  authDomain: "fact-gt.firebaseapp.com",
  projectId: "fact-gt",
  storageBucket: "fact-gt.firebasestorage.app",
  messagingSenderId: "466963174802",
  appId: "1:466963174802:web:ddbd16d829923a3f615d4b",
  measurementId: "G-TF3B64P5S9"
};

let dbFs = null;
let isFirebaseConnected = false;

function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn("⚠️ SDK de Firebase no cargado.");
    updateFirebaseBadgeStatus(false);
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    dbFs = firebase.firestore();
    
    // Intentar persistencia offline
    dbFs.enablePersistence().catch(err => {
      if (err.code === 'failed-precondition') {
        console.warn("Persistencia de Firestore en múltiples pestañas.");
      } else if (err.code === 'unimplemented') {
        console.warn("El navegador no soporta persistencia offline.");
      }
    });

    isFirebaseConnected = true;
    updateFirebaseBadgeStatus(true);
    console.log("🔥 FESTO GT: Conectado exitosamente a Firebase Cloud Firestore (fact-gt).");

    // Activar auto-creación de colección usuarios si está vacía
    autoSyncUsersToFirestore();

    // Activar sincronización en tiempo real
    subscribeToFirestoreCollections();

    // Escuchar cambios de estado en Firebase Auth
    firebase.auth().onAuthStateChanged(firebaseUser => {
      if (firebaseUser) {
        const fEmail = (firebaseUser.email || '').toLowerCase();
        let userProfile = (db.usuarios || []).find(u => u && (u.id === firebaseUser.uid || (u.email && u.email.toLowerCase() === fEmail)));
        
        if (!userProfile) {
          const isCoord = fEmail === "ipavelek@gmail.com" || firebaseUser.uid === "YN8KgpP4RrcHC7YrYm30rBHLFxt1";
          userProfile = {
            id: firebaseUser.uid,
            nombre: isCoord ? "Israel Pavelek" : (firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : "Usuario")),
            apellido: isCoord ? "Coordinador General ETRR" : "Usuario ETRR",
            email: firebaseUser.email,
            rol: isCoord ? "coordinador" : "escuela_admin",
            escuela_id: fEmail.includes("eest1") || fEmail.includes("est1") ? "est1" : (fEmail.includes("ees4") || fEmail.includes("est4") ? "est4" : null)
          };
        }
        
        currentUser = userProfile;
        localStorage.setItem("festo_gt_user", JSON.stringify(currentUser));
        if (typeof updateAuthUI === 'function') updateAuthUI();
      }
    });
  } catch (error) {
    console.error("⚠️ Error de conexión a Firebase:", error.message);
    updateFirebaseBadgeStatus(false);
  }
}

function updateFirebaseBadgeStatus(connected) {
  const badge = document.getElementById("firebase-status-badge");
  if (!badge) return;

  if (connected) {
    badge.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span class="text-emerald-400 font-bold">Firebase Conectado Real (fact-gt)</span>
    `;
  } else {
    badge.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-amber-400"></span>
      <span class="text-amber-400">Firebase Mock / LocalStorage</span>
    `;
  }
}

// Subscripciones en tiempo real a las colecciones de Firestore
function subscribeToFirestoreCollections() {
  if (!dbFs || !isFirebaseConnected) return;

  // 1. Escuelas
  dbFs.collection("escuelas").onSnapshot(snapshot => {
    const escuelas = [];
    snapshot.forEach(doc => escuelas.push({ id: doc.id, ...doc.data() }));
    db.escuelas = escuelas;
    if (typeof renderAll === 'function') renderAll();
  }, err => console.warn("Modo fallback/escuelas:", err.message));

  // 2. Cronogramas — localStorage es la fuente de verdad.
  // Firestore solo se usa cuando no hay datos guardados localmente (primera visita).
  dbFs.collection("cronogramas").onSnapshot(snapshot => {
    // 1. Leer datos de Firestore
    const remoteCronos = {};
    snapshot.forEach(doc => {
      remoteCronos[doc.id] = { id: doc.id, ...doc.data() };
    });

    // 2. ¿Tenemos datos locales?
    let localCronos = [];
    try {
      const saved = localStorage.getItem('festo_gt_db');
      if (saved) {
        const p = JSON.parse(saved);
        if (p && Array.isArray(p.cronogramas) && p.cronogramas.length > 0) {
          localCronos = p.cronogramas;
        }
      }
    } catch(e) {}

    const hasLocalData = localCronos.length > 0;

    if (hasLocalData) {
      // DATOS LOCALES DISPONIBLES:
      // Usar datos locales siempre. Solo agregar cronogramas NUEVOS que vengan de Firestore.
      const localIds = new Set(localCronos.map(c => c.id));
      Object.values(remoteCronos).forEach(rc => {
        if (!localIds.has(rc.id)) {
          localCronos.push(rc); // Nuevo crono creado desde otro dispositivo
        }
      });
      db.cronogramas = typeof applyCustomOverrides === 'function'
        ? applyCustomOverrides(localCronos)
        : localCronos;
    } else {
      // PRIMERA VISITA (sin datos locales): cargar desde Firestore y guardar localmente
      const firestoreCronos = Object.values(remoteCronos);
      db.cronogramas = typeof applyCustomOverrides === 'function'
        ? applyCustomOverrides(firestoreCronos)
        : firestoreCronos;
      // Guardar baseline en localStorage para que próximos reloads usen datos locales
      if (typeof saveDB === 'function') saveDB();
    }

    if (typeof refreshAllCronogramasStructure === 'function') refreshAllCronogramasStructure();
    if (typeof renderAll === 'function') renderAll();
  }, err => console.warn("Modo fallback/cronogramas:", err.message));

  // 3. Estudiantes
  dbFs.collection("estudiantes").onSnapshot(snapshot => {
    const estudiantes = [];
    snapshot.forEach(doc => estudiantes.push({ id: doc.id, ...doc.data() }));
    db.estudiantes = estudiantes;
    if (typeof renderAll === 'function') renderAll();
  }, err => console.warn("Modo fallback/estudiantes:", err.message));

  // 4. Calificaciones
  dbFs.collection("calificaciones").onSnapshot(snapshot => {
    const califs = {};
    snapshot.forEach(doc => { califs[doc.id] = doc.data(); });
    db.calificaciones = califs;
    if (typeof renderAll === 'function') renderAll();
  }, err => console.warn("Modo fallback/calificaciones:", err.message));

  // 5. Avisos Logísticos
  dbFs.collection("avisos_logisticos").onSnapshot(snapshot => {
    const avisos = [];
    snapshot.forEach(doc => avisos.push({ id: doc.id, ...doc.data() }));
    db.avisos_logisticos = avisos;
    if (typeof renderAvisosLogisticos === 'function') renderAvisosLogisticos();
    if (typeof renderAll === 'function') renderAll();
  }, err => console.warn("Modo fallback/avisos:", err.message));

  // 6. Usuarios y Perfiles (Role Assignment)
  dbFs.collection("usuarios").onSnapshot(snapshot => {
    const usuarios = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data) usuarios.push({ id: doc.id, ...data });
    });
    db.usuarios = usuarios;

    // Actualizar dinámicamente el perfil del usuario autenticado desde Firestore
    const authUser = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
    const activeEmail = authUser ? (authUser.email || '').toLowerCase() : (currentUser ? (currentUser.email || '').toLowerCase() : '');
    const activeUid = authUser ? authUser.uid : (currentUser ? currentUser.id : '');

    if (activeEmail || activeUid) {
      const match = usuarios.find(u => u && (u.id === activeUid || (u.email && u.email.toLowerCase() === activeEmail)));
      if (match) {
        currentUser = match;
        localStorage.setItem("festo_gt_user", JSON.stringify(currentUser));
        if (typeof updateAuthUI === 'function') updateAuthUI();
      }
    }

    if (typeof renderUsersTable === 'function') renderUsersTable();
    if (typeof renderAll === 'function') renderAll();
  }, err => console.warn("Error snapshot usuarios:", err.message));
}

async function autoSyncUsersToFirestore() {
  if (!dbFs || !isFirebaseConnected) return;
  try {
    const snap = await dbFs.collection("usuarios").get();
    if (snap.empty) {
      console.log("🔥 Sembrando usuario Coordinador en Cloud Firestore...");
      const defaultCoord = {
        id: "YN8KgpP4RrcHC7YrYm30rBHLFxt1",
        nombre: "Israel Pavelek",
        apellido: "Coordinador General ETRR",
        email: "ipavelek@gmail.com",
        rol: "coordinador",
        escuela_id: null
      };
      await dbFs.collection("usuarios").doc(defaultCoord.id).set(defaultCoord, { merge: true });
    }
  } catch(e) {
    console.warn("Auto sync usuarios error:", e);
  }
}

// Función auxiliar para subir / sincronizar datos individuales a Firestore
async function syncToFirestore(collectionName, docId, data) {
  if (dbFs && isFirebaseConnected) {
    try {
      const cleanData = JSON.parse(JSON.stringify(data));
      await dbFs.collection(collectionName).doc(docId).set(cleanData, { merge: true });
      console.log(`🔥 Sincronizado a Firestore [${collectionName}/${docId}]`);
    } catch (err) {
      console.error(`Error al guardar en Firestore [${collectionName}/${docId}]:`, err);
    }
  }
}
