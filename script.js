import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp,
  orderBy,
  query,
  increment,
  getDoc 
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCeBHo-IftrpVSWUqJ7PJu6_42CA45Y0is",
  authDomain: "seo-redirect-system.firebaseapp.com",
  projectId: "seo-redirect-system",
  storageBucket: "seo-redirect-system.firebasestorage.app",
  messagingSenderId: "998159604073",
  appId: "1:998159604073:web:c8ba0835584a40944fc5f8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const authForm = document.getElementById('auth-form');
const signinBtn = document.getElementById('signin-btn');
const signoutBtn = document.getElementById('sidebar-signout-btn');
const authError = document.getElementById('auth-error');
const redirectForm = document.getElementById('redirect-form');
const editForm = document.getElementById('edit-form');
const redirectsList = document.getElementById('redirects-list');
const refreshBtn = document.getElementById('refresh-btn');
const editModal = document.getElementById('edit-modal');
const urlModal = document.getElementById('url-modal');
const toastContainer = document.getElementById('toast-container');

// Mobile menu elements
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
const sidebarClose = document.getElementById('sidebar-close');
const appMainLayout = document.querySelector('.app-main-layout');

// Navigation
const navTabs = document.querySelectorAll('.nav-tab');
const dashboardSections = document.querySelectorAll('.dashboard-section');

// Stats elements
const totalRedirects = document.getElementById('total-redirects');
const websiteCount = document.getElementById('website-count');
const articleCount = document.getElementById('article-count');
const videoCount = document.getElementById('video-count');
const productCount = document.getElementById('product-count');
const serviceCount = document.getElementById('service-count');

// Filter elements
const searchFilter = document.getElementById('search-filter');
const typeFilter = document.getElementById('type-filter');
const sortFilter = document.getElementById('sort-filter');
const clearFilters = document.getElementById('clear-filters');

// Analytics elements
const apiCallsToday = document.getElementById('api-calls-today');
const apiCallsMonth = document.getElementById('api-calls-month');
const apiCallsTotal = document.getElementById('api-calls-total');
const usagePercentage = document.getElementById('usage-percentage');
const refreshAnalytics = document.getElementById('refresh-analytics');

// Form elements for auto-slug
const titleInput = document.getElementById('title');
const slugInput = document.getElementById('slug');
const editTitleInput = document.getElementById('edit-title');
const editSlugInput = document.getElementById('edit-slug');

// Auth state management
let redirectsData = [];
let filteredRedirects = [];

// Third party website URL - stored in localStorage
let THIRD_PARTY_WEBSITE = localStorage.getItem('thirdPartyWebsite') || 'mythirdpartywebsite.com';

// Content type configurations
const contentTypes = {
  // Primary Types
  website: { emoji: '🌐', label: 'Website', color: 'type-website' },
  article: { emoji: '📄', label: 'Article', color: 'type-article' },
  video: { emoji: '🎥', label: 'Video', color: 'type-video' },
  product: { emoji: '🛍️', label: 'Product', color: 'type-product' },
  
  // Extended Types
  blog: { emoji: '📝', label: 'Blog', color: 'type-blog' },
  news: { emoji: '📰', label: 'News', color: 'type-news' },
  service: { emoji: '🔧', label: 'Service', color: 'type-service' },
  portfolio: { emoji: '💼', label: 'Portfolio', color: 'type-portfolio' },
  landing: { emoji: '🎯', label: 'Landing Page', color: 'type-landing' },
  course: { emoji: '🎓', label: 'Course', color: 'type-course' },
  ebook: { emoji: '📚', label: 'eBook', color: 'type-ebook' },
  music: { emoji: '🎵', label: 'Music', color: 'type-music' },
  podcast: { emoji: '🎙️', label: 'Podcast', color: 'type-podcast' },
  app: { emoji: '📱', label: 'App', color: 'type-app' },
  tool: { emoji: '🛠️', label: 'Tool', color: 'type-tool' },
  software: { emoji: '💻', label: 'Software', color: 'type-software' },
  game: { emoji: '🎮', label: 'Game', color: 'type-game' },
  event: { emoji: '📅', label: 'Event', color: 'type-event' },
  business: { emoji: '🏢', label: 'Business', color: 'type-business' },
  profile: { emoji: '👤', label: 'Profile', color: 'type-profile' },
  company: { emoji: '🏛️', label: 'Company', color: 'type-company' },
  organization: { emoji: '🏢', label: 'Organization', color: 'type-organization' }
};

