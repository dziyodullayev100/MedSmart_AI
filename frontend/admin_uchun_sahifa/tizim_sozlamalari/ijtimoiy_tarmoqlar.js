// Font Awesome ikonkalari lug‘ati
const SOCIAL_ICONS = {
  facebook: "<i class='fab fa-facebook'></i>",
  instagram: "<i class='fab fa-instagram'></i>",
  telegram: "<i class='fab fa-telegram'></i>",
  youtube: "<i class='fab fa-youtube'></i>",
  tiktok: "<i class='fab fa-tiktok'></i>",
  linkedin: "<i class='fab fa-linkedin'></i>"
};

function loadSocialModule(container) {
  const links = JSON.parse(localStorage.getItem("socialLinks")) || {};

  container.innerHTML = `
    <h4 class="banner">🌐 Ijtimoiy tarmoqlar</h4>
    <div class="social-form">
      ${renderInput("facebook", "Facebook", links.facebook)}
      ${renderInput("instagram", "Instagram", links.instagram)}
      ${renderInput("telegram", "Telegram", links.telegram)}
      ${renderInput("youtube", "YouTube", links.youtube)}
      ${renderInput("tiktok", "TikTok", links.tiktok)}
      ${renderInput("linkedin", "LinkedIn", links.linkedin)}

      <button onclick="saveSocialLinks()">Saqlash</button>
      <button onclick="showSocialLinks()">Ko‘rsatish</button>
      <div id="socialMessage" class="social-message"></div>
      <div id="socialPreview" class="social-preview"></div>
    </div>
  `;
}

function renderInput(id, label, value = "") {
  return `
    <label for="${id}">${SOCIAL_ICONS[id]} ${label}</label>
    <input type="url" id="${id}" placeholder="https://${id}.com/..." value="${value}">
  `;
}

function saveSocialLinks() {
  const links = {
    facebook: document.getElementById("facebook").value,
    instagram: document.getElementById("instagram").value,
    telegram: document.getElementById("telegram").value,
    youtube: document.getElementById("youtube").value,
    tiktok: document.getElementById("tiktok").value,
    linkedin: document.getElementById("linkedin").value
  };
  localStorage.setItem("socialLinks", JSON.stringify(links));
  const msg = document.getElementById("socialMessage");
  msg.textContent = "✅ Ijtimoiy tarmoqlar muvaffaqiyatli saqlandi!";
  setTimeout(() => msg.textContent = "", 3000);
}

function showSocialLinks() {
  const links = JSON.parse(localStorage.getItem("socialLinks")) || {};
  let html = "<h5>🔗 Klinikaga tegishli ijtimoiy tarmoqlar:</h5><ul>";
  for (const [key, value] of Object.entries(links)) {
    if (value) {
      html += `<li>${SOCIAL_ICONS[key]} <a href="${value}" target="_blank">${key}</a></li>`;
    }
  }
  html += "</ul>";
  document.getElementById("socialPreview").innerHTML = html;
}
