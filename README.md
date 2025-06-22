# Redirect Manager - Professional Admin Panel

A modern, professional redirect management system built with Firebase and Netlify. Create, manage, and track short URLs with SEO metadata and analytics.

## Features

- 🔐 **Secure Authentication** - Firebase Auth with email/password
- 📊 **Analytics Dashboard** - Track API usage and Firebase quota
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 🔍 **Advanced Filtering** - Search, filter, and sort redirects
- 📱 **Mobile Responsive** - Works perfectly on all devices
- 🚀 **Fast API** - Cached JSON endpoint for third-party integration
- 📈 **SEO Optimized** - Rich metadata for better search visibility

## Third Party Website Integration

**To update your third party website URL:**
1. Go to the Overview section in your admin panel
2. Click "Update URL" next to the Third Party Integration info
3. Enter your domain (e.g., `mywebsite.com`)
4. Save the changes

Your redirects will then be accessible at: `https://yourthirdpartywebsite.com/slug-name`

## API Usage

### Endpoint
```
https://yourdomain.com/redirects.json
```

### JavaScript (Browser)
```javascript
// Fetch all redirects
fetch('https://yourdomain.com/redirects.json')
  .then(response => response.json())
  .then(data => {
    console.log('Redirects:', data);
    // Access specific redirect: data['slug-name']
  })
  .catch(error => console.error('Error:', error));

// Get specific redirect and redirect user
const slug = 'my-post';
fetch('https://yourdomain.com/redirects.json')
  .then(response => response.json())
  .then(data => {
    const redirect = data[slug];
    if (redirect) {
      // Redirect user to the target URL
      window.location.href = redirect.url;
    } else {
      console.log('Redirect not found');
    }
  });
```

### Node.js
```javascript
const https = require('https');

// Using built-in https module
https.get('https://yourdomain.com/redirects.json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const redirects = JSON.parse(data);
    console.log('Redirects:', redirects);
  });
});

// Using fetch (Node.js 18+)
const response = await fetch('https://yourdomain.com/redirects.json');
const redirects = await response.json();
console.log('Redirects:', redirects);
```

### Next.js API Route
```javascript
// pages/api/redirects.js
export default async function handler(req, res) {
  try {
    const response = await fetch('https://yourdomain.com/redirects.json');
    const redirects = await response.json();
    res.status(200).json(redirects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch redirects' });
  }
}

// pages/[slug].js - Dynamic redirect page
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function RedirectPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [redirect, setRedirect] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    fetch('/api/redirects')
      .then(res => res.json())
      .then(data => {
        const redirectData = data[slug];
        if (redirectData) {
          setRedirect(redirectData);
          // Redirect after a short delay
          setTimeout(() => {
            window.location.href = redirectData.url;
          }, 1000);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!redirect) {
    return <div>Redirect not found</div>;
  }

  return (
    <div>
      <h1>{redirect.title}</h1>
      <p>{redirect.desc}</p>
      <p>Redirecting to {redirect.url}...</p>
    </div>
  );
}
```

### PHP
```php
<?php
// Fetch all redirects
$json = file_get_contents('https://yourdomain.com/redirects.json');
$redirects = json_decode($json, true);

// Get specific redirect from URL parameter
$slug = $_GET['slug'] ?? '';

if (isset($redirects[$slug])) {
    $redirect = $redirects[$slug];
    
    // Set SEO meta tags before redirecting (optional)
    echo "<title>" . htmlspecialchars($redirect['title']) . "</title>";
    echo "<meta name='description' content='" . htmlspecialchars($redirect['desc']) . "'>";
    
    // Redirect to target URL
    header('Location: ' . $redirect['url'], true, 301);
    exit;
} else {
    http_response_code(404);
    echo 'Redirect not found';
}
?>
```

### Python (Flask)
```python
import requests
from flask import Flask, redirect, request, jsonify

app = Flask(__name__)

@app.route('/<slug>')
def handle_redirect(slug):
    try:
        response = requests.get('https://yourdomain.com/redirects.json')
        redirects = response.json()
        
        if slug in redirects:
            redirect_data = redirects[slug]
            return redirect(redirect_data['url'], code=301)
        else:
            return 'Redirect not found', 404
    except Exception as e:
        return f'Error: {str(e)}', 500

if __name__ == '__main__':
    app.run(debug=True)
```

### cURL
```bash
# Fetch all redirects
curl -X GET "https://yourdomain.com/redirects.json" \
     -H "Accept: application/json"

# Pretty print JSON
curl -s "https://yourdomain.com/redirects.json" | jq '.'

# Get specific redirect URL
curl -s "https://yourdomain.com/redirects.json" | \
  jq -r '.["my-post"].url'
```

## Response Format

The API returns a JSON object where each key is a slug and the value contains the redirect data:

```json
{
  "my-awesome-post": {
    "title": "My Awesome Post",
    "desc": "This is an amazing post about...",
    "url": "https://example.com/full-article",
    "image": "https://example.com/image.jpg",
    "video": "https://youtube.com/watch?v=...",
    "keywords": "awesome, post, example",
    "site_name": "My Website",
    "type": "article",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

## Content Types

The system supports various content types:

- 📄 **Article** - Blog posts, news articles, documentation
- 🌐 **Website** - General web pages, landing pages
- 🎥 **Video** - YouTube videos, tutorials, webinars
- 🛍️ **Product** - E-commerce products, services
- 📚 **Book** - Books, ebooks, publications
- 🎵 **Music** - Songs, albums, playlists
- 👤 **Profile** - Social profiles, team pages

## Firebase Quota & Analytics

- **Free Tier Limit**: 50,000 document reads per day
- **API Call Tracking**: Each request to `/redirects.json` counts as one read per redirect
- **Analytics Dashboard**: Monitor your usage in real-time
- **Optimization Tips**: 
  - Cache responses on your third-party website
  - Use CDN for better performance
  - Consider upgrading to paid plan for higher limits

## Setup Instructions

1. **Clone the repository**
2. **Configure Firebase**:
   - Update `firebaseConfig` in `script.js`
   - Set up Firestore rules for public read access
3. **Deploy to Netlify**:
   - Connect your repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
4. **Update your domain**:
   - Replace `yourdomain.com` with your actual domain
   - Update third-party website URL in the admin panel

## Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to redirects for JSON endpoint
    match /redirects/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated users to manage analytics
    match /analytics/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For support or questions, please open an issue on GitHub or contact the development team.