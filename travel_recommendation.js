// ===== GLOBAL DEĞİŞKENLER =====
let travelData = null;

// ===== JSON VERİSİNİ FETCH İLE ÇEK =====
function fetchTravelData() {
  fetch('travel_recommendation_api.json')
    .then(response => response.json())
    .then(data => {
      travelData = data;
      console.log('Travel data successfully uploaded:', travelData);
    })
    .catch(error => {
      console.error('An error occurred while loading data:', error);
    });
}

// Sayfa yüklendiğinde veriyi çek
fetchTravelData();

// ===== SAYFA GEÇİŞLERİ =====
function showPage(pageId) {
  // Tüm sayfaları gizle
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Tüm nav linklerinin active sınıfını kaldır
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

  // Seçilen sayfayı ve nav linkini aktif yap
  document.getElementById(pageId).classList.add('active');
  document.getElementById('nav-' + pageId).classList.add('active');

  // Arama çubuğunu sadece Ana Sayfa'da göster
  const searchBar = document.getElementById('searchBar');
  searchBar.style.display = (pageId === 'home') ? 'flex' : 'none';

  // Sayfa değiştiğinde sonuçları temizle
  if (pageId !== 'home') {
    resetSearch();
  }
}

// ===== ARAMA FONKSİYONU =====
function search() {
  const raw = document.getElementById('searchInput').value.trim();
  if (!raw) return;

  // Anahtar kelimeyi küçük harfe çevir (toLowerCase)
  const keyword = raw.toLowerCase();

  let results = [];
  let title = '';

  if (!travelData) {
    console.error('The data has not been loaded yet!');
    return;
  }

  // ----- PLAJ anahtar kelimeleri -----
  if (['plaj', 'plajlar', 'beach', 'beaches'].includes(keyword)) {
    results = travelData.beaches.map(item => ({
      name: item.name,
      imageUrl: item.imageUrl,
      description: item.description
    }));
    title = '🏖️ Beach Recommendations';
  }
  // ----- TAPINAK anahtar kelimeleri -----
  else if (['tapınak', 'tapınaklar', 'temple', 'temples'].includes(keyword)) {
    results = travelData.temples.map(item => ({
      name: item.name,
      imageUrl: item.imageUrl,
      description: item.description
    }));
    title = '🛕 Temples Recommendations';
  }
  // ----- ÜLKE anahtar kelimeleri -----
  else if (['ülke', 'ülkeler', 'country', 'countries'].includes(keyword)) {
    // Ülkelerdeki tüm şehirleri listele
    results = [];
    travelData.countries.forEach(country => {
      country.cities.forEach(city => {
        results.push({
          name: city.name,
          imageUrl: city.imageUrl,
          description: city.description,
          country: country.name
        });
      });
    });
    title = '🌍 Country Recommendations';
  }
  // ----- BELİRLİ ÜLKE ADI ARAMA (ör: "australia", "japan", "brazil") -----
  else {
    const matchedCountry = travelData.countries.find(
      c => c.name.toLowerCase().includes(keyword)
    );

    if (matchedCountry) {
      results = matchedCountry.cities.map(city => ({
        name: city.name,
        imageUrl: city.imageUrl,
        description: city.description,
        country: matchedCountry.name
      }));
      title = `🌍 ${matchedCountry.name} Recommendations`;
    } else {
      // Genel arama: tüm verilerde ara
      const allItems = [
        ...travelData.beaches,
        ...travelData.temples
      ];

      // Ülkelerin şehirlerini de ekle
      travelData.countries.forEach(country => {
        country.cities.forEach(city => {
          allItems.push({
            name: city.name,
            imageUrl: city.imageUrl,
            description: city.description,
            country: country.name
          });
        });
      });

      results = allItems.filter(item =>
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword)
      );
      title = `"${raw}" for results`;
    }
  }

  displayResults(results, title);
}

// ===== SONUÇLARI GÖRÜNTÜLE =====
function displayResults(results, title) {
  const section = document.getElementById('results-section');
  const grid = document.getElementById('resultsGrid');
  const titleEl = document.getElementById('results-title');

  // Sonuç yoksa bilgi mesajı göster
  if (results.length === 0) {
    titleEl.textContent = 'No results found';
    grid.innerHTML = '<p style="color:#888;">Please try a different keyword: beach, temple, or country.</p>';
    section.style.display = 'block';
    return;
  }

  titleEl.textContent = title;
  grid.innerHTML = '';

  results.forEach(item => {
    // Ülke saati (isteğe bağlı - Görev 10)
    let timeHTML = '';
    const timeZone = getTimeZone(item.name, item.country);
    if (timeZone) {
      const opts = {
        timeZone: timeZone,
        hour12: true,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      };
      const localTime = new Date().toLocaleTimeString('en-US', opts);
      timeHTML = `<div class="time-info">🕐 Local Time: ${localTime}</div>`;
    }

    // Kart oluştur
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
      <img src="${item.imageUrl}" alt="${item.name}"
           onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600'">
      <div class="card-body">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        ${timeHTML}
      </div>
    `;
    grid.appendChild(card);
  });

  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== ÜLKE SAAT DİLİMİ (Görev 10) =====
function getTimeZone(name, country) {
  const n = (name || '').toLowerCase();
  const c = (country || '').toLowerCase();

  if (n.includes('sydney') || c.includes('australia'))  return 'Australia/Sydney';
  if (n.includes('melbourne'))                          return 'Australia/Melbourne';
  if (n.includes('tokyo') || c.includes('japan'))       return 'Asia/Tokyo';
  if (n.includes('kyoto'))                              return 'Asia/Tokyo';
  if (n.includes('rio') || c.includes('brazil'))        return 'America/Sao_Paulo';
  if (n.includes('são paulo') || n.includes('sao paulo')) return 'America/Sao_Paulo';
  if (n.includes('bora bora'))                          return 'Pacific/Tahiti';
  if (n.includes('angkor'))                             return 'Asia/Phnom_Penh';
  if (n.includes('taj mahal') || n.includes('india'))   return 'Asia/Kolkata';
  if (n.includes('copacabana'))                         return 'America/Sao_Paulo';

  return null;
}

// ===== SIFIRLAMA / TEMİZLEME (Görev 9) =====
function resetSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('resultsGrid').innerHTML = '';
  document.getElementById('results-section').style.display = 'none';
}

// ===== İLETİŞİM FORMU GÖNDER =====
function submitForm() {
  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const msg = document.getElementById('contactMessage').value.trim();

  if (!name || !email || !msg) {
    alert('Please fill in all fields.');
    return;
  }

  alert(`Thank you, ${name}! Your message has been successfully sent.`);
  document.getElementById('contactName').value = '';
  document.getElementById('contactEmail').value = '';
  document.getElementById('contactMessage').value = '';
}
