const express = require('express');
const session = require('express-session');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Configuration
const CLIENT_ID = 'your-client-id'; // Replace with actual client ID from admin interface
const CLIENT_SECRET = 'your-client-secret'; // Replace with actual client secret
const REDIRECT_URI = 'http://localhost:3001/auth/callback';
const API_BASE_URL = 'http://localhost:3000';
const SCOPES = 'read:profile write:profile read:books write:books';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Middleware to check authentication
function requireAuth(req, res, next) {
  if (!req.session.accessToken) {
    return res.redirect('/login');
  }
  next();
}

// Helper function to make authenticated API requests
async function makeAuthenticatedRequest(url, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${req.session.accessToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('API Request Error:', error.response?.data || error.message);
    throw error;
  }
}

// Routes
app.get('/', (req, res) => {
  if (req.session.accessToken) {
    res.redirect('/dashboard');
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Books App</title>
          <style>
              body {
font-family: Arial, sans-serif;
max-width: 600px;
margin: 100px auto;
text-align: center;
          }

              .btn {
display: inline-block;
padding: 12px 24px;
background: #007bff;
color: white;
text-decoration: none;
border-radius: 5px;
          }

              .btn:hover {
background: #0056b3;
}
          </style>
      </head>
      <body>
          <h1>Welcome to Books App</h1>
          <p>A demo application showcasing OAuth 2.0 integration</p>
          <a href="/login" class="btn">Login with OAuth</a>
      </body>
      </html>
    `);
  }
});

app.get('/login', (req, res) => {
  const state = uuidv4();
  req.session.oauthState = state;
  
  const authUrl = new URL('/oauth/authorize', API_BASE_URL);
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', SCOPES);
  authUrl.searchParams.append('state', state);
  
  res.redirect(authUrl.toString());
});

app.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.send(`<h1>Authorization Error</h1><p>${error}</p><a href="/">Try again</a>`);
  }
  
  if (state !== req.session.oauthState) {
    return res.status(400).send('Invalid state parameter');
  }
  
  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(`${API_BASE_URL}/oauth/token`, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    });
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Store tokens in session
    req.session.accessToken = access_token;
    req.session.refreshToken = refresh_token;
    req.session.tokenExpiresAt = Date.now() + (expires_in * 1000);
    
    delete req.session.oauthState;
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.status(500).send('Failed to obtain access token');
  }
});

app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    // Get user profile
    const profileResponse = await axios.get(`${API_BASE_URL}/api/me`, {
      headers: {
        'Authorization': `Bearer ${req.session.accessToken}`
      }
    });
    
    const profile = profileResponse.data;
    
    // Get books
    const booksResponse = await axios.get(`${API_BASE_URL}/api/books`, {
      headers: {
        'Authorization': `Bearer ${req.session.accessToken}`
      }
    });
    
    const books = booksResponse.data;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Dashboard - Books App</title>
          <style>
              body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                  margin: 0; 
                  padding: 20px; 
                  background: #f8f9fa; 
              }

              .container {
max-width: 1200px;
margin: 0 auto;
          }

              .header { 
                  background: white; 
                  padding: 20px; 
                  border-radius: 8px; 
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); 
                  margin-bottom: 20px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
              }

              .profile-info {
                  background: #e8f5e8;
                  padding: 15px;
                  border-radius: 6px;
                  margin-bottom: 20px;
              }

              .books-section {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                  margin-bottom: 20px;
              }

              .books-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                  gap: 20px;
                  margin-top: 20px;
              }

              .book-card {
                  background: #f8f9fa;
                  padding: 15px;
                  border-radius: 6px;
                  border: 1px solid #e9ecef;
                  transition: transform 0.2s;
              }

              .book-card:hover {
transform: translateY(-2px);
          }

              .book-title {
font-weight: bold;
color: #333;
margin-bottom: 5px;
          }

              .book-author {
color: #666;
font-size: 14px;
margin-bottom: 10px;
          }

              .book-meta {
font-size: 12px;
color: #999;
          }

              .add-book-form {
                  background: #fff3cd;
                  padding: 20px;
                  border-radius: 6px;
                  margin-bottom: 20px;
              }

              .form-group {
                  margin-bottom: 15px;
              }

              .form-group label {
                  display: block;
                  margin-bottom: 5px;
                  font-weight: 500;
              }

              .form-group input,
.form-group textarea {
                  width: 100%;
                  padding: 8px 12px;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                  font-size: 14px;
              }

              .form-group textarea {
                  height: 80px;
                  resize: vertical;
              }

              .form-row {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
              }

              .btn {
                  display: inline-block;
                  padding: 10px 20px;
                  background: #007bff;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  border: none;
                  cursor: pointer;
                  font-size: 14px;
              }

              .btn:hover {
background: #0056b3;
          }

              .btn-danger {
background: #dc3545;
          }

              .btn-danger:hover {
background: #c82333;
          }

              .btn-success {
background: #28a745;
          }

              .btn-success:hover {
background: #218838;
          }

              .nav-links {
display: flex;
gap: 10px;
          }

              .no-books {
text-align: center;
color: #666;
font-style: italic;
padding: 40px;
          }

              @media (max-width: 768px) {
                  .form-row {
grid-template-columns: 1fr;
            }

                  .header {
flex-direction: column;
gap: 15px;
text-align: center;
}
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>📚 Books Dashboard</h1>
                  <div class="nav-links">
                      <a href="/profile" class="btn">View Profile</a>
                      <a href="/logout" class="btn btn-danger">Logout</a>
                  </div>
              </div>
              
              <div class="profile-info">
                  <h3>Welcome back, ${profile.username || profile.name || 'User'}!</h3>
                  <p>You have access to read and manage your books library.</p>
              </div>
              
              <div class="add-book-form">
                  <h3>Add New Book</h3>
                  <form action="/books" method="POST">
                      <div class="form-row">
                          <div class="form-group">
                              <label for="title">Title *</label>
                              <input type="text" id="title" name="title" required>
                          </div>
                          <div class="form-group">
                              <label for="author">Author *</label>
                              <input type="text" id="author" name="author" required>
                          </div>
                      </div>
                      <div class="form-row">
                          <div class="form-group">
                              <label for="isbn">ISBN</label>
                              <input type="text" id="isbn" name="isbn">
                          </div>
                          <div class="form-group">
                              <label for="publishedYear">Published Year</label>
                              <input type="number" id="publishedYear" name="publishedYear" min="1000" max="2030">
                          </div>
                      </div>
                      <div class="form-group">
                          <label for="description">Description</label>
                          <textarea id="description" name="description" placeholder="Brief description of the book..."></textarea>
                      </div>
                      <button type="submit" class="btn btn-success">Add Book</button>
                  </form>
              </div>
              
              <div class="books-section">
                  <h3>Your Books (${Array.isArray(books) ? books.length : 0})</h3>
                  
                  ${Array.isArray(books) && books.length > 0 ? `
                      <div class="books-grid">
                          ${books.map(book => `
                              <div class="book-card">
                                  <div class="book-title">${book.title || 'Untitled'}</div>
                                  <div class="book-author">by ${book.author || 'Unknown Author'}</div>
                                  ${book.isbn ? `<div class="book-meta">ISBN: ${book.isbn}</div>` : ''}
                                  ${book.publishedYear ? `<div class="book-meta">Published: ${book.publishedYear}</div>` : ''}
                                  ${book.description ? `<div class="book-meta" style="margin-top: 10px; color: #555;">${book.description}</div>`
: ''}
                                  <div class="book-meta" style="margin-top: 10px;">
                                      ID: ${book.id || book._id || 'N/A'}
                                  </div>
                              </div>
                          `).join('')}
                      </div>
                  ` : `
                      <div class="no-books">
                          <p>No books in your library yet. Add your first book above!</p>
                      </div>
                  `}
              </div>
          </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Dashboard error:', error.response?.data || error.message);
    
    // Check if token is expired
    if (error.response?.status === 401) {
      // Try to refresh token
      if (req.session.refreshToken) {
        try {
          const refreshResponse = await axios.post(`${API_BASE_URL}/oauth/token`, {
            grant_type: 'refresh_token',
            refresh_token: req.session.refreshToken,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
          });
          
          const { access_token, refresh_token, expires_in } = refreshResponse.data;
          req.session.accessToken = access_token;
          if (refresh_token) req.session.refreshToken = refresh_token;
          req.session.tokenExpiresAt = Date.now() + (expires_in * 1000);
          
          // Retry the dashboard request
          return res.redirect('/dashboard');
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
        }
      }
      
      // Clear session and redirect to login
      req.session.destroy();
      return res.redirect('/login');
    }
    
    res.status(500).send(`
      <h1>Error Loading Dashboard</h1>
      <p>There was an error loading your dashboard. Please try again.</p>
      <a href="/dashboard" class="btn">Retry</a>
      <a href="/logout" class="btn btn-danger">Logout</a>
    `);
  }
});

app.get('/profile', requireAuth, async (req, res) => {
  try {
    const profileResponse = await axios.get(`${API_BASE_URL}/api/me`, {
      headers: {
        'Authorization': `Bearer ${req.session.accessToken}`
      }
    });
    
    const profile = profileResponse.data;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Profile - Books App</title>
          <style>
              body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                  margin: 0; 
                  padding: 20px; 
                  background: #f8f9fa; 
              }
              .container { max-width: 800px; margin: 0 auto; }
              .profile-card {
                  background: white;
                  padding: 30px;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  margin-bottom: 20px;
              }
              .profile-header {
                  text-align: center;
                  margin-bottom: 30px;
                  padding-bottom: 20px;
                  border-bottom: 1px solid #eee;
              }
              .profile-avatar {
                  width: 80px;
                  height: 80px;
                  border-radius: 50%;
                  background: #007bff;
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 32px;
                  margin: 0 auto 15px;
              }
              .profile-info {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 30px;
              }
              .info-item {
                  padding: 15px;
                  background: #f8f9fa;
                  border-radius: 6px;
              }
              .info-label {
                  font-size: 12px;
                  color: #666;
                  text-transform: uppercase;
                  font-weight: 600;
                  margin-bottom: 5px;
              }
              .info-value {
                  font-size: 16px;
                  color: #333;
                  font-weight: 500;
              }
              .btn {
                  display: inline-block;
                  padding: 12px 24px;
                  background: #007bff;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  margin: 5px;
              }
              .btn:hover { background: #0056b3; }
              .btn-secondary { background: #6c757d; }
              .btn-secondary:hover { background: #5a6268; }
              .actions { text-align: center; }
              @media (max-width: 768px) {
                  .profile-info { grid-template-columns: 1fr; }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="profile-card">
                  <div class="profile-header">
                      <div class="profile-avatar">
                          ${(profile.username || profile.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <h1>${profile.username || profile.name || 'User Profile'}</h1>
                      <p>Manage your account information and preferences</p>
                  </div>
                  
                  <div class="profile-info">
                      <div class="info-item">
                          <div class="info-label">User ID</div>
                          <div class="info-value">${profile.id || profile._id || 'N/A'}</div>
                      </div>
                      <div class="info-item">
                          <div class="info-label">Username</div>
                          <div class="info-value">${profile.username || 'N/A'}</div>
                      </div>
                      <div class="info-item">
                          <div class="info-label">Email</div>
                          <div class="info-value">${profile.email || 'N/A'}</div>
                      </div>
                      <div class="info-item">
                          <div class="info-label">Name</div>
                          <div class="info-value">${profile.name || profile.fullName || 'N/A'}</div>
                      </div>
                      <div class="info-item">
                          <div class="info-label">Account Created</div>
                          <div class="info-value">${profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</div>
                      </div>
                      <div class="info-item">
                          <div class="info-label">Last Updated</div>
                          <div class="info-value">${profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}</div>
                      </div>
                  </div>
                  
                  <div class="actions">
                      <a href="/dashboard" class="btn">Back to Dashboard</a>
                      <a href="/logout" class="btn btn-secondary">Logout</a>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Profile error:', error.response?.data || error.message);
    res.status(500).send(`
      <h1>Error Loading Profile</h1>
      <p>There was an error loading your profile.</p>
      <a href="/dashboard">Back to Dashboard</a>
    `);
  }
});

app.post('/books', requireAuth, async (req, res) => {
  try {
    const { title, author, isbn, publishedYear, description } = req.body;
    
    if (!title || !author) {
      return res.status(400).send(`
        <h1>Error</h1>
        <p>Title and author are required fields.</p>
        <a href="/dashboard">Back to Dashboard</a>
      `);
    }
    
    const bookData = {
      title,
      author,
      isbn: isbn || undefined,
      publishedYear: publishedYear ? parseInt(publishedYear) : undefined,
      description: description || undefined
    };
    
    await axios.post(`${API_BASE_URL}/api/books`, bookData, {
      headers: {
        'Authorization': `Bearer ${req.session.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    res.redirect('/dashboard');
    
  } catch (error) {
    console.error('Add book error:', error.response?.data || error.message);
    res.status(500).send(`
      <h1>Error Adding Book</h1>
      <p>There was an error adding your book: ${error.response?.data?.message || error.message}</p>
      <a href="/dashboard">Back to Dashboard</a>
    `);
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    res.redirect('/');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send(`
    <h1>Server Error</h1>
    <p>Something went wrong. Please try again.</p>
    <a href="/">Go Home</a>
  `);
});

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go Home</a>
  `);
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`OAuth client running on http://localhost:${PORT}`);
  console.log(`Make sure your OAuth server is running on ${API_BASE_URL}`);
  console.log(`Client ID: ${CLIENT_ID}`);
  console.log(`Redirect URI: ${REDIRECT_URI}`);
  console.log(`Scopes: ${SCOPES}`);
});

module.exports = app;