// Modul tanlash
function toggleModule(card) {
  const title = card.querySelector('h5').textContent;
  const details = document.getElementById('moduleDetails');
  details.style.display = 'block';

  switch (title) {
    case 'Lokatsiya sozlamalari':
      if (typeof loadLokatsiya === "function") {
        loadLokatsiya(details);
      }
      break;

    case 'Ijtimoiy tarmoqlar':
      if (typeof loadSocialModule === "function") {
        loadSocialModule(details);
      }
      break;

    case 'Ish vaqti':
      if (typeof loadWorkingHoursModule === "function") {
        loadWorkingHoursModule(details);
      }
      break;

    case 'Xavfsizlik':
      if (typeof loadSecurityModule === "function") {
        loadSecurityModule(details);
      }
      break;

    default:
      details.innerHTML = `<p>Modul topilmadi.</p>`;
  }
}

// Chiqish
function chiqish() {
    if (confirm('Tizimdan chiqishni xohlaysizmi?')) {
        localStorage.clear();
        window.location.href = '../../index.html';
    }
}
