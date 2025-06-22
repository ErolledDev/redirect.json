import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
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
  query 
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
const signupBtn = document.getElementById('signup-btn');
const signoutBtn = document.getElementById('signout-btn');
const authError = document.getElementById('auth-error');
const userEmail = document.getElementById('user-email');
const userAvatar = document.getElementById('user-avatar');
const redirectForm = document.getElementById('redirect-form');
const editForm = document.getElementById('edit-form');
const redirectsList = document.getElementById('redirects-list');
const refreshBtn = document.getElementById('refresh-btn');
const editModal = document.getElementById('edit-modal');

// Navigation
const navTabs = document.querySelectorAll('.nav-tab');
const dashboardSections = document.querySelectorAll('.dashboard-section');

// Stats elements
const totalRedirects = document.getElementById('total-redirects');
const articleCount = document.getElementById('article-count');
const websiteCount = document.getElementById('website-count');
const videoCount = document.getElementById('video-count');

// Auth state management
let isSignUp = false;
let redirectsData = [];

// Third party website URL - CHANGE THIS TO YOUR THIRD PARTY WEBSITE
const THIRD_PARTY_WEBSITE = 'mythirdpartywebsite.com'; // Change this to your actual third party website

// Check if we're on the redirects.json page
if (window.location.pathname === '/redirects.json' || window.location.search.includes('json')) {
  handleRedirectsJson();
} else {
  // Normal app initialization
  initApp();
}

function initApp() {
  // Navigation event listeners
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const sectionId = tab.dataset.section;
      switchSection(sectionId);
    });
  });

  // Auth event listeners
  authForm.addEventListener('submit', handleAuth);
  signupBtn.addEventListener('click', () => {
    isSignUp = true;
    signinBtn.innerHTML = '<i class="fas fa-user-plus"></i> Sign Up';
    signupBtn.style.display = 'none';
  });
  signoutBtn.addEventListener('click', handleSignOut);
  redirectForm.addEventListener('submit', handleCreateRedirect);
  editForm.addEventListener('submit', handleEditRedirect);
  refreshBtn.addEventListener('click', loadRedirects);

  // Auth state observer
  onAuthStateChanged(auth, (user) => {
    if (user) {
      showApp(user);
      loadRedirects();
    } else {
      showAuth();
    }
  });
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
  userEmail.textContent = user.email;
  userAvatar.textContent = user.email.charAt(0).toUpperCase();
  updateStats();
}

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.add('show');
}

function clearAuthError() {
  authError.classList.remove('show');
}

function showSuccess(message) {
  // Create or update success message
  let successMsg = document.querySelector('.success-message');
  if (!successMsg) {
    successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    const activeSection = document.querySelector('.dashboard-section.active .section-card');
    if (activeSection) {
      activeSection.insertBefore(successMsg, activeSection.firstChild);
    }
  }
  successMsg.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  successMsg.classList.add('show');
  
  setTimeout(() => {
    successMsg.classList.remove('show');
  }, 4000);
}

async function handleAuth(e) {
  e.preventDefault();
  clearAuthError();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    if (isSignUp) {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (error) {
    showAuthError(error.message);
  }
}

async function handleSignOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
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
    showAuthError('Please fill in all required fields');
    return;
  }
  
  // Clean slug (remove leading slash, spaces, etc.)
  const cleanSlug = slug.replace(/^\/+/, '').replace(/\s+/g, '-').toLowerCase();
  
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
    
    showSuccess('Redirect created successfully!');
    redirectForm.reset();
    loadRedirects();
    updateStats();
    
    // Switch to manage section
    switchSection('manage');
  } catch (error) {
    showAuthError('Error creating redirect: ' + error.message);
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
    showAuthError('Please fill in all required fields');
    return;
  }
  
  // Clean slug
  const cleanSlug = slug.replace(/^\/+/, '').replace(/\s+/g, '-').toLowerCase();
  
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
    
    showSuccess('Redirect updated successfully!');
    closeEditModal();
    loadRedirects();
    updateStats();
  } catch (error) {
    showAuthError('Error updating redirect: ' + error.message);
  }
}

