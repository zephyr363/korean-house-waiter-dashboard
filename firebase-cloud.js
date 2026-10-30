import {initializeApp} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {getFirestore,collection,doc,setDoc,deleteDoc,onSnapshot} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig={
  apiKey:"AIzaSyDSwOg6Bons-tS1_TAMHw0Aj9FGaRD82bU",
  authDomain:"korean-house-dashboard.firebaseapp.com",
  projectId:"korean-house-dashboard",
  storageBucket:"korean-house-dashboard.firebasestorage.app",
  messagingSenderId:"290707807400",
  appId:"1:290707807400:web:66a35a86eeb60bdbaaf69d",
  measurementId:"G-N0KR7CZRCP"
};
const app=initializeApp(firebaseConfig);
const auth=getAuth(app),db=getFirestore(app);
const bridge=window.khCloudBridge;
const screen=document.getElementById("receiptScreen");
const style=document.createElement("style");
style.textContent='.khAuthGate{display:none;position:fixed;inset:0;background:#091215f2;z-index:120;justify-content:center;align-items:center;padding:20px}.khAuthGate[data-locked="true"]{display:flex}.khAuthForm{background:#18282b;border:1px solid #43595a;border-radius:20px;max-width:390px;width:100%;padding:26px;color:#faf5ea;box-shadow:0 15px 65px #0009}.khAuthForm input{display:block;width:100%;margin:10px 0;padding:13px;background:#0c1719;border:1px solid #536668;border-radius:10px;color:#fff;font-size:16px}.khAuthForm button{padding:12px;background:#e6b76e;border:0;border-radius:10px;font-weight:800;width:100%;margin-top:8px;color:#142323}.khAuthForm .error{color:#ffb7ad;font-size:13px;margin-top:9px}.khCloudStatus{font-size:12px;color:#9cbaaf;margin:8px 0}.khSignOut{border:1px solid #506463;background:transparent;color:#d9e9dd;border-radius:8px;padding:8px;margin:0 0 10px}';
document.head.append(style);
const gate=document.createElement("div");
gate.className="khAuthGate";gate.dataset.locked="true";
gate.innerHTML='<form class="khAuthForm"><h2 style="margin:0 0 8px">Вход сотрудника</h2><p style="color:#9eb1b0;font-size:13px">Чтобы работать с общими чеками, войдите в учётную запись, созданную администратором в Firebase.</p><label>Электронная почта<input id="khEmail" type="email" required autocomplete="username"></label><label>Пароль<input id="khPassword" type="password" required autocomplete="current-password"></label><button type="submit">Войти к чекам</button><p class="error" id="khLoginError"></p></form>';
document.body.append(gate);
const status=document.createElement("div");status.className="khCloudStatus";status.textContent="Подключение к общей базе…";
const signOutButton=document.createElement("button");signOutButton.className="khSignOut";signOutButton.textContent="Выйти из учётной записи";signOutButton.onclick=()=>signOut(auth);
document.querySelector("#receiptScreen .rcHead")?.after(status,signOutButton);
gate.querySelector("form").onsubmit=async e=>{
 e.preventDefault();const err=document.getElementById("khLoginError");err.textContent="Выполняется вход…";
 try{await signInWithEmailAndPassword(auth,document.getElementById("khEmail").value.trim(),document.getElementById("khPassword").value);document.getElementById("khPassword").value="";err.textContent="";}
 catch(error){err.textContent="Не удалось войти. Проверьте данные и настройки Authentication.";}
};
let unsubscribe=null,ready=false,remote=new Map(),pending=new Map(),user=null;
const receipts=collection(db,"receipts");
bridge.ready=false;
bridge.save=(checks)=>{
 if(!ready||!user)return;
 const desired=new Map(checks.map(c=>[String(c.id),structuredClone(c)]));
 for(const [id,check] of desired){
   if(JSON.stringify(remote.get(id))===JSON.stringify(check))continue;
   remote.set(id,check);
   const op=setDoc(doc(receipts,id),check);
   pending.set(id,op);
   op.catch(e=>{status.textContent="Ошибка сохранения: "+e.code;console.error(e)}).finally(()=>{if(pending.get(id)===op)pending.delete(id)});
 }
 for(const id of [...remote.keys()]){
   if(desired.has(id))continue;
   remote.delete(id);
   const op=deleteDoc(doc(receipts,id));
   pending.set(id,op);
   op.catch(e=>{status.textContent="Ошибка удаления: "+e.code;console.error(e)}).finally(()=>{if(pending.get(id)===op)pending.delete(id)});
 }
};
onAuthStateChanged(auth,account=>{
 if(unsubscribe){unsubscribe();unsubscribe=null;}
 user=account;ready=false;bridge.ready=false;remote=new Map();pending=new Map();
 gate.dataset.locked=account?"false":"true";
 signOutButton.style.display=account?"inline-block":"none";
 bridge.userId=account?.uid||null;
 bridge.setChecks([]);
 if(!account){status.textContent="Для работы с чеками требуется вход";return;}
 status.textContent="Подключение к общим чекам…";
 unsubscribe=onSnapshot(receipts,snapshot=>{
   const incoming=new Map(snapshot.docs.map(d=>[d.id,d.data()]));
   // Данные локальных незавершённых записей не заменяются устаревшими снимками.
   for(const [id,op] of pending){
     if(remote.has(id))incoming.set(id,remote.get(id));
     else incoming.delete(id);
   }
   remote=incoming;
   bridge.setChecks([...remote.values()].sort((a,b)=>String(a.created||"").localeCompare(String(b.created||""))));
   ready=true;bridge.ready=true;
   status.textContent="● Общая база подключена · "+account.email;
 },error=>{status.textContent="Ошибка Firestore: "+error.code;console.error(error)});
});
