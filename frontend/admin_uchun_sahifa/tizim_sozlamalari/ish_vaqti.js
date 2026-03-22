function loadWorkingHoursModule(container) {
  // HTML blokini modulga yuklash
  container.innerHTML = `
    <h4 class="banner">⏰ Ish vaqti va 💸 Skidkalar</h4>

    <!-- Ish vaqti boshqaruvi (hafta kunlari) -->
    <section class="security-section">
      <h5>⏰ Ish vaqti boshqaruvi (hafta kunlari)</h5>

      <div class="work-day">
        <label>Dushanba</label>
        <input type="time" id="monStart" value="09:00" onchange="setWorkingHours('mon','start',this.value)">
        <input type="time" id="monEnd" value="18:00" onchange="setWorkingHours('mon','end',this.value)">
      </div>

      <div class="work-day">
        <label>Seshanba</label>
        <input type="time" id="tueStart" value="09:00" onchange="setWorkingHours('tue','start',this.value)">
        <input type="time" id="tueEnd" value="18:00" onchange="setWorkingHours('tue','end',this.value)">
      </div>

      <div class="work-day">
        <label>Chorshanba</label>
        <input type="time" id="wedStart" value="09:00" onchange="setWorkingHours('wed','start',this.value)">
        <input type="time" id="wedEnd" value="18:00" onchange="setWorkingHours('wed','end',this.value)">
      </div>

      <div class="work-day">
        <label>Payshanba</label>
        <input type="time" id="thuStart" value="09:00" onchange="setWorkingHours('thu','start',this.value)">
        <input type="time" id="thuEnd" value="18:00" onchange="setWorkingHours('thu','end',this.value)">
      </div>

      <div class="work-day">
        <label>Juma</label>
        <input type="time" id="friStart" value="09:00" onchange="setWorkingHours('fri','start',this.value)">
        <input type="time" id="friEnd" value="18:00" onchange="setWorkingHours('fri','end',this.value)">
      </div>

      <div class="work-day">
        <label>Shanba</label>
        <input type="time" id="satStart" value="10:00" onchange="setWorkingHours('sat','start',this.value)">
        <input type="time" id="satEnd" value="16:00" onchange="setWorkingHours('sat','end',this.value)">
      </div>

      <div class="work-day">
        <label>Yakshanba</label>
        <input type="time" id="sunStart" value="00:00" onchange="setWorkingHours('sun','start',this.value)">
        <input type="time" id="sunEnd" value="00:00" onchange="setWorkingHours('sun','end',this.value)">
      </div>

      <button class="btn btn-save mt-2" onclick="saveWorkingHours()">Ish vaqtini saqlash</button>
      <div id="workMessage" class="msg"></div>
    </section>

    <!-- Skidkalar boshqaruvi -->
    <section class="security-section">
      <h5>💸 Skidkalar boshqaruvi</h5>

      <label>Skidka foizi (%)</label>
      <input type="number" id="discountPercent" class="form-control" value="10" min="0" max="100"
             onchange="setDiscount('percent', parseInt(this.value,10))">

      <label>Skidka amal qilish muddati (kunlarda)</label>
      <input type="number" id="discountDays" class="form-control" value="30" min="1" max="365"
             onchange="setDiscount('days', parseInt(this.value,10))">

      <div class="form-check">
        <input type="checkbox" id="discountActive" class="form-check-input"
               onchange="setDiscount('active', this.checked)">
        <label for="discountActive" class="form-check-label">Skidka faol</label>
      </div>

      <button class="btn btn-save mt-2" onclick="saveDiscount()">Skidkani saqlash</button>
      <div id="discountMessage" class="msg"></div>
    </section>
  `;

  // UI elementlarini localStorage’dagi qiymatlar bilan to‘ldirish
  loadWorkingHoursUI();
  loadDiscountUI();
}

/* ===== Ish vaqti boshqaruvi ===== */
function loadWorkingHours(){
  const saved = JSON.parse(localStorage.getItem("workingHours"));
  return saved || {
    mon:{start:"09:00",end:"18:00"},
    tue:{start:"09:00",end:"18:00"},
    wed:{start:"09:00",end:"18:00"},
    thu:{start:"09:00",end:"18:00"},
    fri:{start:"09:00",end:"18:00"},
    sat:{start:"10:00",end:"16:00"},
    sun:{start:"00:00",end:"00:00"}
  };
}

function setWorkingHours(day, type, value){
  const hours = loadWorkingHours();
  hours[day][type] = value;
  localStorage.setItem("workingHours", JSON.stringify(hours));
}

function saveWorkingHours(){
  document.getElementById("workMessage").textContent = "✅ Ish vaqti saqlandi!";
  setTimeout(()=>document.getElementById("workMessage").textContent="",2500);
}

function loadWorkingHoursUI(){
  const h = loadWorkingHours();
  for(const d in h){
    document.getElementById(d+"Start").value = h[d].start;
    document.getElementById(d+"End").value = h[d].end;
  }
}

/* ===== Skidkalar boshqaruvi ===== */
function loadDiscount(){
  const saved = JSON.parse(localStorage.getItem("discountPolicy"));
  return saved || { percent:10, days:30, active:true };
}

function setDiscount(option, value){
  const d = loadDiscount();
  d[option] = value;
  localStorage.setItem("discountPolicy", JSON.stringify(d));
}

function saveDiscount(){
  document.getElementById("discountMessage").textContent = "✅ Skidka saqlandi!";
  setTimeout(()=>document.getElementById("discountMessage").textContent="",2500);
}

function loadDiscountUI(){
  const d = loadDiscount();
  document.getElementById("discountPercent").value = d.percent;
  document.getElementById("discountDays").value = d.days;
  document.getElementById("discountActive").checked = d.active;
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("moduleDetails");
  loadWorkingHoursModule(container);
});





