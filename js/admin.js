// Admin Panel with Supabase

const ADMIN_KEY = 'azure_admin_logged';
const ADMIN_PASSWORD = 'azure2024';

let editingPropertyId = null;
let deletingPropertyId = null;
let uploadedImages = [];

/* ---------------- INIT ---------------- */

document.addEventListener('DOMContentLoaded', function () {
  checkAuth();
  initLogin();
  initAdmin();
});

/* ---------------- DATABASE ---------------- */

async function getProperties() {
  const { data, error } = await window.supabaseClient
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

async function deleteProperty(id) {
  const { error } = await window.supabaseClient
    .from("properties")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  await renderPropertiesTable();
  await updateStats();
}

async function savePropertyFromForm() {

  const featuresText = document.getElementById('prop-features').value.trim();
  const features = featuresText
    ? featuresText.split('\n').map(f => f.trim()).filter(f => f)
    : [];

  const propertyData = {
    title: document.getElementById('prop-title').value.trim(),
    location: document.getElementById('prop-location').value.trim(),
    listing_type: document.getElementById('prop-listing-type').value,
    property_type: document.getElementById('prop-property-type').value,
    price: Number(document.getElementById('prop-price').value),
    bedrooms: document.getElementById('prop-bedrooms').value || null,
    bathrooms: document.getElementById('prop-bathrooms').value || null,
    area: document.getElementById('prop-area').value || null,
    year_built: document.getElementById('prop-year').value || null,
    description: document.getElementById('prop-description').value.trim(),
    features: features,
    images: uploadedImages,
    updated_at: new Date().toISOString()
  };

  let response;

  if (editingPropertyId) {
    response = await window.supabaseClient
      .from("properties")
      .update(propertyData)
      .eq("id", editingPropertyId);
  } else {
    response = await window.supabaseClient
      .from("properties")
      .insert([propertyData]);
  }

  if (response.error) {
    console.error(response.error);
    alert("Error saving property");
    return;
  }

  closePropertyForm();
  await renderPropertiesTable();
  await updateStats();
}

/* ---------------- AUTH ---------------- */

function checkAuth() {
  const isLogged = sessionStorage.getItem(ADMIN_KEY);
  if (isLogged === 'true') showDashboard();
}

function initLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
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

function showDashboard() {
  document.getElementById('admin-login').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'block';
  renderPropertiesTable();
  updateStats();
}

/* ---------------- ADMIN EVENTS ---------------- */

function initAdmin() {

  document.getElementById('logout-btn')?.addEventListener('click', function () {
    sessionStorage.removeItem(ADMIN_KEY);
    location.reload();
  });

  document.getElementById('add-property-btn')?.addEventListener('click', function () {
    openPropertyForm();
  });

  document.getElementById('form-close-btn')?.addEventListener('click', closePropertyForm);
  document.getElementById('form-cancel-btn')?.addEventListener('click', closePropertyForm);

  document.getElementById('property-form')?.addEventListener('submit', function (e) {
    e.preventDefault();
    savePropertyFromForm();
  });

  document.getElementById('delete-cancel')?.addEventListener('click', function () {
    document.getElementById('delete-modal').classList.remove('show');
    deletingPropertyId = null;
  });

  document.getElementById('delete-confirm')?.addEventListener('click', function () {
    if (deletingPropertyId) {
      deleteProperty(deletingPropertyId);
      document.getElementById('delete-modal').classList.remove('show');
      deletingPropertyId = null;
    }
  });

  /* ---------- IMAGE UPLOAD ---------- */

  const uploadArea = document.getElementById('image-upload-area');
  const imageInput = document.getElementById('image-input');

  if (uploadArea && imageInput) {

    uploadArea.addEventListener('click', () => imageInput.click());

    uploadArea.addEventListener('dragover', function (e) {
      e.preventDefault();
      this.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function () {
      this.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function (e) {
      e.preventDefault();
      this.classList.remove('dragover');
      handleImageFiles(e.dataTransfer.files);
    });

    imageInput.addEventListener('change', function () {
      handleImageFiles(this.files);
      this.value = '';
    });
  }
}

/* ---------------- IMAGE FUNCTIONS ---------------- */

function handleImageFiles(files) {

  Array.from(files).forEach(file => {

    if (!file.type.startsWith('image/')) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Max 5MB per file.');
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      uploadedImages.push(e.target.result);
      renderImagePreviews();
    };

    reader.readAsDataURL(file);
  });
}

function renderImagePreviews() {

  const container = document.getElementById('image-previews');
  if (!container) return;

  container.innerHTML = uploadedImages.map((img, i) => `
    <div class="admin-image-preview">
      <img src="${img}" alt="Preview ${i + 1}">
      <button type="button" onclick="removeImage(${i})">X</button>
      ${i === 0 ? '<span class="admin-image-main-badge">Main</span>' : ''}
    </div>
  `).join('');
}

function removeImage(index) {
  uploadedImages.splice(index, 1);
  renderImagePreviews();
}

/* ---------------- MODALS ---------------- */

function openPropertyForm(propertyId = null) {

  editingPropertyId = propertyId;
  uploadedImages = [];

  const modal = document.getElementById('property-form-modal');
  const form = document.getElementById('property-form');

  form.reset();

  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closePropertyForm() {
  document.getElementById('property-form-modal')?.classList.remove('show');
  document.body.style.overflow = '';
  editingPropertyId = null;
  uploadedImages = [];
}

function confirmDelete(id) {
  deletingPropertyId = id;
  document.getElementById('delete-modal').classList.add('show');
}

/* ---------------- RENDER ---------------- */

async function renderPropertiesTable() {
  const properties = await getProperties();
  const tbody = document.getElementById('properties-table-body');
  const empty = document.getElementById('admin-empty');

  if (!tbody) return;

  if (properties.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';

  tbody.innerHTML = properties.map(p => `
    <tr>
      <td><img src="${p.images?.[0] || 'images/placeholder.svg'}" class="admin-table-img"></td>
      <td>${p.title}</td>
      <td>${p.property_type}</td>
      <td>${p.listing_type}</td>
      <td>$${Number(p.price).toLocaleString()}</td>
      <td>${p.location}</td>
      <td>
        <button onclick="openPropertyForm('${p.id}')">Edit</button>
        <button onclick="confirmDelete('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function updateStats() {
  const properties = await getProperties();

  document.getElementById('stat-total').textContent = properties.length;
  document.getElementById('stat-sale').textContent =
    properties.filter(p => p.listing_type === 'sale').length;
  document.getElementById('stat-rent').textContent =
    properties.filter(p => p.listing_type === 'rent').length;
}