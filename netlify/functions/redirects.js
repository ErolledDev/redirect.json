import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';

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
    // Track API call for analytics FIRST
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
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const analyticsRef = doc(db, 'analytics', today);
    
    // Try to get existing document first
    const docSnap = await getDoc(analyticsRef);
    
    if (docSnap.exists()) {
      // Document exists, increment the counter
      await updateDoc(analyticsRef, {
        api_calls: increment(1),
        last_call: now
      });
    } else {
      // Document doesn't exist, create it
      await setDoc(analyticsRef, {
        api_calls: 1,
        date: today,
        last_call: now,
        created_at: now
      });
    }
    
    // Also update monthly totals
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyRef = doc(db, 'analytics_monthly', monthKey);
    
    const monthlySnap = await getDoc(monthlyRef);
    if (monthlySnap.exists()) {
      await updateDoc(monthlyRef, {
        api_calls: increment(1),
        last_call: now
      });
    } else {
      await setDoc(monthlyRef, {
        api_calls: 1,
        month: monthKey,
        last_call: now,
        created_at: now
      });
    }
    
    // Update total counter
    const totalRef = doc(db, 'analytics_total', 'all_time');
    const totalSnap = await getDoc(totalRef);
    
    if (totalSnap.exists()) {
      await updateDoc(totalRef, {
        api_calls: increment(1),
        last_call: now
      });
    } else {
      await setDoc(totalRef, {
        api_calls: 1,
        last_call: now,
        created_at: now
      });
    }
    
    console.log(`Analytics tracked successfully for ${today}`);
    
  } catch (error) {
    console.error('Error tracking API call:', error);
    // Don't fail the main request if analytics tracking fails
  }
}