// Toast notification system
function showToast(message, type = 'success', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'fa-check-circle' : 
               type === 'error' ? 'fa-exclamation-circle' : 
               type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
  
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Utility function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Mobile menu functions
function toggleMobileMenu() {
  appMainLayout.classList.toggle('menu-open');
}

function closeMobileMenu() {
  appMainLayout.classList.remove('menu-open');
}

// Check if we're on the redirects.json page
if (window.location.pathname === '/redirects.json' || window.location.search.includes('json')) {
  handleRedirectsJson();
} else {
  // Normal app initialization
  initApp();
}

function initApp() {
  // Update third party URL display
  updateThirdPartyDisplay();
  
  // Mobile menu event listeners
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  }
  
  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeMobileMenu);
  }
  
  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);
  }
  
  // Auto-slug generation for create form
  if (titleInput && slugInput) {
    titleInput.addEventListener('input', (e) => {
      const title = e.target.value;
      const slug = generateSlug(title);
      slugInput.value = slug;
      
      // Show slug preview
      updateSlugPreview(slug);
    });
    
    // Allow manual slug editing
    slugInput.addEventListener('input', (e) => {
      const slug = generateSlug(e.target.value);
      slugInput.value = slug;
      updateSlugPreview(slug);
    });
  }
  
  // Auto-slug generation for edit form
  if (editTitleInput && editSlugInput) {
    editTitleInput.addEventListener('input', (e) => {
      const title = e.target.value;
      const slug = generateSlug(title);
      editSlugInput.value = slug;
    });
    
    editSlugInput.addEventListener('input', (e) => {
      const slug = generateSlug(e.target.value);
      editSlugInput.value = slug;
    });
  }
  
  // Navigation event listeners
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const sectionId = tab.dataset.section;
      if (sectionId) {
        switchSection(sectionId);
        // Close mobile menu when a tab is clicked
        closeMobileMenu();
      }
    });
  });

  // Auth event listeners
  authForm.addEventListener('submit', handleAuth);
  signoutBtn.addEventListener('click', handleSignOut);
  redirectForm.addEventListener('submit', handleCreateRedirect);
  editForm.addEventListener('submit', handleEditRedirect);
  refreshBtn.addEventListener('click', loadRedirects);
  refreshAnalytics.addEventListener('click', loadAnalytics);

  // Filter event listeners
  searchFilter.addEventListener('input', applyFilters);
  typeFilter.addEventListener('change', applyFilters);
  sortFilter.addEventListener('change', applyFilters);
  clearFilters.addEventListener('click', clearAllFilters);

  // Auth state observer
  onAuthStateChanged(auth, (user) => {
    if (user) {
      showApp(user);
      loadRedirects();
      loadAnalytics();
    } else {
      showAuth();
    }
  });
}

function updateSlugPreview(slug) {
  let preview = document.querySelector('.slug-preview');
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'slug-preview';
    slugInput.parentNode.appendChild(preview);
  }
  
  if (slug) {
    preview.innerHTML = `<i class="fas fa-link"></i> Preview: <strong>seo360.xyz/${slug}</strong>`;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
}

function switchSection(sectionId) {
  // Update nav tabs
  navTabs.forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.section === sectionId) {
      tab.classList.add('active');
    }
  });

  // Update sections
  dashboardSections.forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(`${sectionId}-section`).classList.add('active');

  // Load data if needed
  if (sectionId === 'manage') {
    loadRedirects();
  } else if (sectionId === 'overview') {
    updateStats();
  } else if (sectionId === 'analytics') {
    loadAnalytics();
  }
}

function showAuth() {
  authSection.style.display = 'flex';
  appSection.style.display = 'none';
  clearAuthError();
}

function showApp(user) {
  authSection.style.display = 'none';
  appSection.style.display = 'block';
  updateStats();
}

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.add('show');
}

function clearAuthError() {
  authError.classList.remove('show');
}

async function handleAuth(e) {
  e.preventDefault();
  clearAuthError();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast('Successfully signed in!', 'success');
  } catch (error) {
    showAuthError(error.message);
    showToast('Sign in failed: ' + error.message, 'error');
  }
}

