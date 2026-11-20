// Accesso con utenza personale (B0, Progetto R2-IVS).
// Ogni pagina lo importa come PRIMA riga del proprio script principale:
//     import "./auth-guard.js?v=10.12.0";
// Il `v` deve essere la stessa versione Firebase della pagina: così la pagina usa
// la stessa app già autenticata e le sue letture partono solo dopo il login.
const FB = "https://www.gstatic.com/firebasejs/" + (new URL(import.meta.url).searchParams.get("v") || "10.12.0");
const { initializeApp, getApps } = await import(FB + "/firebase-app.js");
const { getAuth, onAuthStateChanged, signOut } = await import(FB + "/firebase-auth.js");
const { getFirestore, doc, getDoc, addDoc, collection, serverTimestamp } = await import(FB + "/firebase-firestore.js");

const firebaseConfig = {
  apiKey: "AIzaSyDw6gFXrMA3hgShlk4S9XzYwBt2WGN6HKE",
  authDomain: "presenze2026.firebaseapp.com",
  projectId: "presenze2026",
  storageBucket: "presenze2026.firebasestorage.app",
  messagingSenderId: "1073603463859",
  appId: "1:1073603463859:web:23a1a363bbaabdc5077ec6"
};
const app = getApps()[0] || initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const fermati = () => new Promise(() => {});   // la pagina non prosegue
const pagina = location.pathname.split("/").pop() || "index.html";

const user = await new Promise(r => { const stop = onAuthStateChanged(auth, u => { stop(); r(u); }); });
if (!user) {
  sessionStorage.setItem("redirectAfterLogin", pagina + location.search);
  location.replace("login.html");
  await fermati();
}

const profilo = await getDoc(doc(db, "utenti", user.uid));
if (!profilo.exists() || !profilo.data().attivo) {
  await signOut(auth);
  location.replace("login.html");
  await fermati();
}
const u = profilo.data();
window.utenteCorrente = { uid: user.uid, email: user.email, nome: u.nome || user.email, ruolo: u.ruolo };

// Registro degli accessi: una riga per pagina aperta in questa sessione del browser
const chiave = "accesso:" + pagina;
if (!sessionStorage.getItem(chiave)) {
  sessionStorage.setItem(chiave, "1");
  addDoc(collection(db, "accessi"), {
    uid: user.uid, email: user.email, ruolo: u.ruolo, pagina, quando: serverTimestamp()
  }).catch(() => {});
}

// Barra utente: chi è entrato, ruolo, uscita
const RUOLI = { admin: "Amministratore", editor: "Modifica", viewer: "Sola lettura" };
const barra = document.createElement("div");
barra.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:99999;background:#1f2937;color:#fff;" +
  "font:500 12px/1.2 Inter,system-ui,sans-serif;padding:7px 10px;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,.25);" +
  "display:flex;gap:10px;align-items:center;opacity:.92";
barra.innerHTML = '<span></span>' +
  (u.ruolo === "admin" ? '<a href="admin-utenti.html" style="color:#93c5fd;text-decoration:none">Utenti</a>' : "") +
  '<a href="#" style="color:#fca5a5;text-decoration:none">Esci</a>';
barra.querySelector("span").textContent = (u.nome || user.email) + " · " + (RUOLI[u.ruolo] || u.ruolo);
barra.lastElementChild.onclick = async e => { e.preventDefault(); await signOut(auth); location.replace("login.html"); };
const monta = () => document.body.appendChild(barra);
document.body ? monta() : addEventListener("DOMContentLoaded", monta);
