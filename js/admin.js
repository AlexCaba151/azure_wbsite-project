// Admin Panel JavaScript

const PROPERTIES_KEY = 'azure_properties';
const ADMIN_KEY = 'azure_admin_logged';
const ADMIN_PASSWORD = 'azure2024';

let editingPropertyId = null;
let deletingPropertyId = null;
let uploadedImages = [];

// Get properties
function getProperties() {
  try {
    const data = localStorage.getItem(PROPERTIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save properties
function saveProperties(properties) {
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(properties));
}

// Generate unique ID
function generateId() {
  return 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  initLogin();
  initAdmin();
});

// Check authentication
function checkAuth() {
  const isLogged = sessionStorage.getItem(ADMIN_KEY);
  if (isLogged === 'true') {
    showDashboard();
  }
}

// Init login form
function initLogin() {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const password = document.getElementById('admin-password').value;
      const error = document.getElementById('login-error');
      
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem(ADMIN_KEY, 'true');
        showDashboard();
      } else {
        error.style.display = 'block';
        document.getElementById('admin-password').value = '';
      }
    });
  }
}

// Show dashboard
function showDashboard() {
  document.getElementById('admin-login').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'block';
  renderPropertiesTable();
  updateStats();
}

// Init admin functionality
function initAdmin() {
  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', function() {
    sessionStorage.removeItem(ADMIN_KEY);
    document.getElementById('admin-login').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('admin-password').value = '';
  });

  // Add property button
  document.getElementById('add-property-btn')?.addEventListener('click', function() {
    openPropertyForm();
  });

  // Form close/cancel
  document.getElementById('form-close-btn')?.addEventListener('click', closePropertyForm);
  document.getElementById('form-cancel-btn')?.addEventListener('click', closePropertyForm);

  // Form submit
  document.getElementById('property-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    savePropertyFromForm();
  });

  // Image upload
  const uploadArea = document.getElementById('image-upload-area');
  const imageInput = document.getElementById('image-input');

  if (uploadArea && imageInput) {
    uploadArea.addEventListener('click', () => imageInput.click());
    
    uploadArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function() {
      this.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('dragover');
      handleImageFiles(e.dataTransfer.files);
    });

    imageInput.addEventListener('change', function() {
      handleImageFiles(this.files);
      this.value = '';
    });
  }

  // Delete modal
  document.getElementById('delete-cancel')?.addEventListener('click', function() {
    document.getElementById('delete-modal').classList.remove('show');
    deletingPropertyId = null;
  });

  document.getElementById('delete-confirm')?.addEventListener('click', function() {
    if (deletingPropertyId) {
      deleteProperty(deletingPropertyId);
      document.getElementById('delete-modal').classList.remove('show');
      deletingPropertyId = null;
    }
  });

  // Close modals on overlay click
  document.getElementById('property-form-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closePropertyForm();
  });

  document.getElementById('delete-modal')?.addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.remove('show');
      deletingPropertyId = null;
    }
  });
}

// Handle image files
function handleImageFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Max 5MB per file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedImages.push(e.target.result);
      renderImagePreviews();
    };
    reader.readAsDataURL(file);
  });
}

// Render image previews
function renderImagePreviews() {
  const container = document.getElementById('image-previews');
  if (!container) return;

  container.innerHTML = uploadedImages.map((img, i) => `
    <div class="admin-image-preview">
      <img src="${img}" alt="Preview ${i + 1}">
      <button type="button" class="admin-image-remove" onclick="removeImage(${i})" aria-label="Remove image">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
      ${i === 0 ? '<span class="admin-image-main-badge">Main</span>' : ''}
    </div>
  `).join('');
}

// Remove image
function removeImage(index) {
  uploadedImages.splice(index, 1);
  renderImagePreviews();
}