async function handleSignOut() {
  try {
    await signOut(auth);
    showToast('Successfully signed out!', 'success');
  } catch (error) {
    console.error('Sign out error:', error);
    showToast('Sign out failed', 'error');
  }
}

async function handleCreateRedirect(e) {
  e.preventDefault();
  
  const slug = document.getElementById('slug').value.trim();
  const url = document.getElementById('url').value.trim();
  const title = document.getElementById('title').value.trim();
  const desc = document.getElementById('desc').value.trim();
  const image = document.getElementById('image').value.trim();
  const video = document.getElementById('video').value.trim();
  const keywords = document.getElementById('keywords').value.trim();
  const siteName = document.getElementById('site_name').value.trim();
  const type = document.getElementById('type').value;
  
  if (!slug || !url || !title) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  // Clean slug (remove leading slash, spaces, etc.)
  const cleanSlug = generateSlug(slug);
  
  const redirectData = {
    slug: cleanSlug,
    title,
    desc,
    url,
    image,
    video,
    keywords,
    site_name: siteName,
    type,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  };
  
  try {
    await addDoc(collection(db, 'redirects'), redirectData);
    
    showToast('Redirect created successfully!', 'success');
    redirectForm.reset();
    
    // Clear slug preview
    const preview = document.querySelector('.slug-preview');
    if (preview) {
      preview.style.display = 'none';
    }
    
    loadRedirects();
    updateStats();
    
    // Switch to manage section
    switchSection('manage');
  } catch (error) {
    showToast('Error creating redirect: ' + error.message, 'error');
  }
}

async function handleEditRedirect(e) {
  e.preventDefault();
  
  const id = document.getElementById('edit-id').value;
  const slug = document.getElementById('edit-slug').value.trim();
  const url = document.getElementById('edit-url').value.trim();
  const title = document.getElementById('edit-title').value.trim();
  const desc = document.getElementById('edit-desc').value.trim();
  const image = document.getElementById('edit-image').value.trim();
  const video = document.getElementById('edit-video').value.trim();
  const keywords = document.getElementById('edit-keywords').value.trim();
  const siteName = document.getElementById('edit-site_name').value.trim();
  const type = document.getElementById('edit-type').value;
  
  if (!slug || !url || !title) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  // Clean slug
  const cleanSlug = generateSlug(slug);
  
  const updateData = {
    slug: cleanSlug,
    title,
    desc,
    url,
    image,
    video,
    keywords,
    site_name: siteName,
    type,
    updated_at: serverTimestamp()
  };
  
  try {
    await updateDoc(doc(db, 'redirects', id), updateData);
    
    showToast('Redirect updated successfully!', 'success');
    closeEditModal();
    loadRedirects();
    updateStats();
  } catch (error) {
    showToast('Error updating redirect: ' + error.message, 'error');
  }
}

async function loadRedirects() {
  redirectsList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading redirects...</div>';
  
  try {
    const q = query(collection(db, 'redirects'), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      redirectsList.innerHTML = `
        <div class="col-span-full">
          <div class="empty-state">
            <i class="fas fa-link" style="font-size: 4rem; color: var(--secondary-color); margin-bottom: 1.5rem;"></i>
            <h3>No redirects found</h3>
            <p>Create your first redirect to get started!</p>
          </div>
        </div>
      `;
      return;
    }
    
    const redirects = [];
    querySnapshot.forEach((doc) => {
      redirects.push({ id: doc.id, ...doc.data() });
    });
    
    redirectsData = redirects;
    filteredRedirects = redirects;
    applyFilters();
    updateStats();
  } catch (error) {
    redirectsList.innerHTML = `
      <div class="col-span-full">
        <div class="loading" style="color: var(--danger-color);">
          <i class="fas fa-exclamation-triangle"></i> Error loading redirects: ${error.message}
        </div>
      </div>
    `;
    showToast('Error loading redirects: ' + error.message, 'error');
  }
}

