document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let currentTab = 'masters';
  let currentAction = 'add'; // 'add' or 'edit'
  let activeId = null; // ID of master/blackbelt/dojo being edited
  let unreadRegCount = 0;

  // --- DOM ELEMENTS ---
  const loginOverlay = document.getElementById('login-overlay');
  const dashboardWrapper = document.getElementById('dashboard-wrapper');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const btnLogout = document.getElementById('btn-logout');

  const navLinks = document.querySelectorAll('.nav-link[data-tab]');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('page-title');
  const pageBreadcrumbs = document.getElementById('page-breadcrumbs');

  // Metrics
  const mMastersCount = document.getElementById('dashboard-masters-count');
  const mBbCount = document.getElementById('dashboard-bb-count');
  const mDojoCount = document.getElementById('dashboard-dojo-count');
  const sidebarRegBadge = document.getElementById('sidebar-reg-badge');
  const headerRegBadge = document.getElementById('header-reg-badge');

  // Modal Views
  const viewDetailsModal = document.getElementById('view-details-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBodyContent = document.getElementById('modal-body-content');

  // Sidebar toggle
  const btnToggleSidebar = document.querySelector('.btn-toggle-sidebar');
  const sidebar = document.querySelector('.sidebar');

  if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  // --- INITIAL CHECK & SETUP ---
  showLogin();
  setupTabRouting();
  setupFormListeners();
  setupImagePreviewListeners();

  // --- AUTHENTICATION ---
  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      if (data.authenticated) {
        showDashboard();
      } else {
        showLogin();
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      showLogin();
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showDashboard();
        loginForm.reset();
      } else {
        loginError.style.display = 'block';
      }
    } catch (err) {
      console.error('Login error:', err);
      loginError.style.display = 'block';
    }
  });

  btnLogout.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      showLogin();
    } catch (err) {
      console.error('Logout error:', err);
    }
  });

  function showDashboard() {
    loginOverlay.style.display = 'none';
    dashboardWrapper.style.display = 'flex';
    switchTab(currentTab);
  }

  function showLogin() {
    dashboardWrapper.style.display = 'none';
    loginOverlay.style.display = 'flex';
  }

  // --- TAB ROUTING ---
  function setupTabRouting() {
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        switchTab(tab);
        
        // Close sidebar on mobile after clicking
        if (window.innerWidth <= 992) {
          sidebar.classList.remove('active');
        }
      });
    });
  }

  function switchTab(tabName) {
    currentTab = tabName;

    // Toggle active link
    navLinks.forEach(link => {
      if (link.getAttribute('data-tab') === tabName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Toggle active pane
    tabPanes.forEach(pane => {
      if (pane.getAttribute('id') === `tab-${tabName}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Close any open form drawers
    closeFormDrawer('masters');
    closeFormDrawer('blackbelts');
    closeFormDrawer('dojos');

    // Update Header titles
    let title = 'Masters Management';
    let breadcrumb = 'Dashboard > Masters';

    if (tabName === 'masters') {
      title = 'Masters Management';
      breadcrumb = 'Dashboard > Masters';
      fetchMastersData();
    } else if (tabName === 'blackbelts') {
      title = 'Black Belts Management';
      breadcrumb = 'Dashboard > Black Belts';
      fetchBlackBeltsData();
    } else if (tabName === 'dojos') {
      title = 'Dojo Locations Management';
      breadcrumb = 'Dashboard > Dojo Locations';
      fetchDojosData();
    } else if (tabName === 'registrations') {
      title = 'Registrations Management';
      breadcrumb = 'Dashboard > Registrations';
      fetchRegistrationsData();
    } else if (tabName === 'profile') {
      title = 'Admin Profile';
      breadcrumb = 'Dashboard > Profile';
    }

    pageTitle.textContent = title;
    pageBreadcrumbs.innerHTML = breadcrumb;
  }

  // --- DATA LOADING & INITIALIZATION ---
  function initDashboardData() {
    fetchMastersData();
    fetchBlackBeltsData();
    fetchDojosData();
    fetchRegistrationsData(); // Load unread badge numbers too
  }

  // GLOBAL EXPORTS to allow html onClick calls
  window.switchTab = switchTab;
  window.showFormDrawer = function(type, mode = 'add', id = null) {
    currentAction = mode;
    activeId = id;

    const drawer = document.getElementById(`drawer-${type}`);
    const titleEl = document.getElementById(`drawer-${type}-title`);
    const subtitleEl = document.getElementById(`drawer-${type}-subtitle`);
    
    // Clear forms initially
    const form = document.getElementById(`form-${type}`);
    if (mode === 'add') {
      form.reset();
      document.getElementById(`${type === 'dojos' ? 'dojo' : type === 'blackbelts' ? 'bb' : 'master'}-id`).value = '';
      
      // Set default image previews
      if (type === 'masters') document.getElementById('master-image-preview').src = '/assets/sensei_male_1.png';
      if (type === 'blackbelts') document.getElementById('bb-image-preview').src = '/assets/sensei_male_1.png';
      if (type === 'dojos') document.getElementById('dojo-image-preview').src = '/assets/dojo_downtown.png';

      titleEl.textContent = `Add ${type === 'dojos' ? 'Dojo Location' : type === 'blackbelts' ? 'Black Belt' : 'Master'}`;
      subtitleEl.textContent = 'Create details for a new entry.';
    }

    drawer.classList.add('open');

    if (mode === 'edit' && id) {
      titleEl.textContent = `Edit ${type === 'dojos' ? 'Dojo Location' : type === 'blackbelts' ? 'Black Belt' : 'Master'}`;
      subtitleEl.textContent = 'Update existing details.';
      loadFormForEdit(type, id);
    }
  };

  window.closeFormDrawer = function(type) {
    const drawer = document.getElementById(`drawer-${type}`);
    if (drawer) drawer.classList.remove('open');
    activeId = null;
  };

  // Previews image before uploading
  function setupImagePreviewListeners() {
    const previewConfigs = [
      { inputId: 'master-image-input', previewId: 'master-image-preview' },
      { inputId: 'bb-image-input', previewId: 'bb-image-preview' },
      { inputId: 'dojo-image-input', previewId: 'dojo-image-preview' }
    ];

    previewConfigs.forEach(config => {
      const input = document.getElementById(config.inputId);
      const preview = document.getElementById(config.previewId);

      if (input && preview) {
        input.addEventListener('change', () => {
          const file = input.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              preview.src = e.target.result;
            };
            reader.readAsDataURL(file);
          }
        });
      }
    });
  }

  // Populate form for Edit
  async function loadFormForEdit(type, id) {
    try {
      const response = await fetch(`/api/${type}/${id}`);
      const data = await response.json();

      if (type === 'masters') {
        document.getElementById('master-id').value = data._id;
        document.getElementById('master-name').value = data.name;
        document.getElementById('master-designation').value = data.designation;
        document.getElementById('master-dan').value = data.dan;
        document.getElementById('master-exp').value = data.experience;
        document.getElementById('master-bio').value = data.bio;
        document.getElementById('master-image-preview').src = data.imageUrl;
      } else if (type === 'blackbelts') {
        document.getElementById('bb-id').value = data._id;
        document.getElementById('bb-name').value = data.name;
        document.getElementById('bb-dan').value = data.dan;
        document.getElementById('bb-specialization').value = data.specialization;
        document.getElementById('bb-exp').value = data.experience;
        document.getElementById('bb-bio').value = data.bio;
        document.getElementById('bb-image-preview').src = data.imageUrl;
      } else if (type === 'dojos') {
        document.getElementById('dojo-id').value = data._id;
        document.getElementById('dojo-name').value = data.name;
        document.getElementById('dojo-address').value = data.address;
        document.getElementById('dojo-phone').value = data.phone;
        document.getElementById('dojo-mapurl').value = data.mapUrl;
        document.getElementById('dojo-lat').value = data.latitude || '';
        document.getElementById('dojo-lng').value = data.longitude || '';
        document.getElementById('dojo-image-preview').src = data.imageUrl;
        document.getElementById('dojo-desc').value = data.description;
      }
    } catch (err) {
      console.error(`Error loading edit data for ${type}:`, err);
    }
  }

  // --- API OPERATIONS (SUBMIT FORMS) ---
  function setupFormListeners() {
    // Masters Form
    document.getElementById('form-masters').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('master-id').value;
      const fileInput = document.getElementById('master-image-input');
      
      const formData = new FormData();
      formData.append('name', document.getElementById('master-name').value);
      formData.append('designation', document.getElementById('master-designation').value);
      formData.append('dan', document.getElementById('master-dan').value);
      formData.append('experience', document.getElementById('master-exp').value);
      formData.append('bio', document.getElementById('master-bio').value);
      
      if (fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
      }

      submitForm('masters', id, formData);
    });

    // Black Belts Form
    document.getElementById('form-blackbelts').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('bb-id').value;
      const fileInput = document.getElementById('bb-image-input');

      const formData = new FormData();
      formData.append('name', document.getElementById('bb-name').value);
      formData.append('dan', document.getElementById('bb-dan').value);
      formData.append('specialization', document.getElementById('bb-specialization').value);
      formData.append('experience', document.getElementById('bb-exp').value);
      formData.append('bio', document.getElementById('bb-bio').value);

      if (fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
      }

      submitForm('blackbelts', id, formData);
    });

    // Dojos Form
    document.getElementById('form-dojos').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('dojo-id').value;
      const fileInput = document.getElementById('dojo-image-input');

      const formData = new FormData();
      formData.append('name', document.getElementById('dojo-name').value);
      formData.append('address', document.getElementById('dojo-address').value);
      formData.append('phone', document.getElementById('dojo-phone').value);
      formData.append('mapUrl', document.getElementById('dojo-mapurl').value);
      formData.append('latitude', document.getElementById('dojo-lat').value);
      formData.append('longitude', document.getElementById('dojo-lng').value);
      formData.append('description', document.getElementById('dojo-desc').value);

      if (fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
      }

      submitForm('dojos', id, formData);
    });
  }

  async function submitForm(type, id, formData) {
    const url = id ? `/api/${type}/${id}` : `/api/${type}`;
    const method = id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        body: formData
      });

      if (response.ok) {
        closeFormDrawer(type);
        // Refresh appropriate lists
        if (type === 'masters') fetchMastersData();
        if (type === 'blackbelts') fetchBlackBeltsData();
        if (type === 'dojos') fetchDojosData();
      } else {
        const errorData = await response.json();
        alert(`Error saving ${type}: ` + (errorData.message || 'Server error'));
      }
    } catch (error) {
      console.error(`Submit error for ${type}:`, error);
      alert('Network error while saving details.');
    }
  }

  // --- DELETE & VIEW DETAIL METHODS ---
  window.deleteItem = async function(type, id) {
    if (!confirm(`Are you sure you want to delete this ${type.substring(0, type.length - 1)}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/${type}/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (type === 'masters') fetchMastersData();
        if (type === 'blackbelts') fetchBlackBeltsData();
        if (type === 'dojos') fetchDojosData();
        if (type === 'registrations') fetchRegistrationsData();
      } else {
        const err = await response.json();
        alert('Delete failed: ' + err.message);
      }
    } catch (error) {
      console.error(`Delete error on ${type}:`, error);
    }
  };

  // View Details Modal
  window.viewDetails = async function(type, id) {
    try {
      const response = await fetch(`/api/${type}/${id}`);
      const data = await response.json();
      
      modalTitle.textContent = `${type.charAt(0).toUpperCase() + type.slice(1, -1)} Details`;
      viewDetailsModal.style.display = 'flex';

      if (type === 'masters') {
        modalBodyContent.innerHTML = `
          <div class="detail-profile-row">
            <img src="${data.imageUrl}" alt="${data.name}" class="detail-img">
            <div class="detail-fields">
              <span class="detail-name">${data.name}</span>
              <span class="detail-role">${data.designation}</span>
              <span class="detail-meta"><strong>Dan level:</strong> ${data.dan}</span>
              <span class="detail-meta"><strong>Experience:</strong> ${data.experience}</span>
            </div>
          </div>
          <div class="detail-label-title">About / Bio</div>
          <div class="detail-bio-box">${data.bio}</div>
        `;
      } else if (type === 'blackbelts') {
        modalBodyContent.innerHTML = `
          <div class="detail-profile-row">
            <img src="${data.imageUrl}" alt="${data.name}" class="detail-img">
            <div class="detail-fields">
              <span class="detail-name">${data.name}</span>
              <span class="detail-role">Specialization: ${data.specialization}</span>
              <span class="detail-meta"><strong>Dan level:</strong> ${data.dan}</span>
              <span class="detail-meta"><strong>Experience:</strong> ${data.experience}</span>
            </div>
          </div>
          <div class="detail-label-title">About / Bio</div>
          <div class="detail-bio-box">${data.bio}</div>
        `;
      } else if (type === 'dojos') {
        modalBodyContent.innerHTML = `
          <div class="detail-profile-row">
            <img src="${data.imageUrl}" alt="${data.name}" class="detail-img" style="width: 150px; height: 100px;">
            <div class="detail-fields">
              <span class="detail-name">${data.name}</span>
              <span class="detail-meta"><strong>Phone:</strong> ${data.phone}</span>
              <span class="detail-meta"><strong>Coordinates:</strong> ${data.latitude || 'N/A'}, ${data.longitude || 'N/A'}</span>
            </div>
          </div>
          <div class="detail-label-title">Address</div>
          <p style="margin-bottom: 20px; font-size: 14px;">${data.address}</p>
          <div class="detail-label-title">Map Link</div>
          <p style="margin-bottom: 20px; font-size: 13px;"><a href="${data.mapUrl}" target="_blank" class="text-red">${data.mapUrl}</a></p>
          <div class="detail-label-title">Description</div>
          <div class="detail-bio-box">${data.description}</div>
        `;
      }
    } catch (err) {
      console.error(`View details error for ${type}:`, err);
    }
  };

  window.closeDetailsModal = function() {
    viewDetailsModal.style.display = 'none';
    modalBodyContent.innerHTML = '';
  };

  // --- FETCH & RENDERING HANDLERS ---

  // MASTERS
  async function fetchMastersData() {
    try {
      const response = await fetch('/api/masters');
      const data = await response.json();
      
      // Update counters
      if (mMastersCount) mMastersCount.textContent = data.length;

      // Update previews
      const previewTbody = document.getElementById('preview-masters-tbody');
      if (previewTbody) {
        previewTbody.innerHTML = data.slice(0, 3).map(m => `
          <tr>
            <td><img src="${m.imageUrl}" class="table-avatar" alt="${m.name}"></td>
            <td><strong>${m.name}</strong></td>
            <td>${m.designation}</td>
            <td>${m.dan}</td>
            <td>${m.experience}</td>
            <td>
              <div class="btn-action-row">
                <button class="btn-icon-action view" onclick="viewDetails('masters', '${m._id}')" title="View Details"><i class="fa-solid fa-eye"></i></button>
              </div>
            </td>
          </tr>
        `).join('');
      }

      // Update main table (if visible)
      const tbody = document.getElementById('masters-tbody');
      if (tbody) {
        tbody.innerHTML = data.map(m => `
          <tr data-name="${m.name.toLowerCase()}">
            <td><img src="${m.imageUrl}" class="table-avatar" alt="${m.name}"></td>
            <td><strong>${m.name}</strong></td>
            <td>${m.designation}</td>
            <td>${m.dan}</td>
            <td>${m.experience}</td>
            <td>
              <div class="btn-action-row">
                <button class="btn-icon-action edit" onclick="showFormDrawer('masters', 'edit', '${m._id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon-action view" onclick="viewDetails('masters', '${m._id}')"><i class="fa-solid fa-eye"></i></button>
                <button class="btn-icon-action delete" onclick="deleteItem('masters', '${m._id}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>
        `).join('');
        document.getElementById('masters-table-footer').textContent = `Showing 1 to ${data.length} of ${data.length} masters`;
      }
    } catch (err) {
      console.error('Error getting masters:', err);
    }
  }

  // BLACK BELTS
  async function fetchBlackBeltsData() {
    try {
      const response = await fetch('/api/blackbelts');
      const data = await response.json();

      if (mBbCount) mBbCount.textContent = data.length;

      // Update preview table
      const previewTbody = document.getElementById('preview-blackbelts-tbody');
      if (previewTbody) {
        previewTbody.innerHTML = data.slice(0, 3).map(bb => `
          <tr>
            <td><img src="${bb.imageUrl}" class="table-avatar" alt="${bb.name}"></td>
            <td><strong>${bb.name}</strong></td>
            <td>${bb.dan}</td>
            <td>${bb.specialization}</td>
            <td>${bb.experience}</td>
            <td>
              <div class="btn-action-row">
                <button class="btn-icon-action view" onclick="viewDetails('blackbelts', '${bb._id}')" title="View Details"><i class="fa-solid fa-eye"></i></button>
              </div>
            </td>
          </tr>
        `).join('');
      }

      // Main table (if visible)
      const tbody = document.getElementById('blackbelts-tbody');
      if (tbody) {
        tbody.innerHTML = data.map(bb => `
          <tr data-name="${bb.name.toLowerCase()}">
            <td><img src="${bb.imageUrl}" class="table-avatar" alt="${bb.name}"></td>
            <td><strong>${bb.name}</strong></td>
            <td>${bb.dan}</td>
            <td>${bb.specialization}</td>
            <td>${bb.experience}</td>
            <td>
              <div class="btn-action-row">
                <button class="btn-icon-action edit" onclick="showFormDrawer('blackbelts', 'edit', '${bb._id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon-action view" onclick="viewDetails('blackbelts', '${bb._id}')"><i class="fa-solid fa-eye"></i></button>
                <button class="btn-icon-action delete" onclick="deleteItem('blackbelts', '${bb._id}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>
        `).join('');
        document.getElementById('bb-table-footer').textContent = `Showing 1 to ${data.length} of ${data.length} black belts`;
      }
    } catch (err) {
      console.error('Error getting black belts:', err);
    }
  }

  // DOJOS
  async function fetchDojosData() {
    try {
      const response = await fetch('/api/dojos');
      const data = await response.json();

      if (mDojoCount) mDojoCount.textContent = data.length;

      // Update previews
      const previewTbody = document.getElementById('preview-dojos-tbody');
      if (previewTbody) {
        previewTbody.innerHTML = data.slice(0, 3).map(d => `
          <tr>
            <td><strong>${d.name}</strong></td>
            <td>${d.address}</td>
            <td>${d.phone}</td>
            <td><a href="${d.mapUrl}" target="_blank" class="text-red">${d.mapUrl.substring(0, 30)}...</a></td>
            <td>
              <div class="btn-action-row">
                <button class="btn-icon-action view" onclick="viewDetails('dojos', '${d._id}')" title="View Details"><i class="fa-solid fa-eye"></i></button>
              </div>
            </td>
          </tr>
        `).join('');
      }

      // Main table (if visible)
      const tbody = document.getElementById('dojos-tbody');
      if (tbody) {
        tbody.innerHTML = data.map(d => `
          <tr data-name="${d.name.toLowerCase()}">
            <td><img src="${d.imageUrl}" class="table-avatar" alt="${d.name}" style="height: 35px; width: 50px; object-fit: cover;"></td>
            <td><strong>${d.name}</strong></td>
            <td>${d.address}</td>
            <td>${d.phone}</td>
            <td><a href="${d.mapUrl}" target="_blank" class="text-red">${d.mapUrl.substring(0, 30)}...</a></td>
            <td>
              <div class="btn-action-row">
                <button class="btn-icon-action edit" onclick="showFormDrawer('dojos', 'edit', '${d._id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon-action view" onclick="viewDetails('dojos', '${d._id}')"><i class="fa-solid fa-eye"></i></button>
                <button class="btn-icon-action delete" onclick="deleteItem('dojos', '${d._id}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>
        `).join('');
        document.getElementById('dojos-table-footer').textContent = `Showing 1 to ${data.length} of ${data.length} dojo locations`;
      }
    } catch (err) {
      console.error('Error getting dojos:', err);
    }
  }

  // REGISTRATIONS
  async function fetchRegistrationsData() {
    try {
      // 1. Get badge counts
      const badgeRes = await fetch('/api/registrations/unread-count');
      const badgeData = await badgeRes.json();
      unreadRegCount = badgeData.count || 0;

      if (unreadRegCount > 0) {
        sidebarRegBadge.textContent = unreadRegCount;
        sidebarRegBadge.style.display = 'inline-block';
        headerRegBadge.textContent = unreadRegCount;
        headerRegBadge.style.display = 'flex';
      } else {
        sidebarRegBadge.style.display = 'none';
        headerRegBadge.style.display = 'none';
      }

      // 2. Load registrations table (if registrations tab is visible)
      const tbody = document.getElementById('registrations-tbody');
      if (tbody && currentTab === 'registrations') {
        const response = await fetch('/api/registrations');
        const data = await response.json();

        if (data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" class="text-center">No registrations received yet.</td></tr>';
          document.getElementById('registrations-table-footer').textContent = 'Showing 0 registrations';
          return;
        }

        tbody.innerHTML = data.map(reg => {
          const dateStr = new Date(reg.createdAt).toLocaleString();
          const isUnread = reg.status === 'unread';
          const dojoName = reg.selectedDojo ? reg.selectedDojo.name : 'Unknown Dojo';
          
          return `
            <tr>
              <td>${dateStr}</td>
              <td><strong>${reg.name}</strong></td>
              <td>${reg.email}</td>
              <td>${reg.phone}</td>
              <td>${reg.age}</td>
              <td>${reg.experience}</td>
              <td>${dojoName}</td>
              <td>
                <span class="status-pill ${reg.status}">${reg.status}</span>
              </td>
              <td>
                <div class="btn-action-row">
                  ${isUnread ? `<button class="btn-icon-action edit" onclick="markRegAsRead('${reg._id}')" title="Mark as Read"><i class="fa-solid fa-check"></i></button>` : ''}
                  <button class="btn-icon-action delete" onclick="deleteItem('registrations', '${reg._id}')" title="Delete Registration"><i class="fa-solid fa-trash"></i></button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
        
        document.getElementById('registrations-table-footer').textContent = `Showing ${data.length} registrations total`;
      }

    } catch (error) {
      console.error('Error getting registrations:', error);
    }
  }

  // Mark registration as Read
  window.markRegAsRead = async function(id) {
    try {
      const response = await fetch(`/api/registrations/${id}/read`, {
        method: 'PATCH'
      });

      if (response.ok) {
        // Refresh registrations layout to decrement badge
        fetchRegistrationsData();
      } else {
        alert('Failed to update registration status');
      }
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  // --- CLIENT SIDE TABLE FILTERS ---
  window.filterTable = function(type) {
    const query = document.getElementById(`search-${type}`).value.toLowerCase();
    const rows = document.querySelectorAll(`#${type}-tbody tr`);
    
    rows.forEach(row => {
      const name = row.getAttribute('data-name');
      if (name && name.includes(query)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  };
});
