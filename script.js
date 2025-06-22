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
const redirectForm = document.getElementById('redirect-form');
const redirectsList = document.getElementById('redirects-list');
const refreshBtn = document.getElementById('refresh-btn');

// Auth state management
let isSignUp = false;

// Check if we're on the redirects.json page
if (window.location.pathname === '/redirects.json' || window.location.search.includes('json')) {
  handleRedirectsJson();
} else {
  // Normal app initialization
  initApp();
}

function initApp() {
  // Auth event listeners
  authForm.addEventListener('submit', handleAuth);
  signupBtn.addEventListener('click', () => {
    isSignUp = true;
    signinBtn.textContent = 'Sign Up';
    signupBtn.style.display = 'none';
  });
  signoutBtn.addEventListener('click', handleSignOut);
  redirectForm.addEventListener('submit', handleCreateRedirect);
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

function showAuth() {
  authSection.style.display = 'flex';
  appSection.style.display = 'none';
  clearAuthError();
}

function showApp(user) {
  authSection.style.display = 'none';
  appSection.style.display = 'block';
  userEmail.textContent = user.email;
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
    redirectForm.parentNode.insertBefore(successMsg, redirectForm);
  }
  successMsg.textContent = message;
  successMsg.classList.add('show');
  
  setTimeout(() => {
    successMsg.classList.remove('show');
  }, 3000);
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
  
  const formData = new FormData(e.target);
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
    await addDoc(collection(db, 'redirects'), {
      slug: cleanSlug,
      ...redirectData
    });
    
    showSuccess('Redirect created successfully!');
    redirectForm.reset();
    loadRedirects();
  } catch (error) {
    showAuthError('Error creating redirect: ' + error.message);
  }
}

async function loadRedirects() {
  redirectsList.innerHTML = '<div class="loading">Loading redirects...</div>';
  
  try {
    const q = query(collection(db, 'redirects'), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      redirectsList.innerHTML = '<div class="loading">No redirects found. Create your first redirect above!</div>';
      return;
    }
    
    const redirects = [];
    querySnapshot.forEach((doc) => {
      redirects.push({ id: doc.id, ...doc.data() });
    });
    
    renderRedirects(redirects);
  } catch (error) {
    redirectsList.innerHTML = '<div class="loading">Error loading redirects: ' + error.message + '</div>';
  }
}

function renderRedirects(redirects) {
  redirectsList.innerHTML = redirects.map(redirect => `
    <div class="redirect-item">
      <div class="redirect-header">
        <div>
          <div class="redirect-title">${redirect.title}</div>
          <div class="redirect-slug">/${redirect.slug}</div>
        </div>
        <div class="redirect-actions">
          <button class="btn btn-small btn-danger" onclick="deleteRedirect('${redirect.id}')">
            Delete
          </button>
        </div>
      </div>
      
      <div class="redirect-meta">
        <div class="meta-item">
          <div class="meta-label">URL:</div>
          <div class="meta-value">
            <a href="${redirect.url}" target="_blank">${redirect.url}</a>
          </div>
        </div>
        
        ${redirect.desc ? `
        <div class="meta-item">
          <div class="meta-label">Description:</div>
          <div class="meta-value">${redirect.desc}</div>
        </div>
        ` : ''}
        
        ${redirect.keywords ? `
        <div class="meta-item">
          <div class="meta-label">Keywords:</div>
          <div class="meta-value">${redirect.keywords}</div>
        </div>
        ` : ''}
        
        <div class="meta-item">
          <div class="meta-label">Type:</div>
          <div class="meta-value">${redirect.type}</div>
        </div>
        
        ${redirect.site_name ? `
        <div class="meta-item">
          <div class="meta-label">Site:</div>
          <div class="meta-value">${redirect.site_name}</div>
        </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// Global function for delete button
window.deleteRedirect = async function(id) {
  if (!confirm('Are you sure you want to delete this redirect?')) {
    return;
  }
  
  try {
    await deleteDoc(doc(db, 'redirects', id));
    showSuccess('Redirect deleted successfully!');
    loadRedirects();
  } catch (error) {
    showAuthError('Error deleting redirect: ' + error.message);
  }
};

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