function applyFilters() {
  const searchTerm = searchFilter.value.toLowerCase();
  const typeValue = typeFilter.value;
  const sortValue = sortFilter.value;
  
  // Filter redirects
  filteredRedirects = redirectsData.filter(redirect => {
    const matchesSearch = !searchTerm || 
      redirect.title.toLowerCase().includes(searchTerm) ||
      redirect.slug.toLowerCase().includes(searchTerm) ||
      redirect.url.toLowerCase().includes(searchTerm) ||
      (redirect.desc && redirect.desc.toLowerCase().includes(searchTerm));
    
    const matchesType = !typeValue || redirect.type === typeValue;
    
    return matchesSearch && matchesType;
  });
  
  // Sort redirects
  filteredRedirects.sort((a, b) => {
    switch (sortValue) {
      case 'oldest':
        return (a.created_at?.toDate?.() || new Date()) - (b.created_at?.toDate?.() || new Date());
      case 'title':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      case 'newest':
      default:
        return (b.created_at?.toDate?.() || new Date()) - (a.created_at?.toDate?.() || new Date());
    }
  });
  
  renderRedirects(filteredRedirects);
}

function clearAllFilters() {
  searchFilter.value = '';
  typeFilter.value = '';
  sortFilter.value = 'newest';
  applyFilters();
}

