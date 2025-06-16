# OAuth API client - OAuth 2.0 Books client Demo

Minimal app implementing an API client uses OAuth 2.0 for authentication.

Built to work with the [oauth-api-server](https://github.com/mjgs/oauth-api-server).

## Client Application
- ✅ Server-side OAuth flow handling (secure credential storage)
- ✅ User profile management
- ✅ Books management interface
- ✅ Automatic token refresh
- ✅ Clean, responsive UI

## Key Features

### 🔐 Complete OAuth 2.0 Flow
- Proper scope handling: `read:profile write:profile read:books write:books`
- State parameter for CSRF protection using UUID
- Authorization code exchange for access tokens
- Refresh token handling with automatic retry

### 📊 Dashboard
- User profile display with welcome message
- Complete books listing in a responsive grid
- Add new book form with validation
- Real-time book count display

### 👤 Profile Page
- Detailed user information display
- Clean card-based layout with avatar
- Account creation and update dates
- Navigation back to dashboard

### 📚 Books Management
- Add books with title, author, ISBN, year, and description
- Display all book details in attractive cards
- Form validation for required fields
- Error handling for API failures

### 🔄 Token Management
- Automatic token refresh on 401 errors
- Session cleanup on logout
- Token expiration tracking

### 🎨 Modern UI
- Responsive design that works on mobile
- Clean, professional styling
- Hover effects and smooth transitions
- Consistent color scheme and typography

## Expected API Endpoints

- `GET /oauth/authorize` - Authorization endpoint
- `POST /oauth/token` - Token exchange/refresh endpoint
- `GET /api/me` - User profile endpoint
- `GET /api/books` - List books endpoint
- `POST /api/books` - Create book endpoint

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Register Client Application in the Server Application

1. Visit http://localhost:3000/admin
2. Register a new client with these details:
   - **Application Name**: Books Client App
   - **Redirect URI**: `http://localhost:3001/auth/callback`
   - **Scopes**: Select all available scopes
3. Save the generated `CLIENT_ID` and `CLIENT_SECRET`

### 3. Configure Client App

Update these values in the code:

- `CLIENT_ID`: Your actual client ID from the OAuth server admin
- `CLIENT_SECRET`: Your actual client secret
- `API_BASE_URL`: Your OAuth server URL (default: http://localhost:3000)
- `REDIRECT_URI`: Should match what's registered in your OAuth server

### 4. Start Client App
```bash
cd client-app
npm start
```
Client will run on http://localhost:3001

The client handles the complete OAuth flow with proper error handling, token refresh, and provides a polished user interface for managing both user profiles and books data.