// Open property form
function openPropertyForm(propertyId) {
  editingPropertyId = propertyId || null;
  uploadedImages = [];

  const modal = document.getElementById('property-form-modal');
  const title = document.getElementById('form-modal-title');
  const form = document.getElementById('property-form');

  form.reset();

  if (editingPropertyId) {
    title.textContent = 'Edit Property';
    const properties = getProperties();
    const prop = properties.find(p => p.id === editingPropertyId);
    if (prop) {
      document.getElementById('prop-id').value = prop.id;
      document.getElementById('prop-title').value = prop.title || '';
      document.getElementById('prop-location').value = prop.location || '';
      document.getElementById('prop-listing-type').value = prop.listingType || 'sale';
      document.getElementById('prop-property-type').value = prop.propertyType || 'house';
      document.getElementById('prop-price').value = prop.price || '';
      document.getElementById('prop-bedrooms').value = prop.bedrooms || '';
      document.getElementById('prop-bathrooms').value = prop.bathrooms || '';
      document.getElementById('prop-area').value = prop.area || '';
      document.getElementById('prop-year').value = prop.yearBuilt || '';
      document.getElementById('prop-description').value = prop.description || '';
      document.getElementById('prop-features').value = (prop.features || []).join('\n');
      uploadedImages = prop.images ? [...prop.images] : [];
    }
  } else {
    title.textContent = 'Add New Property';
    document.getElementById('prop-id').value = '';
  }

  renderImagePreviews();
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

// Close property form
function closePropertyForm() {
  document.getElementById('property-form-modal')?.classList.remove('show');
  document.body.style.overflow = '';
  editingPropertyId = null;
  uploadedImages = [];
}

// Save property from form
function savePropertyFromForm() {
  const properties = getProperties();
  
  const featuresText = document.getElementById('prop-features').value.trim();
  const features = featuresText ? featuresText.split('\n').map(f => f.trim()).filter(f => f) : [];

  const propertyData = {
    id: editingPropertyId || generateId(),
    title: document.getElementById('prop-title').value.trim(),
    location: document.getElementById('prop-location').value.trim(),
    listingType: document.getElementById('prop-listing-type').value,
    propertyType: document.getElementById('prop-property-type').value,
    price: document.getElementById('prop-price').value,
    bedrooms: document.getElementById('prop-bedrooms').value || null,
    bathrooms: document.getElementById('prop-bathrooms').value || null,
    area: document.getElementById('prop-area').value || null,
    yearBuilt: document.getElementById('prop-year').value || null,
    description: document.getElementById('prop-description').value.trim(),
    features: features,
    images: uploadedImages,
    updatedAt: new Date().toISOString()
  };

  if (editingPropertyId) {
    const index = properties.findIndex(p => p.id === editingPropertyId);
    if (index !== -1) {
      propertyData.createdAt = properties[index].createdAt;
      properties[index] = propertyData;
    }
  } else {
    propertyData.createdAt = new Date().toISOString();
    properties.unshift(propertyData);
  }

  saveProperties(properties);
  closePropertyForm();
  renderPropertiesTable();
  updateStats();
}

// Render properties table
function renderPropertiesTable() {
  const properties = getProperties();
  const tbody = document.getElementById('properties-table-body');
  const empty = document.getElementById('admin-empty');

  if (!tbody) return;

  if (properties.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';

  tbody.innerHTML = properties.map(p => {
    const img = p.images && p.images.length > 0 ? p.images[0] : 'images/placeholder.svg';
    const typeLabelMap = { house: 'House', apartment: 'Apartment', commercial: 'Commercial', land: 'Land' };
    
    return `
      <tr>
        <td><img src="${img}" alt="${p.title}" class="admin-table-img"></td>
        <td><strong>${p.title}</strong></td>
        <td>${typeLabelMap[p.propertyType] || p.propertyType}</td>
        <td><span class="property-badge ${p.listingType === 'sale' ? 'badge-sale' : 'badge-rent'}" style="font-size: 0.7rem;">${p.listingType === 'sale' ? 'Sale' : 'Rent'}</span></td>
        <td>$${Number(p.price).toLocaleString()}</td>
        <td>${p.location}</td>
        <td>
          <div class="admin-table-actions">
            <button class="admin-action-btn admin-edit-btn" onclick="openPropertyForm('${p.id}')" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
            </button>
            <button class="admin-action-btn admin-delete-btn" onclick="confirmDelete('${p.id}')" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Confirm delete
function confirmDelete(id) {
  deletingPropertyId = id;
  document.getElementById('delete-modal').classList.add('show');
}

// Delete property
function deleteProperty(id) {
  let properties = getProperties();
  properties = properties.filter(p => p.id !== id);
  saveProperties(properties);
  renderPropertiesTable();
  updateStats();
}

// Update stats
function updateStats() {
  const properties = getProperties();
  document.getElementById('stat-total').textContent = properties.length;
  document.getElementById('stat-sale').textContent = properties.filter(p => p.listingType === 'sale').length;
  document.getElementById('stat-rent').textContent = properties.filter(p => p.listingType === 'rent').length;
}
