// Property Catalog JavaScript

const PROPERTIES_KEY = 'azure_properties';

// Get properties from localStorage
function getProperties() {
  try {
    const data = localStorage.getItem(PROPERTIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Current gallery state
let currentGalleryIndex = 0;
let currentGalleryImages = [];

// Initialize catalog
document.addEventListener('DOMContentLoaded', function() {
  renderCatalog();
  initFilters();
  initModal();
});

// Render catalog grid
function renderCatalog() {
  const properties = getProperties();
  const filtered = applyFilters(properties);
  const grid = document.getElementById('catalog-grid');
  const empty = document.getElementById('catalog-empty');
  const count = document.getElementById('results-count');
  const lang = localStorage.getItem('language') || 'en';

  if (!grid) return;

  count.textContent = filtered.length;

  if (filtered.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }

  grid.style.display = '';
  empty.style.display = 'none';

  grid.innerHTML = filtered.map(property => {
    const mainImage = property.images && property.images.length > 0
      ? property.images[0]
      : 'images/placeholder.svg';

    const badgeText = lang === 'es'
      ? (property.listingType === 'sale' ? 'En Venta' : 'En Alquiler')
      : (property.listingType === 'sale' ? 'For Sale' : 'For Rent');

    const badgeClass = property.listingType === 'sale' ? 'badge-sale' : 'badge-rent';

    const typeLabelMap = {
      house: lang === 'es' ? 'Casa' : 'House',
      apartment: lang === 'es' ? 'Apartamento' : 'Apartment',
      commercial: lang === 'es' ? 'Comercial' : 'Commercial',
      land: lang === 'es' ? 'Terreno' : 'Land'
    };
    const typeLabel = typeLabelMap[property.propertyType] || property.propertyType;

    const priceFormatted = property.listingType === 'rent'
      ? `$${Number(property.price).toLocaleString()}/${lang === 'es' ? 'mes' : 'mo'}`
      : `$${Number(property.price).toLocaleString()}`;

    let statsHTML = '';
    if (property.propertyType !== 'land') {
      statsHTML = `
        <div class="property-card-stats">
          ${property.bedrooms ? `<span class="property-stat"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg> ${property.bedrooms}</span>` : ''}
          ${property.bathrooms ? `<span class="property-stat"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" x2="8" y1="5" y2="7"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="7" x2="7" y1="19" y2="21"/><line x1="17" x2="17" y1="19" y2="21"/></svg> ${property.bathrooms}</span>` : ''}
          ${property.area ? `<span class="property-stat"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg> ${property.area} ft&sup2;</span>` : ''}
        </div>
      `;
    } else if (property.area) {
      statsHTML = `
        <div class="property-card-stats">
          <span class="property-stat"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg> ${property.area} ft&sup2;</span>
        </div>
      `;
    }

    return `
      <div class="property-card" onclick="openPropertyModal('${property.id}')">
        <div class="property-card-image-wrapper">
          <img src="${mainImage}" alt="${property.title}" class="property-card-image" crossorigin="anonymous">
          <span class="property-badge ${badgeClass}">${badgeText}</span>
          ${property.images && property.images.length > 1 ? `<span class="property-image-count"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> ${property.images.length}</span>` : ''}
        </div>
        <div class="property-card-body">
          <div class="property-card-price">${priceFormatted}</div>
          <h3 class="property-card-title">${property.title}</h3>
          <p class="property-card-location">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            ${property.location}
          </p>
          ${statsHTML}
          <span class="property-type-tag">${typeLabel}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Apply filters
function applyFilters(properties) {
  const type = document.getElementById('filter-type')?.value || 'all';
  const propertyType = document.getElementById('filter-property-type')?.value || 'all';
  const location = document.getElementById('filter-location')?.value || 'all';
  const price = document.getElementById('filter-price')?.value || 'all';

  return properties.filter(p => {
    if (type !== 'all' && p.listingType !== type) return false;
    if (propertyType !== 'all' && p.propertyType !== propertyType) return false;
    if (location !== 'all') {
      const loc = p.location.toLowerCase();
      if (location === 'miami' && !loc.includes('miami')) return false;
      if (location === 'dominican-republic' && !loc.includes('dominican') && !loc.includes('dominicana') && !loc.includes('rd') && !loc.includes('dr')) return false;
    }
    if (price !== 'all') {
      const pVal = Number(p.price);
      if (price === '1000000+') {
        if (pVal < 1000000) return false;
      } else {
        const [min, max] = price.split('-').map(Number);
        if (pVal < min || pVal > max) return false;
      }
    }
    return true;
  });
}

// Initialize filters
function initFilters() {
  ['filter-type', 'filter-property-type', 'filter-location', 'filter-price'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', renderCatalog);
  });
}

// Open property detail modal
function openPropertyModal(id) {
  const properties = getProperties();
  const property = properties.find(p => p.id === id);
  if (!property) return;

  const lang = localStorage.getItem('language') || 'en';
  const modal = document.getElementById('property-modal');

  // Set badge
  const badge = document.getElementById('modal-badge');
  badge.textContent = lang === 'es'
    ? (property.listingType === 'sale' ? 'En Venta' : 'En Alquiler')
    : (property.listingType === 'sale' ? 'For Sale' : 'For Rent');
  badge.className = `property-badge ${property.listingType === 'sale' ? 'badge-sale' : 'badge-rent'}`;

  // Set type badge
  const typeBadge = document.getElementById('modal-type-badge');
  const typeLabelMap = {
    house: lang === 'es' ? 'Casa' : 'House',
    apartment: lang === 'es' ? 'Apartamento' : 'Apartment',
    commercial: lang === 'es' ? 'Comercial' : 'Commercial',
    land: lang === 'es' ? 'Terreno' : 'Land'
  };
  typeBadge.textContent = typeLabelMap[property.propertyType] || property.propertyType;

  // Set title, location, price
  document.getElementById('modal-title').textContent = property.title;
  document.getElementById('modal-location-text').textContent = property.location;

  const priceFormatted = property.listingType === 'rent'
    ? `$${Number(property.price).toLocaleString()}/${lang === 'es' ? 'mes' : 'mo'}`
    : `$${Number(property.price).toLocaleString()}`;
  document.getElementById('modal-price').textContent = priceFormatted;

  // Set description
  document.getElementById('modal-description').textContent = property.description || (lang === 'es' ? 'Sin descripcion disponible.' : 'No description available.');

  // Set stats
  const statsContainer = document.getElementById('modal-stats');
  let statsHTML = '';
  if (property.bedrooms) {
    statsHTML += `<div class="modal-stat"><span class="modal-stat-value">${property.bedrooms}</span><span class="modal-stat-label">${lang === 'es' ? 'Habitaciones' : 'Bedrooms'}</span></div>`;
  }
  if (property.bathrooms) {
    statsHTML += `<div class="modal-stat"><span class="modal-stat-value">${property.bathrooms}</span><span class="modal-stat-label">${lang === 'es' ? 'Banos' : 'Bathrooms'}</span></div>`;
  }
  if (property.area) {
    statsHTML += `<div class="modal-stat"><span class="modal-stat-value">${property.area}</span><span class="modal-stat-label">ft&sup2;</span></div>`;
  }
  if (property.yearBuilt) {
    statsHTML += `<div class="modal-stat"><span class="modal-stat-value">${property.yearBuilt}</span><span class="modal-stat-label">${lang === 'es' ? 'Ano' : 'Year'}</span></div>`;
  }
  statsContainer.innerHTML = statsHTML;

  // Set features
  const featuresContainer = document.getElementById('modal-features-container');
  const featuresList = document.getElementById('modal-features');
  if (property.features && property.features.length > 0) {
    featuresContainer.style.display = 'block';
    featuresList.innerHTML = property.features.map(f => `
      <li>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        ${f}
      </li>
    `).join('');
  } else {
    featuresContainer.style.display = 'none';
  }

  // Setup gallery
  currentGalleryImages = property.images && property.images.length > 0 ? property.images : ['images/placeholder.svg'];
  currentGalleryIndex = 0;
  updateGallery();

  // Show modal
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

// Update gallery display
function updateGallery() {
  const mainImg = document.getElementById('modal-main-image');
  const counter = document.getElementById('gallery-counter');
  const thumbsContainer = document.getElementById('gallery-thumbs');

  mainImg.src = currentGalleryImages[currentGalleryIndex];
  counter.textContent = `${currentGalleryIndex + 1} / ${currentGalleryImages.length}`;

  // Render thumbnails
  thumbsContainer.innerHTML = currentGalleryImages.map((img, i) => `
    <img 
      src="${img}" 
      alt="Photo ${i + 1}" 
      class="gallery-thumb ${i === currentGalleryIndex ? 'active' : ''}" 
      onclick="goToGalleryImage(${i})"
      crossorigin="anonymous"
    >
  `).join('');

  // Show/hide nav buttons
  document.getElementById('gallery-prev').style.display = currentGalleryImages.length > 1 ? 'flex' : 'none';
  document.getElementById('gallery-next').style.display = currentGalleryImages.length > 1 ? 'flex' : 'none';
}

function goToGalleryImage(index) {
  currentGalleryIndex = index;
  updateGallery();
}

// Initialize modal controls
function initModal() {
  // Close button
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);

  // Close on overlay click
  document.getElementById('property-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  // Gallery navigation
  document.getElementById('gallery-prev')?.addEventListener('click', function(e) {
    e.stopPropagation();
    currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    updateGallery();
  });

  document.getElementById('gallery-next')?.addEventListener('click', function(e) {
    e.stopPropagation();
    currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length;
    updateGallery();
  });

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('property-modal');
    if (!modal || !modal.classList.contains('show')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') {
      currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
      updateGallery();
    }
    if (e.key === 'ArrowRight') {
      currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length;
      updateGallery();
    }
  });
}

function closeModal() {
  document.getElementById('property-modal')?.classList.remove('show');
  document.body.style.overflow = '';
}
