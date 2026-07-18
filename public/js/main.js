document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const mastersContainer = document.getElementById('masters-container');
  const blackbeltsContainer = document.getElementById('blackbelts-container');
  const dojosListContainer = document.getElementById('dojos-list-container');
  const googleMapContainer = document.getElementById('google-map-container');
  const statsDojoCount = document.getElementById('stats-dojo-count');

  // Load page content
  fetchMasters();
  fetchBlackBelts();
  fetchDojos();

  // Highlight active nav item on scroll
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.main-nav a');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 150; // offset for sticky header

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // Mobile Nav Toggle
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (mobileNavToggle && mainNav) {
    mobileNavToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      mainNav.classList.toggle('active');
      const icon = mobileNavToggle.querySelector('i');
      if (mainNav.classList.contains('active')) {
        icon.className = 'fa-solid fa-xmark';
      } else {
        icon.className = 'fa-solid fa-bars';
      }
    });

    // Close mobile nav when clicking a link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('active');
        const icon = mobileNavToggle.querySelector('i');
        icon.className = 'fa-solid fa-bars';
      });
    });

    // Close mobile nav when clicking anywhere else
    document.addEventListener('click', (e) => {
      if (!mainNav.contains(e.target) && !mobileNavToggle.contains(e.target)) {
        mainNav.classList.remove('active');
        const icon = mobileNavToggle.querySelector('i');
        icon.className = 'fa-solid fa-bars';
      }
    });
  }

  // Helper to show premium loading spinner
  function showLoading(container, message = 'Loading...') {
    container.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">${message}</div>
      </div>
    `;
  }

  // Helper to show custom error message with retry button
  function showErrorMessage(container, message, retryCallback) {
    container.innerHTML = '';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-container';

    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-circle-exclamation error-icon';
    errorDiv.appendChild(icon);

    const msg = document.createElement('p');
    msg.className = 'error-message';
    msg.textContent = message;
    errorDiv.appendChild(msg);

    const btn = document.createElement('button');
    btn.className = 'btn-retry';
    btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Retry';
    btn.addEventListener('click', retryCallback);
    errorDiv.appendChild(btn);

    container.appendChild(errorDiv);
  }

  // Fetch and Render Masters
  async function fetchMasters() {
    showLoading(mastersContainer, 'Loading Masters...');
    try {
      const response = await fetch('/api/masters');
      if (!response.ok) throw new Error('Failed to fetch masters');
      const masters = await response.json();
      
      if (masters.length === 0) {
        mastersContainer.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No masters added yet.</p>';
        return;
      }

      mastersContainer.innerHTML = masters.map(master => `
        <div class="member-card">
          <div class="member-image-wrapper">
            <img src="${master.imageUrl}" alt="${master.name}">
          </div>
          <div class="member-info">
            <h4 class="member-name">${master.name}</h4>
            <div class="member-designation">${master.designation}</div>
            <div class="member-dan">${master.dan}</div>
            <div class="member-exp">${master.experience}</div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error fetching masters:', error);
      showErrorMessage(mastersContainer, 'Unable to load masters at the moment. Please try again.', fetchMasters);
    }
  }

  // Fetch and Render Black Belts
  async function fetchBlackBelts() {
    showLoading(blackbeltsContainer, 'Loading Black Belts...');
    try {
      const response = await fetch('/api/blackbelts');
      if (!response.ok) throw new Error('Failed to fetch black belts');
      const blackbelts = await response.json();

      if (blackbelts.length === 0) {
        blackbeltsContainer.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No black belts added yet.</p>';
        return;
      }

      blackbeltsContainer.innerHTML = blackbelts.map(bb => `
        <div class="member-card">
          <div class="member-image-wrapper">
            <img src="${bb.imageUrl}" alt="${bb.name}">
          </div>
          <div class="member-info">
            <h4 class="member-name">${bb.name}</h4>
            <div class="member-designation">Specialization: ${bb.specialization}</div>
            <div class="member-dan">${bb.dan}</div>
            <div class="member-exp">${bb.experience}</div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error fetching black belts:', error);
      showErrorMessage(blackbeltsContainer, 'Unable to load black belts at the moment. Please try again.', fetchBlackBelts);
    }
  }

  // Fetch and Render Dojo Locations
  async function fetchDojos() {
    showLoading(dojosListContainer, 'Searching Dojos...');
    try {
      const response = await fetch('/api/dojos');
      if (!response.ok) throw new Error('Failed to fetch dojos');
      const dojos = await response.json();

      // Update stat count
      if (statsDojoCount) {
        statsDojoCount.textContent = dojos.length || 0;
      }

      if (dojos.length === 0) {
        dojosListContainer.innerHTML = '<p class="text-white">No dojo locations added yet.</p>';
        googleMapContainer.innerHTML = `
          <div class="map-placeholder">
            <i class="fa-solid fa-map-location-dot"></i>
            <p>No locations available</p>
          </div>
        `;
        return;
      }

      // Render dojo list
      dojosListContainer.innerHTML = dojos.map((dojo, index) => `
        <div class="dojo-item ${index === 0 ? 'active' : ''}" data-id="${dojo._id}" data-mapurl="${dojo.mapUrl}" data-address="${dojo.address}">
          <div class="dojo-details">
            <h4 class="dojo-title">${dojo.name}</h4>
            <div class="dojo-info-row">
              <i class="fa-solid fa-location-dot"></i>
              <span>${dojo.address}</span>
            </div>
            <div class="dojo-info-row">
              <i class="fa-solid fa-phone"></i>
              <span>${dojo.phone}</span>
            </div>
            <div class="dojo-info-row">
              <i class="fa-solid fa-clock"></i>
              <span>Mon - Sat: 5:00 AM - 9:00 PM<br>Sun: 6:00 AM - 1:00 PM</span>
            </div>
          </div>
        </div>
      `).join('');

      // Set up click events for list items
      const dojoItems = document.querySelectorAll('.dojo-item');
      dojoItems.forEach(item => {
        item.addEventListener('click', () => {
          dojoItems.forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          
          const mapUrl = item.getAttribute('data-mapurl');
          const address = item.getAttribute('data-address');
          updateMap(mapUrl, address);
        });
      });

      // Load initial map (first dojo)
      if (dojos.length > 0) {
        updateMap(dojos[0].mapUrl, dojos[0].address);
      }

    } catch (error) {
      console.error('Error fetching dojos:', error);
      showErrorMessage(dojosListContainer, 'Unable to load dojo locations. Please try again.', fetchDojos);
      googleMapContainer.innerHTML = `
        <div class="map-placeholder">
          <i class="fa-solid fa-triangle-exclamation text-red" style="font-size: 40px; margin-bottom: 15px;"></i>
          <p>Map unavailable due to server connection issues</p>
        </div>
      `;
    }
  }

  // Update Map Frame
  function updateMap(url, address) {
    const embedUrl = formatEmbedUrl(url, address);
    googleMapContainer.innerHTML = `
      <iframe 
        src="${embedUrl}" 
        width="100%" 
        height="100%" 
        style="border:0;" 
        allowfullscreen="" 
        loading="lazy" 
        referrerpolicy="no-referrer-when-downgrade">
      </iframe>
    `;
  }

  // Helper to format Google Maps URLs into dynamic iframe embeds
  function formatEmbedUrl(url, address) {
    if (!url) return '';
    
    // Check if it's already an embed URL
    if (url.includes('output=embed') || url.includes('/embed') || url.includes('google.com/maps/embed')) {
      return url;
    }
    
    // Check for latitude/longitude parameters in search URL
    // Format: q=lat,lng or @lat,lng
    let match = url.match(/[?&]q=([\d.-]+),([\d.-]+)/);
    if (match) {
      return `https://maps.google.com/maps?q=${match[1]},${match[2]}&z=15&output=embed`;
    }
    
    match = url.match(/@([\d.-]+),([\d.-]+)/);
    if (match) {
      return `https://maps.google.com/maps?q=${match[1]},${match[2]}&z=15&output=embed`;
    }
    
    // Fallback: search by encoded address
    return `https://maps.google.com/maps?q=${encodeURIComponent(address || '')}&z=15&output=embed`;
  }
});
