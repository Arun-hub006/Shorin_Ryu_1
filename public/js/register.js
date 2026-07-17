document.addEventListener('DOMContentLoaded', () => {
  const dojoSelect = document.getElementById('dojo');
  const suggestionBox = document.getElementById('location-suggestion');
  const suggestionText = document.getElementById('suggestion-text');
  const registerForm = document.getElementById('registration-form');
  const alertSuccess = document.getElementById('alert-success');
  const alertError = document.getElementById('alert-error');
  const errorMessage = document.getElementById('error-message');

  let dojosList = [];

  // 1. Fetch Dojos
  fetchDojos();

  // 2. Add Form Submission listener
  registerForm.addEventListener('submit', handleRegisterSubmit);

  async function fetchDojos() {
    try {
      const response = await fetch('/api/dojos');
      dojosList = await response.json();

      if (dojosList.length === 0) {
        dojoSelect.innerHTML = '<option value="">None / General Inquiry (No branches available)</option>';
        return;
      }

      // Populate select option dropdown
      dojoSelect.innerHTML = '<option value="">None / General Inquiry</option>' + 
        dojosList.map(dojo => `<option value="${dojo._id}">${dojo.name}</option>`).join('');

      // Trigger geolocation logic to check closest branch
      findNearestBranch();

    } catch (error) {
      console.error('Error fetching dojos:', error);
      dojoSelect.innerHTML = '<option value="" disabled>Error loading branches</option>';
    }
  }

  // Geolocation & Nearest Branch Suggestion
  function findNearestBranch() {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser.');
      return;
    }

    suggestionBox.style.display = 'flex';
    suggestionText.textContent = 'Finding nearest branch... Requesting your location...';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        let nearestDojo = null;
        let minDistance = Infinity;

        // Calculate distances to all dojos that have coordinates
        dojosList.forEach(dojo => {
          if (dojo.latitude !== undefined && dojo.longitude !== undefined && dojo.latitude !== null && dojo.longitude !== null) {
            const distance = calculateHaversineDistance(userLat, userLng, dojo.latitude, dojo.longitude);
            if (distance < minDistance) {
              minDistance = distance;
              nearestDojo = dojo;
            }
          }
        });

        if (nearestDojo) {
          const distStr = minDistance < 1 
            ? `${Math.round(minDistance * 1000)} meters` 
            : `${minDistance.toFixed(1)} km`;

          suggestionText.innerHTML = `Nearest branch based on your location: <strong>${nearestDojo.name}</strong> (${distStr} away). We have selected it for you!`;
          
          // Auto select it in the dropdown!
          dojoSelect.value = nearestDojo._id;
        } else {
          suggestionBox.style.display = 'none';
        }
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        suggestionBox.style.display = 'none'; // Hide suggestion box if permission denied or error
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }

  // Haversine formula calculation
  function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // returns distance in km
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // Handle Form Submit
  async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    alertSuccess.style.display = 'none';
    alertError.style.display = 'none';

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const age = document.getElementById('age').value;
    const experience = document.getElementById('experience').value;
    const selectedDojo = dojoSelect.value || undefined;

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          age,
          experience,
          selectedDojo
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alertSuccess.style.display = 'block';
        registerForm.reset();
        // Redirect to homepage after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2500);
      } else {
        alertError.style.display = 'block';
        errorMessage.textContent = result.message || 'Error submitting registration. Please try again.';
      }

    } catch (error) {
      console.error('Submit error:', error);
      alertError.style.display = 'block';
      errorMessage.textContent = 'Network error. Please check your internet connection.';
    }
  }
});
