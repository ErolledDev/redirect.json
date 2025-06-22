import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

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
const db = getFirestore(app);

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Track API call for analytics
    await trackApiCall();
    
    // Fetch all redirects from Firestore
    const querySnapshot = await getDocs(collection(db, 'redirects'));
    const redirects = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert Firestore timestamps to ISO strings safely
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
      
      // Use slug as the key
      if (data.slug) {
        redirects[data.slug] = redirect;
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(redirects, null, 2)
    };

  } catch (error) {
    console.error('Error fetching redirects:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch redirects',
        message: error.message,
        timestamp: new Date().toISOString()
      }, null, 2)
    };
  }
};

// Track API call for analytics
async function trackApiCall() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const analyticsRef = doc(db, 'analytics', today);
    
    await updateDoc(analyticsRef, {
      api_calls: increment(1),
      last_call: new Date()
    }).catch(async (error) => {
      // If document doesn't exist, create it
      if (error.code === 'not-found') {
        await setDoc(analyticsRef, {
          api_calls: 1,
          date: today,
          last_call: new Date()
        });
      }
    });
  } catch (error) {
    console.error('Error tracking API call:', error);
    // Don't fail the main request if analytics tracking fails
  }
}