function renderRedirects(redirects) {
  if (redirects.length === 0) {
    redirectsList.innerHTML = `
      <div class="col-span-full">
        <div class="empty-state">
          <i class="fas fa-search" style="font-size: 4rem; color: var(--secondary-color); margin-bottom: 1.5rem;"></i>
          <h3>No redirects match your filters</h3>
          <p>Try adjusting your search criteria</p>
        </div>
      </div>
    `;
    return;
  }

  redirectsList.innerHTML = redirects.map(redirect => {
    const typeConfig = contentTypes[redirect.type] || contentTypes.website;
    
    const keywords = redirect.keywords ? redirect.keywords.split(',').map(k => k.trim()).filter(k => k) : [];
    const displayKeywords = keywords.slice(0, 3);
    const remainingCount = keywords.length - 3;
    
    const createdDate = redirect.created_at?.toDate?.()?.toLocaleDateString() || 'N/A';
    const updatedDate = redirect.updated_at?.toDate?.()?.toLocaleDateString() || 'N/A';
    const isUpdated = redirect.updated_at && redirect.updated_at !== redirect.created_at;
    
    return `
      <div class="redirect-card">
        ${redirect.image ? `
          <div class="card-image">
            <img src="${redirect.image}" alt="${redirect.title}" loading="lazy" onerror="this.parentElement.style.display='none'">
          </div>
        ` : ''}
        
        <div class="card-content">
          <div class="card-header">
            <div class="card-meta-row">
              <div class="card-type-info">
                <span class="type-badge ${typeConfig.color}">
                  ${typeConfig.emoji} ${typeConfig.label}
                </span>
                ${redirect.site_name ? `
                  <span class="card-site-name" title="${redirect.site_name}">${redirect.site_name}</span>
                ` : ''}
              </div>
            </div>
            
            <h3 class="card-title">${redirect.title}</h3>
          </div>
          
          ${redirect.desc ? `
            <div class="card-description">
              ${redirect.desc}
            </div>
          ` : ''}
          
          ${keywords.length > 0 ? `
            <div class="card-keywords">
              ${displayKeywords.map(keyword => `
                <span class="keyword-tag" title="${keyword}">#${keyword}</span>
              `).join('')}
              ${remainingCount > 0 ? `<span class="keyword-tag">+${remainingCount}</span>` : ''}
            </div>
          ` : ''}
          
          <div class="card-footer">
            <div class="card-meta">
              <div class="card-meta-item">
                <i class="fas fa-calendar-plus"></i>
                <span>Created ${createdDate}</span>
              </div>
              ${isUpdated ? `
                <div class="card-meta-item">
                  <i class="fas fa-calendar-edit"></i>
                  <span>Updated ${updatedDate}</span>
                </div>
              ` : ''}
            </div>
            
            <div class="card-actions">
              <button onclick="deleteRedirect('${redirect.id}')" class="btn btn-danger btn-small">
                <i class="fas fa-trash"></i> Delete
              </button>
              <button onclick="viewRedirect('${redirect.slug}')" class="btn btn-primary btn-small">
                <i class="fas fa-external-link-alt"></i> View
              </button>
              <button onclick="editRedirect('${redirect.id}')" class="btn btn-success btn-small">
                <i class="fas fa-edit"></i> Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateStats() {
  if (!redirectsData.length) return;
  
  const stats = redirectsData.reduce((acc, redirect) => {
    acc.total++;
    acc[redirect.type] = (acc[redirect.type] || 0) + 1;
    return acc;
  }, { total: 0 });
  
  totalRedirects.textContent = stats.total;
  websiteCount.textContent = stats.website || 0;
  articleCount.textContent = stats.article || 0;
  videoCount.textContent = stats.video || 0;
  if (productCount) productCount.textContent = stats.product || 0;
  if (serviceCount) serviceCount.textContent = stats.service || 0;
}

async function loadAnalytics() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Load today's analytics
    const todayRef = doc(db, 'analytics', today);
    const todaySnap = await getDoc(todayRef);
    const todayCount = todaySnap.exists() ? todaySnap.data().api_calls || 0 : 0;
    
    // Load monthly analytics
    const monthlyRef = doc(db, 'analytics_monthly', monthKey);
    const monthlySnap = await getDoc(monthlyRef);
    const monthCount = monthlySnap.exists() ? monthlySnap.data().api_calls || 0 : 0;
    
    // Load total analytics
    const totalRef = doc(db, 'analytics_total', 'all_time');
    const totalSnap = await getDoc(totalRef);
    const totalCount = totalSnap.exists() ? totalSnap.data().api_calls || 0 : 0;
    
    // Update UI
    apiCallsToday.textContent = todayCount.toLocaleString();
    apiCallsMonth.textContent = monthCount.toLocaleString();
    apiCallsTotal.textContent = totalCount.toLocaleString();
    
    const percentage = ((todayCount / 50000) * 100).toFixed(2);
    usagePercentage.textContent = `${percentage}%`;
    
    // Update color based on usage
    const usageCard = usagePercentage.closest('.bg-orange-50');
    if (usageCard) {
      if (percentage > 80) {
        usageCard.className = usageCard.className.replace('bg-orange-50 border-orange-200', 'bg-red-50 border-red-200');
        usageCard.querySelector('.text-orange-600').className = usageCard.querySelector('.text-orange-600').className.replace('text-orange-600', 'text-red-600');
        usageCard.querySelector('.text-orange-900').className = usageCard.querySelector('.text-orange-900').className.replace('text-orange-900', 'text-red-900');
      } else if (percentage > 50) {
        usageCard.className = usageCard.className.replace('bg-orange-50 border-orange-200', 'bg-yellow-50 border-yellow-200');
        usageCard.querySelector('.text-orange-600').className = usageCard.querySelector('.text-orange-600').className.replace('text-orange-600', 'text-yellow-600');
        usageCard.querySelector('.text-orange-900').className = usageCard.querySelector('.text-orange-900').className.replace('text-orange-900', 'text-yellow-900');
      }
    }
    
    console.log('Analytics loaded:', { todayCount, monthCount, totalCount });
    
  } catch (error) {
    console.error('Error loading analytics:', error);
    showToast('Error loading analytics: ' + error.message, 'error');
  }
}

// Test analytics function - call this to simulate API calls
window.testAnalytics = async function() {
  try {
    showToast('Running analytics test...', 'info');
    
    // Make a few test calls to the API endpoint
    for (let i = 0; i < 5; i++) {
      await fetch('/api/redirects.json');
      console.log(`Test API call ${i + 1} completed`);
    }
    
    // Wait a moment then reload analytics
    setTimeout(() => {
      loadAnalytics();
      showToast('Test analytics calls completed! Check the analytics section.', 'success');
    }, 2000);
    
  } catch (error) {
    console.error('Error testing analytics:', error);
    showToast('Error testing analytics: ' + error.message, 'error');
  }
};

// Third party URL management
function updateThirdPartyDisplay() {
  const urlElement = document.getElementById('third-party-url');
  if (urlElement) {
    urlElement.textContent = `${THIRD_PARTY_WEBSITE}/slug-name`;
  }
}

window.updateThirdPartyUrl = function() {
  document.getElementById('third-party-input').value = THIRD_PARTY_WEBSITE;
  urlModal.style.display = 'flex';
};

window.closeUrlModal = function() {
  urlModal.style.display = 'none';
};

window.saveThirdPartyUrl = function() {
  const newUrl = document.getElementById('third-party-input').value.trim();
  if (newUrl) {
    THIRD_PARTY_WEBSITE = newUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    localStorage.setItem('thirdPartyWebsite', THIRD_PARTY_WEBSITE);
    updateThirdPartyDisplay();
    showToast('Third party website URL updated successfully!', 'success');
    closeUrlModal();
    // Re-render redirects to update URLs
    if (filteredRedirects.length > 0) {
      renderRedirects(filteredRedirects);
    }
  }
};

// Copy to clipboard function
window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success');
  }).catch(err => {
    console.error('Failed to copy: ', err);
    showToast('Failed to copy to clipboard', 'error');
  });
};

// Global functions for card actions
window.viewRedirect = function(slug) {
  const thirdPartyUrl = `https://${THIRD_PARTY_WEBSITE}/${slug}`;
  window.open(thirdPartyUrl, '_blank');
};

window.editRedirect = function(id) {
  const redirect = redirectsData.find(r => r.id === id);
  if (!redirect) return;
  
  // Populate edit form
  document.getElementById('edit-id').value = id;
  document.getElementById('edit-slug').value = redirect.slug || '';
  document.getElementById('edit-url').value = redirect.url || '';
  document.getElementById('edit-title').value = redirect.title || '';
  document.getElementById('edit-desc').value = redirect.desc || '';
  document.getElementById('edit-image').value = redirect.image || '';
  document.getElementById('edit-video').value = redirect.video || '';
  document.getElementById('edit-keywords').value = redirect.keywords || '';
  document.getElementById('edit-site_name').value = redirect.site_name || '';
  document.getElementById('edit-type').value = redirect.type || 'website';
  
  // Show modal
  editModal.style.display = 'flex';
};

window.deleteRedirect = async function(id) {
  if (!confirm('Are you sure you want to delete this redirect? This action cannot be undone.')) {
    return;
  }
  
  try {
    await deleteDoc(doc(db, 'redirects', id));
    showToast('Redirect deleted successfully!', 'success');
    loadRedirects();
    updateStats();
  } catch (error) {
    showToast('Error deleting redirect: ' + error.message, 'error');
  }
};

window.closeEditModal = function() {
  editModal.style.display = 'none';
  editForm.reset();
};

// Close modals when clicking outside
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) {
    closeEditModal();
  }
});