async function loadRedirects() {
  redirectsList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading redirects...</div>';
  
  try {
    const q = query(collection(db, 'redirects'), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      redirectsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-link" style="font-size: 3rem; color: var(--secondary-color); margin-bottom: 1rem;"></i>
          <h3>No redirects found</h3>
          <p>Create your first redirect to get started!</p>
        </div>
      `;
      return;
    }
    
    const redirects = [];
    querySnapshot.forEach((doc) => {
      redirects.push({ id: doc.id, ...doc.data() });
    });
    
    redirectsData = redirects;
    renderRedirects(redirects);
    updateStats();
  } catch (error) {
    redirectsList.innerHTML = `
      <div class="loading" style="color: var(--danger-color);">
        <i class="fas fa-exclamation-triangle"></i> Error loading redirects: ${error.message}
      </div>
    `;
  }
}

function renderRedirects(redirects) {
  redirectsList.innerHTML = redirects.map(redirect => `
    <div class="redirect-card">
      <div class="card-header">
        <div>
          <div class="card-title">${redirect.title}</div>
          <div class="card-slug">/${redirect.slug}</div>
        </div>
        <div class="card-actions">
          <button class="btn btn-small btn-success" onclick="viewRedirect('${redirect.slug}')" title="View on third party site">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-small btn-warning" onclick="editRedirect('${redirect.id}')" title="Edit redirect">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-small btn-danger" onclick="deleteRedirect('${redirect.id}')" title="Delete redirect">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <div class="card-meta">
        <div class="meta-item">
          <div class="meta-label"><i class="fas fa-external-link-alt"></i> Destination URL:</div>
          <div class="meta-value">
            <a href="${redirect.url}" target="_blank">${redirect.url}</a>
          </div>
        </div>
        
        ${redirect.desc ? `
        <div class="meta-item">
          <div class="meta-label"><i class="fas fa-align-left"></i> Description:</div>
          <div class="meta-value">${redirect.desc}</div>
        </div>
        ` : ''}
        
        ${redirect.keywords ? `
        <div class="meta-item">
          <div class="meta-label"><i class="fas fa-tags"></i> Keywords:</div>
          <div class="meta-value">${redirect.keywords}</div>
        </div>
        ` : ''}
        
        ${redirect.site_name ? `
        <div class="meta-item">
          <div class="meta-label"><i class="fas fa-globe"></i> Site Name:</div>
          <div class="meta-value">${redirect.site_name}</div>
        </div>
        ` : ''}

        ${redirect.image ? `
        <div class="meta-item">
          <div class="meta-label"><i class="fas fa-image"></i> Image:</div>
          <div class="meta-value">
            <a href="${redirect.image}" target="_blank">View Image</a>
          </div>
        </div>
        ` : ''}

        ${redirect.video ? `
        <div class="meta-item">
          <div class="meta-label"><i class="fas fa-video"></i> Video:</div>
          <div class="meta-value">
            <a href="${redirect.video}" target="_blank">View Video</a>
          </div>
        </div>
        ` : ''}
      </div>

      <div class="card-footer">
        <div class="card-stats">
          <div class="stat-item">
            <i class="fas fa-calendar"></i>
            ${redirect.created_at?.toDate?.()?.toLocaleDateString() || 'N/A'}
          </div>
        </div>
        <div class="type-badge type-${redirect.type}">
          ${redirect.type === 'article' ? '📄' : redirect.type === 'website' ? '🌐' : '🎥'} ${redirect.type}
        </div>
      </div>
    </div>
  `).join('');
}

function updateStats() {
  if (!redirectsData.length) return;
  
  const stats = redirectsData.reduce((acc, redirect) => {
    acc.total++;
    acc[redirect.type] = (acc[redirect.type] || 0) + 1;
    return acc;
  }, { total: 0, article: 0, website: 0, video: 0 });
  
  totalRedirects.textContent = stats.total;
  articleCount.textContent = stats.article;
  websiteCount.textContent = stats.website;
  videoCount.textContent = stats.video;
}

// Global functions for card actions
window.viewRedirect = function(slug) {
  // Open third party website with the slug
  // CHANGE 'mythirdpartywebsite.com' TO YOUR ACTUAL THIRD PARTY WEBSITE
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
  document.getElementById('edit-type').value = redirect.type || 'article';
  
  // Show modal
  editModal.style.display = 'flex';
};

window.deleteRedirect = async function(id) {
  if (!confirm('Are you sure you want to delete this redirect? This action cannot be undone.')) {
    return;
  }
  
  try {
    await deleteDoc(doc(db, 'redirects', id));
    showSuccess('Redirect deleted successfully!');
    loadRedirects();
    updateStats();
  } catch (error) {
    showAuthError('Error deleting redirect: ' + error.message);
  }
};

window.closeEditModal = function() {
  editModal.style.display = 'none';
  editForm.reset();
};

// Close modal when clicking outside
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) {
    closeEditModal();
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
        type: data.type || 'article',
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
  }
}
        </pre>
      </div>
    `;
  }
}