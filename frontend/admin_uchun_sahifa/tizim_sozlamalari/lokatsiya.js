// Lokatsiya modulini yuklash
function loadLokatsiya(container) {
  const defaultAddress = "Toshkent axborot texnologiyalari universiteti Samarqand filiali";
  const savedAddress = localStorage.getItem("clinicAddress") || defaultAddress;

  container.innerHTML = `
    <h4 class="banner">🏥 Klinika manzili</h4>
    <label id="currentAddressLabel" class="form-label fade">
      Hozirgi klinika manzili: ${savedAddress}
    </label>
    <input type="text" id="addressInput" class="form-control mb-3" value="${savedAddress}">
    <div class="d-flex gap-2">
      <button class="btn btn-primary" onclick="showMap()">Xaritada ko‘rsatish</button>
      <button class="btn btn-warning" onclick="updateMap()">O‘zgartirish</button>
      <span id="successMessage" class="text-success" style="display:none;">✅ Manzil muvaffaqiyatli o‘zgartirildi!</span>
    </div>
    <div id="mapContainer" class="map-container mt-3"></div>
  `;
}

// Klinik manzil labelini animatsiya bilan yangilash
function updateLabel(newText) {
  const label = document.getElementById('currentAddressLabel');
  if (!label) return;
  label.classList.add('fade-out');
  setTimeout(() => {
    label.textContent = "Hozirgi klinika manzili: " + newText;
    label.classList.remove('fade-out');
    label.classList.add('fade-in');
  }, 600);
}

// Marker bounce effektini qo‘shish
function bounceMarker(marker) {
  if (marker && marker._icon) {
    marker._icon.classList.add("bounce");
    setTimeout(() => marker._icon.classList.remove("bounce"), 600);
  }
}

// Xarita ko‘rsatish
async function showMap() {
  const mapDiv = document.getElementById('mapContainer');
  if (!mapDiv) return;

  if (window.myMap) {
    window.myMap.remove();
  }

  const address = localStorage.getItem("clinicAddress") || "Samarqand";
  let lat = 39.6542, lon = 66.9597; // fallback Samarqand markazi

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await response.json();
    if (data && data.length > 0) {
      lat = parseFloat(data[0].lat);
      lon = parseFloat(data[0].lon);
    }
  } catch (error) {
    console.error(error);
  }

  window.myMap = L.map('mapContainer').setView([lat, lon], 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(window.myMap);

  window.myMarker = L.marker([lat, lon], { draggable: true }).addTo(window.myMap)
    .bindPopup('Klinika joylashuvi')
    .openPopup();

  window.myMarker.on('dragend', async function (e) {
    const latlng = e.target.getLatLng();
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        document.getElementById('addressInput').value = data.display_name;
        updateLabel(data.display_name);
        localStorage.setItem("clinicAddress", data.display_name);
        bounceMarker(window.myMarker);
      }
    } catch (error) {
      console.error(error);
    }
  });
}

// Inputdagi manzilni koordinataga aylantirib marker joyini o‘zgartirish
async function updateMap() {
  const addressInput = document.getElementById('addressInput');
  const address = addressInput?.value;
  if (!address) {
    alert("Manzil kiriting!");
    return;
  }

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await response.json();

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      const displayName = data[0].display_name;

      window.myMap.setView([lat, lon], 16);
      if (window.myMarker) {
        window.myMarker.setLatLng([lat, lon]);
      } else {
        window.myMarker = L.marker([lat, lon], { draggable: true }).addTo(window.myMap);
      }
      window.myMarker.bindPopup(displayName).openPopup();

      addressInput.value = displayName;
      updateLabel(displayName);
      localStorage.setItem("clinicAddress", displayName);
      bounceMarker(window.myMarker);

      const msg = document.getElementById('successMessage');
      if (msg) {
        msg.style.display = 'inline';
        setTimeout(() => msg.style.display = 'none', 3000);
      }
    } else {
      alert("Manzil topilmadi!");
    }
  } catch (error) {
    console.error(error);
    alert("Xatolik yuz berdi!");
  }
}