urlModal.addEventListener('click', (e) => {
  if (e.target === urlModal) {
    closeUrlModal();
  }
});

// Handle redirects.json endpoint - PUBLIC ACCESS
async function handleRedirectsJson() {
  try {
    const querySnapshot = await getDocs(collection(db, 'redirects'));
    const redirects = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore timestamps to ISO strings
      const redirect = {
        title: data.title || '',
        desc: data.desc || '',
        url: data.url || '',
        image: data.image || '',
        video: data.video || '',
        keywords: data.keywords || '',
        site_name: data.site_name || '',
        type: data.type || 'website',
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString()
      };
      redirects[data.slug] = redirect;
    });
    
    // Set content type and display JSON
    document.head.innerHTML = '<meta charset="UTF-8"><title>Redirects JSON</title>';
    document.body.innerHTML = `<pre style="font-family: Monaco, Menlo, monospace; padding: 2rem; background: #f8f9fa; white-space: pre-wrap; word-wrap: break-word;">${JSON.stringify(redirects, null, 2)}</pre>`;
    
  } catch (error) {
    console.error('Error loading redirects:', error);
    document.body.innerHTML = `
      <div style="padding: 2rem; font-family: Arial, sans-serif;">
        <h1>Error loading redirects</h1>
        <p>${error.message}</p>
        <p><strong>To fix this, update your Firestore rules to:</strong></p>
        <pre style="background: #f0f0f0; padding: 1rem; border-radius: 4px;">
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to redirects for JSON endpoint
    match /redirects/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow public read/write access to analytics for tracking
    match /analytics/{document} {
      allow read, write: if true;
    }
    
    match /analytics_monthly/{document} {
      allow read, write: if true;
    }
    
    match /analytics_total/{document} {
      allow read, write: if true;
    }
  }
}
        </pre>
      </div>
    `;
  }
}