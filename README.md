# PDF Review Application

A full-stack MERN application for reviewing and annotating PDF files with suggestions and comments.

## Architecture

- **Backend**: Node.js + Express + MongoDB + Firebase Storage
- **Frontend**: React + Vite
- **Database**: MongoDB Atlas
- **File Storage**: Firebase Storage

## Prerequisites

- Node.js (v18 or higher) - Install via [nvm](https://github.com/nvm-sh/nvm)
- MongoDB Atlas account (free tier)
- Firebase project with Storage enabled

## Quick Start

### Option 1: Using the Startup Script (Recommended)

```bash
# Make sure Node.js is loaded (if using nvm)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Run the startup script
./start.sh
```

Or using npm:

```bash
npm install  # Install root dependencies (concurrently)
npm start    # Start both servers
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd server
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
cd client
npm install
npm run dev
```

## Configuration

### Backend Configuration (`server/.env`)

Create `server/.env` with the following variables:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
```

### Frontend Configuration (`client/.env`)

Create `client/.env` (optional):

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Install all dependencies (root, server, and client)
npm run install:all
```

Or individually:
```bash
npm run install:server  # Backend dependencies
npm run install:client  # Frontend dependencies
```

### 2. Configure Backend

1. Create MongoDB Atlas account and get connection string
2. Create Firebase project and download service account key
3. Create `server/.env` with configuration (see above)
4. Place Firebase service account JSON in `server/config/firebase-service-account.json`

See `server/FIREBASE-SETUP.md` for detailed Firebase setup instructions.

### 3. Start the Application

```bash
npm start
```

This will start:
- Backend server on `http://localhost:3000`
- Frontend client on `http://localhost:5173`

## Available Scripts

### Root Level

- `npm start` - Start both backend and frontend servers
- `npm run dev` - Start both servers with concurrent output
- `npm run install:all` - Install all dependencies
- `npm run build` - Build frontend for production

### Server Scripts

```bash
cd server
npm start      # Start backend server
npm test       # Run tests (if configured)
```

### Client Scripts

```bash
cd client
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
```

## Project Structure

```
.
├── server/                 # Backend Node.js/Express application
│   ├── api-data/          # API services and handlers
│   ├── common/             # Shared utilities (logger, error-handler)
│   ├── config/             # Configuration files (Firebase)
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # Express routes
│   └── server.js           # Main server file
│
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── api-services/  # API client (Axios)
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React Context providers
│   │   ├── pages/         # Page components
│   │   └── App.jsx        # Main app component
│   └── package.json
│
├── scripts/               # Utility scripts
│   └── start.js          # Node.js startup script
│
├── start.sh               # Bash startup script
├── package.json           # Root package.json with scripts
└── README.md             # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Files
- `GET /api/files` - List all PDF files (protected)
- `GET /api/files/:filename` - Get signed URL for PDF (protected)

### Suggestions
- `GET /api/suggestions?fileName=example.pdf` - Get suggestions for a file
- `POST /api/suggestions` - Create suggestion (protected)
- `PUT /api/suggestions/:id` - Update suggestion (protected, creator only)
- `DELETE /api/suggestions/:id` - Delete suggestion (protected, creator only)

## Development

### Backend Development

The backend uses:
- Express.js for routing
- Mongoose for MongoDB
- Firebase Admin SDK for file storage
- JWT for authentication
- bcryptjs for password hashing

### Frontend Development

The frontend uses:
- React 19 with hooks
- React Router for navigation
- Axios for API calls
- Context API for state management
- Vite for build tooling

## 🚀 Deployment pentru producție

Pentru a deploya aplicația pe internet, consultă ghidurile complete:

- **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)** - Ghid complet de deployment (detaliat)
- **[DEPLOYMENT-QUICK-START.md](./DEPLOYMENT-QUICK-START.md)** - Ghid rapid pas cu pas (30 minute)
- **[DEPLOYMENT-COSTS.md](./DEPLOYMENT-COSTS.md)** - Analiza costurilor și comparație opțiuni

### Rezumat rapid:

**Cost estimat:** ~$6/lună  
**Opțiune recomandată:** VPS Hetzner (€4.51/lună) + Cloudflare Domain ($10/an)  
**Timp deployment:** 30-45 minute

Scripturile de deployment sunt disponibile în `scripts/deployment/`.

---

## Troubleshooting

### Server won't start
- Check that `server/.env` exists and has all required variables
- Verify MongoDB connection string is correct
- Ensure Firebase service account file exists

### Client won't start
- Run `npm install` in the `client` directory
- Check that port 5173 is not in use

### Authentication issues
- Verify JWT_SECRET is set in `server/.env`
- Check that backend server is running on port 3000
- Verify API base URL in frontend matches backend

## Documentation

- `DEVELOPMENT-PATH.md` - Complete development history and implementation details
- `server/FIREBASE-SETUP.md` - Firebase configuration guide
- `server/FIREBASE-SERVICE-ACCOUNT-GUIDE.md` - How to get Firebase service account
- `REQUIREMENTS.md` - Project requirements and specifications

## License

ISC

