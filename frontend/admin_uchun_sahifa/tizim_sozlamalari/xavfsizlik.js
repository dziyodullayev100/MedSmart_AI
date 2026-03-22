// === Xavfsizlik moduli: rollar, parol siyosati, kirish nazorati, navbat xavfsizligi, loglar ===

function loadSecurityModule(container) {
  const currentRole = localStorage.getItem("currentRole") || "reception";

  container.innerHTML = `
    <h4 class="banner">🔐 Xavfsizlik sozlamalari</h4>

    <!-- Rollar boshqaruvi -->
    <section class="security-section">
      <h5>👥 Rollar boshqaruvi</h5>
      <label for="userRole">Foydalanuvchi roli</label>
      <select id="userRole" class="form-select">
        <option value="admin" ${currentRole==="admin"?"selected":""}>Admin</option>
        <option value="doctor" ${currentRole==="doctor"?"selected":""}>Shifokor</option>
        <option value="reception" ${currentRole==="reception"?"selected":""}>Qabulxona</option>
        <option value="patient" ${currentRole==="patient"?"selected":""}>Bemor</option>
      </select>
      <button class="btn btn-save" onclick="saveRole()">Rolni saqlash</button>
      <div id="roleMessage" class="msg"></div>
      <div id="permissionMatrix" class="matrix"></div>
    </section>




    <!-- Parol siyosati va tiklash -->
<section class="security-section">
  <h5>🔑 Parol siyosati</h5>

  <label>Minimal uzunlik</label>
  <input type="number" id="minLengthInput" class="form-control" min="4" max="32"
         onchange="setPolicy('minLength', parseInt(this.value))">

  <label>Parol muddati (kunlarda)</label>
  <input type="number" id="expiryDays" class="form-control" min="30" max="365"
         onchange="setPolicy('expiryDays', parseInt(this.value))">

  <label>Oldingi parollarni qayta ishlatmaslik (N ta)</label>
  <input type="number" id="preventReuse" class="form-control" min="1" max="10"
         onchange="setPolicy('preventReuse', parseInt(this.value))">

  <label>Login urinishlari limiti</label>
  <input type="number" id="maxLoginAttempts" class="form-control" min="1" max="10"
         onchange="setPolicy('maxLoginAttempts', parseInt(this.value))">

  <div class="form-check">
    <input type="checkbox" id="require2FA" class="form-check-input"
           onchange="setPolicy('require2FA', this.checked)">
    <label for="require2FA" class="form-check-label">Captcha (“Men robot emasman”) tekshiruvi</label>
  </div>

  <div class="form-check">
    <input type="checkbox" id="require2FA" class="form-check-input"
           onchange="setPolicy('require2FA', this.checked)">
    <label for="require2FA" class="form-check-label">Ikki faktorli autentifikatsiya majburiy</label>
  </div>

  <div class="form-check">
    <input type="checkbox" id="onlyNumbers" class="form-check-input"
           onchange="setPolicy('onlyNumbers', this.checked)">
    <label for="onlyNumbers" class="form-check-label">Faqat sonlardan iborat bo‘lsin</label>
  </div>
  <div class="form-check">
    <input type="checkbox" id="requireUppercase" class="form-check-input"
           onchange="setPolicy('requireUppercase', this.checked)">
    <label for="requireUppercase" class="form-check-label">Katta harf majburiy</label>
  </div>
  <div class="form-check">
    <input type="checkbox" id="requireLowercase" class="form-check-input"
           onchange="setPolicy('requireLowercase', this.checked)">
    <label for="requireLowercase" class="form-check-label">Kichik harf majburiy</label>
  </div>
  <div class="form-check">
    <input type="checkbox" id="requireNumber" class="form-check-input"
           onchange="setPolicy('requireNumber', this.checked)">
    <label for="requireNumber" class="form-check-label">Raqam majburiy</label>
  </div>
  <div class="form-check">
    <input type="checkbox" id="requireSpecial" class="form-check-input"
           onchange="setPolicy('requireSpecial', this.checked)">
    <label for="requireSpecial" class="form-check-label">Maxsus belgi majburiy</label>
  </div>
  <!-- Parol tiklash -->
  <label for="newPassword">Yangi parol</label>
  <input type="password" id="newPassword" class="form-control" placeholder="Parol kiriting">
  <button class="btn btn-warn mt-2" onclick="resetPassword()">Parolni tiklash</button>
  <div id="passwordMessage" class="msg"></div>
</section>
</section>



    <!-- Navbat xavfsizligi siyosatlari -->
    <section class="security-section">
  <h5>📏 Navbat xavfsizligi siyosatlari</h5>

  <label>Bayramda navbatni bloklash</label>
  <select id="blockOnHoliday" class="form-select">
    <option value="true">Ha</option>
    <option value="false">Yo‘q</option>
  </select>

  <label>Bir bemorga bir vaqtda 1 navbat</label>
  <select id="singleQueuePerPatient" class="form-select">
    <option value="true">Ha</option>
    <option value="false">Yo‘q</option>
  </select>

  <label>Ish vaqtidan tashqariga ruxsat</label>
  <select id="allowOutsideWorkingHours" class="form-select">
    <option value="false">Yo‘q</option>
    <option value="true">Ha</option>
  </select>

  <label>Minimal bekor qilish vaqti (soatlarda)</label>
  <input type="number" id="minCancelHours" class="form-control" value="2" min="1" max="24"
         onchange="setQueuePolicy('minCancelHours', parseInt(this.value,10))">

  <label>Shifokor kunlik maksimal navbat soni</label>
  <input type="number" id="doctorDailyLimit" class="form-control" value="20" min="1" max="50"
         onchange="setQueuePolicy('doctorDailyLimit', parseInt(this.value,10))">

  <label>Bemor kunlik maksimal navbat soni</label>
  <input type="number" id="patientDailyLimit" class="form-control" value="2" min="1" max="10"
         onchange="setQueuePolicy('patientDailyLimit', parseInt(this.value,10))">

  <label>Klinika kunlik maksimal navbat soni</label>
  <input type="number" id="clinicDailyLimit" class="form-control" value="100" min="10" max="500"
         onchange="setQueuePolicy('clinicDailyLimit', parseInt(this.value,10))">

  <button class="btn btn-save mt-2" onclick="saveQueuePolicies()">Siyosatlarni saqlash</button>
  <div id="policyMessage" class="msg"></div>
</section>




    <!-- Loglar -->
    <section class="security-section">
      <h5>🧾 Loglar va monitoring</h5>
      <div id="securityLogs" class="logs"></div>
      <button class="btn btn-warn mt-2" onclick="clearLogs()">Loglarni tozalash</button>
    </section>
  `;

  renderPermissionMatrix(currentRole);
  loadQueuePoliciesUI();
  showLogs();
}

