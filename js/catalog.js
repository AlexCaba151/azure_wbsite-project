let currentGalleryIndex = 0;
let currentGalleryImages = [];

document.addEventListener('DOMContentLoaded', function () {
  renderCatalog();
  initModal();
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

/* ---------------- RENDER CATALOG ---------------- */

async function renderCatalog() {
  const properties = await getProperties();
  const grid = document.getElementById('catalog-grid');
  const count = document.getElementById('results-count');

  count.textContent = properties.length;

  if (properties.length === 0) {
    grid.innerHTML = "<p>No properties found</p>";
    return;
  }

  grid.innerHTML = properties.map(property => `
    <div class="property-card" onclick="openPropertyModal('${property.id}')">
      <div class="property-card-image-wrapper">
        <img src="${property.images?.[0] || 'images/placeholder.svg'}">
      </div>
      <div class="property-card-body">
        <div class="property-card-price">
          $${Number(property.price).toLocaleString()}
        </div>
        <h3>${property.title}</h3>
        <p>${property.location}</p>
      </div>
    </div>
  `).join('');
}

/* ---------------- MODAL ---------------- */

async function openPropertyModal(id) {
  const properties = await getProperties();
  const property = properties.find(p => p.id === id);
  if (!property) return;

  document.getElementById('modal-title').textContent = property.title;
  document.getElementById('modal-location-text').textContent = property.location;

  document.getElementById('modal-price').textContent =
    `$${Number(property.price).toLocaleString()}`;

  document.getElementById('modal-description').textContent =
    property.description || "No description available.";

  // Stats
  const stats = document.getElementById('modal-stats');
  stats.innerHTML = `
    ${property.bedrooms ? `<div class="modal-stat">${property.bedrooms} Bedrooms</div>` : ''}
    ${property.bathrooms ? `<div class="modal-stat">${property.bathrooms} Bathrooms</div>` : ''}
    ${property.area ? `<div class="modal-stat">${property.area} ft²</div>` : ''}
    ${property.year_built ? `<div class="modal-stat">Built ${property.year_built}</div>` : ''}
  `;

  // Features
  const featuresContainer = document.getElementById('modal-features-container');
  const featuresList = document.getElementById('modal-features');

  if (property.features && property.features.length > 0) {
    featuresContainer.style.display = 'block';
    featuresList.innerHTML = property.features.map(f => `<li>${f}</li>`).join('');
  } else {
    featuresContainer.style.display = 'none';
  }

  // Gallery
  currentGalleryImages = property.images?.length
    ? property.images
    : ['images/placeholder.svg'];

  currentGalleryIndex = 0;
  updateGallery();

  document.getElementById('property-modal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function updateGallery() {
  const mainImg = document.getElementById('modal-main-image');
  const counter = document.getElementById('gallery-counter');

  if (!mainImg) return;

  mainImg.src = currentGalleryImages[currentGalleryIndex];
  counter.textContent =
    `${currentGalleryIndex + 1} / ${currentGalleryImages.length}`;
}

/* ---------------- CLOSE MODAL ---------------- */

function closeModal() {
  document.getElementById('property-modal').classList.remove('show');
  document.body.style.overflow = '';
}

function initModal() {

  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);

  document.getElementById('property-modal')?.addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  document.getElementById('gallery-prev')?.addEventListener('click', function (e) {
    e.stopPropagation();
    currentGalleryIndex =
      (currentGalleryIndex - 1 + currentGalleryImages.length) %
      currentGalleryImages.length;
    updateGallery();
  });

  document.getElementById('gallery-next')?.addEventListener('click', function (e) {
    e.stopPropagation();
    currentGalleryIndex =
      (currentGalleryIndex + 1) %
      currentGalleryImages.length;
    updateGallery();
  });
}