/* ===== Rollar va huquqlar ===== */
const PERMISSIONS = JSON.parse(localStorage.getItem("permissions")) || {
  admin: { addQueue:true, editQueue:true, deleteQueue:true, manageUsers:true, viewAll:true, viewStats:true, manageDiscounts:true, manageHolidays:true, manageSecurity:true },
  doctor:{ addQueue:true, editQueue:true, deleteQueue:false, manageUsers:false, viewAll:false, viewStats:true, manageDiscounts:false, manageHolidays:false, manageSecurity:false },
  reception:{ addQueue:true, editQueue:true, deleteQueue:true, manageUsers:false, viewAll:true, viewStats:true, manageDiscounts:true, manageHolidays:false, manageSecurity:false },
  patient:{ addQueue:true, editQueue:false, deleteQueue:false, manageUsers:false, viewAll:false, viewStats:false, manageDiscounts:false, manageHolidays:false, manageSecurity:false }
};

function saveRole() {
  const role = document.getElementById("userRole").value;
  localStorage.setItem("currentRole", role);
  document.getElementById("roleMessage").textContent = "✅ Rol saqlandi!";
  renderPermissionMatrix(role);
  logAction(`Rol o‘rnatildi: ${role}`);
}

function renderPermissionMatrix(role) {
  const perms = PERMISSIONS[role] || {};
  const labelMap = {
    addQueue:"Navbat qo‘shish", editQueue:"Navbatni o‘zgartirish", deleteQueue:"Navbatni o‘chirish",
    manageUsers:"Foydalanuvchilarni boshqarish", viewAll:"Hamma navbatlarni ko‘rish", viewStats:"Statistikani ko‘rish",
    manageDiscounts:"Skidkalarni boshqarish", manageHolidays:"Bayram kunlarini boshqarish", manageSecurity:"Xavfsizlik sozlamalarini o‘zgartirish"
  };
  const rows = Object.entries(perms).map(([key,value])=>`
    <tr class="perm-row ${value?'allowed':'denied'}">
      <td>${labelMap[key]}</td>
      <td class="perm-icon" onclick="togglePermission('${role}','${key}')">${value?"✅":"❌"}</td>
    </tr>`).join("");
  document.getElementById("permissionMatrix").innerHTML = `
    <table class="perm-table"><thead><tr><th>Amal</th><th>Ruxsat</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function togglePermission(role,key){
  PERMISSIONS[role][key]=!PERMISSIONS[role][key];
  localStorage.setItem("permissions",JSON.stringify(PERMISSIONS));
  renderPermissionMatrix(role);
  logAction(`Rol ${role} uchun "${key}" huquqi ${PERMISSIONS[role][key]?'yoqildi':'o‘chirildi'}`);
}

/* ===== Parol siyosati ===== */
const PASSWORD_POLICY = JSON.parse(localStorage.getItem("passwordPolicy")) || {
  minLength: 8,
  expiryDays: 90,          // parol muddati (kunlarda)
  preventReuse: 5,         // oxirgi N ta parolni qayta ishlatmaslik
  maxLoginAttempts: 3,     // login urinishlari limiti
  require2FA: false,       // ikki faktorli autentifikatsiya majburiy
  onlyNumbers: false,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true
};

function setPolicy(option, value){
  PASSWORD_POLICY[option] = value;
  localStorage.setItem("passwordPolicy", JSON.stringify(PASSWORD_POLICY));
  logAction(`Parol siyosati o‘zgartirildi: ${option} = ${value}`);
}

function loadPolicyUI(){
  document.getElementById("minLengthInput").value = PASSWORD_POLICY.minLength;
  document.getElementById("expiryDays").value = PASSWORD_POLICY.expiryDays;
  document.getElementById("preventReuse").value = PASSWORD_POLICY.preventReuse;
  document.getElementById("maxLoginAttempts").value = PASSWORD_POLICY.maxLoginAttempts;
  document.getElementById("require2FA").checked = PASSWORD_POLICY.require2FA;
  document.getElementById("onlyNumbers").checked = PASSWORD_POLICY.onlyNumbers;
  document.getElementById("requireUppercase").checked = PASSWORD_POLICY.requireUppercase;
  document.getElementById("requireLowercase").checked = PASSWORD_POLICY.requireLowercase;
  document.getElementById("requireNumber").checked = PASSWORD_POLICY.requireNumber;
  document.getElementById("requireSpecial").checked = PASSWORD_POLICY.requireSpecial;
}

// Parolni tekshirish
function validatePassword(password){
  if(password.length < PASSWORD_POLICY.minLength) return false;

  // Agar faqat sonlardan iborat bo‘lishi kerak bo‘lsa
  if(PASSWORD_POLICY.onlyNumbers && !/^[0-9]+$/.test(password)) return false;

  if(PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) return false;
  if(PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) return false;
  if(PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password)) return false;
  if(PASSWORD_POLICY.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

  return true;
}

// Log funksiyasi
function logAction(action){
  console.log("LOG:", action);
}



/* ===== Navbat xavfsizligi siyosatlari ===== */

const DEFAULT_QUEUE_POLICIES = {
  blockOnHoliday: true,
  singleQueuePerPatient: true,
  allowOutsideWorkingHours: false,
  minCancelHours: 2,
  doctorDailyLimit: 20,
  patientDailyLimit: 2,
  clinicDailyLimit: 100
};

function loadQueuePolicies() {
  const saved = JSON.parse(localStorage.getItem("queuePolicies"));
  return saved || DEFAULT_QUEUE_POLICIES;
}

function setQueuePolicy(option, value){
  const policies = loadQueuePolicies();
  policies[option] = value;
  localStorage.setItem("queuePolicies", JSON.stringify(policies));
}

function saveQueuePolicies() {
  const policies = {
    blockOnHoliday: document.getElementById("blockOnHoliday").value === "true",
    singleQueuePerPatient: document.getElementById("singleQueuePerPatient").value === "true",
    allowOutsideWorkingHours: document.getElementById("allowOutsideWorkingHours").value === "true",
    minCancelHours: parseInt(document.getElementById("minCancelHours").value,10),
    doctorDailyLimit: parseInt(document.getElementById("doctorDailyLimit").value,10),
    patientDailyLimit: parseInt(document.getElementById("patientDailyLimit").value,10),
    clinicDailyLimit: parseInt(document.getElementById("clinicDailyLimit").value,10)
  };
  localStorage.setItem("queuePolicies", JSON.stringify(policies));
  document.getElementById("policyMessage").textContent = "✅ Siyosatlar saqlandi!";
  setTimeout(() => document.getElementById("policyMessage").textContent = "", 2500);
}

function loadQueuePoliciesUI() {
  const p = loadQueuePolicies();
  document.getElementById("blockOnHoliday").value = String(p.blockOnHoliday);
  document.getElementById("singleQueuePerPatient").value = String(p.singleQueuePerPatient);
  document.getElementById("allowOutsideWorkingHours").value = String(p.allowOutsideWorkingHours);
  document.getElementById("minCancelHours").value = p.minCancelHours;
  document.getElementById("doctorDailyLimit").value = p.doctorDailyLimit;
  document.getElementById("patientDailyLimit").value = p.patientDailyLimit;
  document.getElementById("clinicDailyLimit").value = p.clinicDailyLimit;
}

/* Bekor qilish tekshiruvi */
function canCancelQueue(queue){
  const policies = loadQueuePolicies();
  const now = new Date();
  const queueTime = new Date(`${queue.date}T${queue.time}`);
  const diffHours = (queueTime - now) / (1000*60*60);
  if(diffHours < policies.minCancelHours){
    return { ok: false, reason: "❌ Juda kech bekor qilish taqiqlanadi" };
  }
  return { ok: true, reason: "✅ Bekor qilish mumkin" };
}

/* Shifokor va bemor limitlari */
function canAddQueue({ patientName, doctorName, date, time }) {
  const role = localStorage.getItem("currentRole") || "reception";
  const policies = loadQueuePolicies();
  const queues = JSON.parse(localStorage.getItem("navbatlar")) || [];

  // Admin/shifokor imtiyozi
  if((role === "admin" || role === "doctor")){
    // Bayram va ish vaqtidan tashqarida ham qo‘shishi mumkin
  } else {
    if(policies.blockOnHoliday && isHoliday(date)) {
      return { ok: false, reason: "Bayram kuni navbat qo‘shib bo‘lmaydi" };
    }
    const hours = JSON.parse(localStorage.getItem("workingHours")) || { start: "09:00", end: "18:00" };
    if(!policies.allowOutsideWorkingHours && (time < hours.start || time > hours.end)) {
      return { ok: false, reason: "Ish vaqtidan tashqarida navbat qo‘shib bo‘lmaydi" };
    }
  }

  // Shifokor kunlik limiti
  const doctorQueues = queues.filter(q => q.doctor === doctorName && q.date === date);
  if(doctorQueues.length >= policies.doctorDailyLimit){
    return { ok: false, reason: "Shifokor kunlik limitdan oshib ketdi" };
  }

  // Bemor kunlik limiti
  const patientQueues = queues.filter(q => q.patient === patientName && q.date === date);
  if(patientQueues.length >= policies.patientDailyLimit){
    return { ok: false, reason: "Bemor kunlik limitdan oshib ketdi" };
  }

  // Klinika kunlik limiti
  const clinicQueues = queues.filter(q => q.date === date);
  if(clinicQueues.length >= policies.clinicDailyLimit){
    return { ok: false, reason: "Klinika kunlik limitdan oshib ketdi" };
  }

  return { ok: true, reason: "✅ Ruxsat berildi" };
}




/* ===== Loglar va monitoring ===== */

function logAction(action) {
  const logs = JSON.parse(localStorage.getItem("securityLogs")) || [];
  logs.push({ action, time: new Date().toLocaleString() });
  localStorage.setItem("securityLogs", JSON.stringify(logs));
  showLogs();
}

function showLogs() {
  const logs = JSON.parse(localStorage.getItem("securityLogs")) || [];
  const html = `
    <table class="log-table">
      <thead><tr><th>Vaqt</th><th>Amal</th></tr></thead>
      <tbody>
        ${logs.map(l => `<tr><td>${l.time}</td><td>${l.action}</td></tr>`).join("")}
      </tbody>
    </table>
  `;
  document.getElementById("securityLogs").innerHTML = html;
}

function clearLogs() {
  localStorage.removeItem("securityLogs");
  showLogs();
}
