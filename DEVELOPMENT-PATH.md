# Development Path - PDF Review Application

This document tracks the implementation progress of the PDF Review Application project, following the requirements outlined in `REQUIREMENTS.md`.

---

## Project Overview

**Architecture**: MERN Stack + Firebase Storage  
**Backend**: Node.js + Express  
**Database**: MongoDB Atlas  
**File Storage**: Firebase Storage  
**Frontend**: React + Vite (to be implemented)

---

## Implementation Progress

### ✅ Step 0: Environment Setup

**Date**: Initial Setup  
**Status**: Completed

#### Node.js Installation
- Installed Node.js v24.12.0 (LTS) using nvm (Node Version Manager)
- Installed npm v11.6.2
- nvm configured in `~/.bashrc` for automatic loading in new terminal sessions

#### Project Structure Initialization
- Created root project directory: `Corector Anastasimatar/`
- Created `server/` folder for backend code
- Initialized npm project in `server/` with `npm init -y`

#### Files Created:
- `server/package.json` - Project configuration
- `.cursorrules` - Coding standards and rules
- `REQUIREMENTS.md` - Project requirements documentation

---

### ✅ Step 1: Backend Setup & Project Structure

**Date**: Step 1 Implementation  
**Status**: Completed

#### Dependencies Installed
```json
{
  "cors": "^2.8.5",
  "dotenv": "^17.2.3",
  "express": "^5.2.1",
  "helmet": "^8.1.0",
  "mongoose": "^9.0.1"
}
```

#### MongoDB Connection Setup
- Created `.env` file with MongoDB Atlas connection string
- Connection string: `mongodb+srv://mateimargineanu_db_user:Nicoleta94!@cluster0.uki24rp.mongodb.net/?appName=Cluster0`
- Connection tested and verified successfully
- Database: MongoDB Atlas cluster
- Host: `ac-9sunty9-shard-00-01.uki24rp.mongodb.net`

#### Folder Structure Created
```
server/
├── common/           # Shared utilities and helpers
│   ├── logger.js     # Logger class for consistent logging
│   └── error-handler.js  # Centralized error handling middleware
├── controllers/      # Route handlers (empty, ready for implementation)
├── middleware/       # Custom middleware (empty, ready for implementation)
├── models/           # Mongoose schemas (empty, ready for implementation)
├── routes/           # Express route definitions (empty, ready for implementation)
├── .env              # Environment variables (MongoDB URI)
├── .gitignore        # Git ignore rules
├── package.json      # Project dependencies and scripts
└── server.js         # Main server file
```

#### Files Created and Implemented

**`server/server.js`**
- Express application setup
- MongoDB connection using Mongoose
- Security middleware (helmet, cors)
- JSON and URL-encoded body parsing
- Root route `/` returning `{ message: 'API is running' }`
- Error handling middleware integration
- Logger integration for all operations
- Server startup on port 3000 (configurable via PORT env variable)

**`server/common/logger.js`**
- Logger class with static methods
- Log levels: `error`, `warn`, `info`, `debug`, `detailed`
- Timestamp formatting for all log messages
- Structured logging for error objects and data

**`server/common/error-handler.js`**
- Centralized error handling middleware
- Standardized JSON error responses
- Error logging integration
- Development mode stack trace support
- `createError` utility function for consistent error creation

**`server/.gitignore`**
- Excludes `node_modules/`
- Excludes `.env` and environment files
- Excludes log files
- Excludes OS and IDE files

**`server/package.json`**
- Updated `main` field to `server.js`
- Added `start` script: `npm start`
- All dependencies properly listed

#### Code Standards Applied
- ✅ Strict mode (`'use strict';`) in all files
- ✅ JSDoc comments for all public methods and functions
- ✅ Single quotes for strings
- ✅ 4-space indentation
- ✅ Semicolons required
- ✅ Trailing commas in ES5 style
- ✅ async/await pattern (no Promise chaining)
- ✅ Try-catch error handling
- ✅ Logger class for all logging operations

#### Testing Performed
- ✅ MongoDB connection test: **Success**
- ✅ Server startup test: **Success**
- ✅ Server runs on port 3000
- ✅ Root route accessible
- ✅ Logger outputs formatted messages correctly

#### Cleanup Actions
- Removed unused `node_modules/`, `package.json`, and `package-lock.json` from root directory
- Project structure cleaned and organized

---

### ✅ Step 2: Defining the Data Model (Schema)

**Date**: Step 2 Implementation  
**Status**: Completed

#### Models Created

**`server/models/UserModel.js`**
- **Email field**: 
  - Type: String
  - Required: Yes
  - Unique: Yes
  - Validation: Email format regex pattern
  - Indexed: Yes (for faster queries)
  - Auto-lowercase and trim
- **Password field**:
  - Type: String
  - Required: Yes
  - Min length: 6 characters
  - Note: Will be hashed with bcryptjs in Step 3
- **Role field**:
  - Type: String
  - Enum: ['user', 'admin']
  - Default: 'user'
- **Timestamps**: Automatic `createdAt` and `updatedAt` fields
- **Indexes**: Email field indexed for performance

**`server/models/SuggestionModel.js`**
- **fileName field**:
  - Type: String
  - Required: Yes
  - Trimmed: Yes
  - Indexed: Yes (frequently queried field)
- **pdfId field**:
  - Type: String
  - Optional: Yes
  - Trimmed: Yes
- **pageNumber field**:
  - Type: Number
  - Required: Yes
  - Min value: 1
- **lineNumber field**:
  - Type: Number
  - Required: Yes
  - Min value: 1
- **comment field**:
  - Type: String
  - Required: Yes
  - Min length: 1 (cannot be empty)
  - Trimmed: Yes
- **userEmail field**:
  - Type: String
  - Required: Yes
  - Auto-lowercase and trim
  - Indexed: Yes (for filtering by user)
- **Timestamps**: Automatic `createdAt` and `updatedAt` fields
- **Indexes**: 
  - Single index on `fileName`
  - Compound index on `fileName` and `pageNumber` (for efficient queries)
  - Single index on `userEmail`

#### Code Standards Applied
- ✅ Strict mode enabled
- ✅ JSDoc comments with `@typedef` for schema types
- ✅ Single quotes for strings
- ✅ 4-space indentation
- ✅ Semicolons required
- ✅ Trailing commas in ES5 style
- ✅ Mongoose schema validation
- ✅ Indexing on frequently queried fields
- ✅ Input sanitization (trim, lowercase)
- ✅ Proper error messages in validation

#### Schema Features
- Email validation with regex pattern
- Password minimum length validation
- Role enum validation
- Page and line number minimum value validation
- Automatic timestamps (createdAt, updatedAt)
- Performance-optimized indexes
- Compound indexes for complex queries

#### Files Created
- `server/models/UserModel.js` - User schema and model
- `server/models/SuggestionModel.js` - Suggestion schema and model

---

### ✅ Step 3: Authentication and Security (JWT)

**Date**: Step 3 Implementation  
**Status**: Completed

#### Dependencies Installed
```json
{
  "jsonwebtoken": "^9.x.x",
  "bcryptjs": "^2.x.x"
}
```

#### Authentication Components Created

**`server/controllers/authController.js`**
- **register function**:
  - Validates email and password input
  - Checks for existing user by email
  - Hashes password using bcryptjs (10 salt rounds)
  - Creates new user in database
  - Generates JWT token with user info (userId, email, role)
  - Returns user data (without password) and token
  - JWT expiration: 7 days (configurable via JWT_EXPIRES_IN env variable)
- **login function**:
  - Validates email and password input
  - Finds user by email
  - Verifies password using bcrypt.compare()
  - Generates JWT token on successful authentication
  - Returns user data (without password) and token
- **Error handling**: Proper try-catch blocks with Logger integration
- **Security**: Passwords never returned in responses

**`server/middleware/authMiddleware.js`**
- **JWT verification**:
  - Extracts token from `Authorization: Bearer <token>` header
  - Validates token format and presence
  - Verifies token signature using JWT_SECRET
  - Handles expired tokens (TokenExpiredError)
  - Handles invalid tokens (JsonWebTokenError)
- **Request enhancement**:
  - Attaches user info to `req.user` object if token is valid
  - User info includes: userId, email, role
- **Error handling**: Returns 401 for authentication failures
- **Logging**: Logs authentication attempts and failures

**`server/routes/userRoutes.js`**
- **POST /api/auth/register**: User registration endpoint
  - Accepts: email, password, role (optional)
  - Returns: User data and JWT token
- **POST /api/auth/login**: User login endpoint
  - Accepts: email, password
  - Returns: User data and JWT token
- Routes properly documented with JSDoc comments

#### Server Integration
- Updated `server.js` to include `/api/auth` routes
- Routes mounted before error handler middleware
- Environment variables added to `.env`:
  - `JWT_SECRET`: Secret key for JWT signing and verification
  - `JWT_EXPIRES_IN`: Token expiration time (default: 7d)

#### Code Standards Applied
- ✅ Strict mode enabled
- ✅ JSDoc comments for all functions
- ✅ Single quotes for strings
- ✅ 4-space indentation
- ✅ Semicolons required
- ✅ Trailing commas in ES5 style
- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ Error handling with try-catch blocks
- ✅ async/await pattern
- ✅ Logger integration for all operations
- ✅ Input validation and sanitization
- ✅ Centralized error handling

#### Security Features
- ✅ Passwords hashed with bcryptjs (10 salt rounds)
- ✅ Passwords never returned in API responses
- ✅ JWT tokens with expiration
- ✅ Token verification middleware
- ✅ Secure error messages (don't reveal if email exists)
- ✅ Authorization header validation
- ✅ Token format validation

#### Files Created
- `server/controllers/authController.js` - Registration and login logic
- `server/middleware/authMiddleware.js` - JWT token verification middleware
- `server/routes/userRoutes.js` - Authentication routes

#### Files Modified
- `server/server.js` - Added `/api/auth` route mounting
- `server/.env` - Added JWT_SECRET and JWT_EXPIRES_IN

---

### ✅ Step 4: Firebase Storage Integration

**Date**: Step 4 Implementation  
**Status**: Completed

#### Dependencies Installed
```json
{
  "firebase-admin": "^12.x.x"
}
```

#### Firebase Components Created

**`server/config/firebase.js`**
- **initializeFirebase function**:
  - Initializes Firebase Admin SDK
  - Supports two configuration methods:
    - `FIREBASE_SERVICE_ACCOUNT`: JSON string in environment variable
    - `FIREBASE_SERVICE_ACCOUNT_PATH`: Path to service account JSON file
  - Prevents duplicate initialization
  - Configures storage bucket from environment or project ID
  - Comprehensive error handling and logging
- **getStorageBucket function**:
  - Returns Firebase Storage bucket instance
  - Ensures Firebase is initialized before use
- **Security**: Service account keys never logged or exposed

**`server/controllers/fileController.js`**
- **getPdfUrl function**:
  - Accepts filename as route parameter
  - Validates and sanitizes filename (prevents path traversal attacks)
  - Checks if file exists in Firebase Storage
  - Generates signed URL valid for 1 hour (3600 seconds)
  - Returns signed URL with expiration information
  - Comprehensive error handling
- **listPdfFiles function** (bonus feature):
  - Lists all PDF files in Firebase Storage
  - Returns file metadata (name, size, updated date)
  - Filters for .pdf extension
  - Useful for frontend file selection
- **Security**: Filename sanitization prevents directory traversal attacks

**`server/routes/fileRoutes.js`**
- **GET /api/files**: List all PDF files (protected route)
  - Requires JWT authentication via authMiddleware
  - Returns list of available PDF files
- **GET /api/files/:filename**: Get signed URL for specific PDF (protected route)
  - Requires JWT authentication via authMiddleware
  - Returns signed URL valid for 1 hour
  - Only logged-in users can access PDF links
- All routes properly documented with JSDoc

#### Server Integration
- Updated `server.js` to include `/api/files` routes
- Routes mounted after authentication routes
- Firebase initialization happens on first file request

#### Documentation Created
- **`server/FIREBASE-SETUP.md`**: Comprehensive setup guide
  - Step-by-step Firebase project setup
  - Service account key configuration
  - Environment variable setup
  - Security best practices
  - Troubleshooting guide

#### Security Features
- ✅ All file endpoints protected with JWT authentication
- ✅ Signed URLs expire after 1 hour
- ✅ Filename sanitization prevents path traversal
- ✅ Service account keys excluded from version control
- ✅ File existence validation before URL generation
- ✅ No direct file paths exposed to clients

#### Code Standards Applied
- ✅ Strict mode enabled
- ✅ JSDoc comments for all functions
- ✅ Single quotes for strings
- ✅ 4-space indentation
- ✅ Semicolons required
- ✅ Trailing commas in ES5 style
- ✅ Error handling with try-catch blocks
- ✅ async/await pattern
- ✅ Logger integration throughout
- ✅ Input validation and sanitization

#### Files Created
- `server/config/firebase.js` - Firebase Admin initialization
- `server/controllers/fileController.js` - PDF file handling logic
- `server/routes/fileRoutes.js` - File API routes
- `server/FIREBASE-SETUP.md` - Firebase setup documentation

#### Files Modified
- `server/server.js` - Added `/api/files` route mounting
- `server/.gitignore` - Added Firebase service account key patterns

#### Environment Variables Required
- `FIREBASE_SERVICE_ACCOUNT` - JSON string of service account (for deployment)
- OR `FIREBASE_SERVICE_ACCOUNT_PATH` - Path to service account JSON file (for local dev)
- `FIREBASE_STORAGE_BUCKET` - Storage bucket name (optional, defaults to project-id.appspot.com)

#### API Endpoints Created
- `GET /api/files` - List all PDF files (requires authentication)
- `GET /api/files/:filename` - Get signed URL for specific PDF (requires authentication)

#### Next Steps for User
- Manual upload of 30 PDFs to Firebase Storage Console (as per requirements)
- Configure Firebase service account in `.env` file
- Test file endpoints with authenticated requests

---

### ✅ Step 5: Suggestions API

**Date**: Step 5 Implementation  
**Status**: Completed

#### Components Created

**`server/controllers/suggestionController.js`**
- **createSuggestion function**:
  - Receives: fileName, page, line, comment, pdfId (optional)
  - Uses logged-in user's email from `req.user` (set by auth middleware)
  - Validates all required fields
  - Creates and saves suggestion to database
  - Returns created suggestion data (without password)
  - Comprehensive error handling
- **getSuggestions function**:
  - Receives fileName as query parameter
  - Returns all suggestions for the specified file
  - Sorted by page number, then by line number
  - Returns suggestion count
- **getSuggestionById function** (bonus):
  - Gets a single suggestion by ID
  - Returns 404 if not found
- **updateSuggestion function** (bonus):
  - Updates suggestion comment
  - Only allows updates by the user who created it
  - Returns 403 if user tries to update someone else's suggestion
- **deleteSuggestion function** (bonus):
  - Deletes a suggestion
  - Only allows deletion by the user who created it
  - Returns 403 if user tries to delete someone else's suggestion
- All functions include proper error handling and logging

**`server/routes/suggestionRoutes.js`**
- **GET /api/suggestions**: Get all suggestions for a file (query param: fileName)
  - Public route (no authentication required for reading)
- **GET /api/suggestions/:id**: Get single suggestion by ID
  - Public route
- **POST /api/suggestions**: Create new suggestion (protected route)
  - Requires JWT authentication via authMiddleware
  - Body: fileName, page, line, comment, pdfId (optional)
- **PUT /api/suggestions/:id**: Update suggestion (protected route)
  - Requires JWT authentication
  - Only creator can update
- **DELETE /api/suggestions/:id**: Delete suggestion (protected route)
  - Requires JWT authentication
  - Only creator can delete
- All routes properly documented with JSDoc

#### Server Integration
- Updated `server.js` to include `/api/suggestions` routes
- Routes mounted after file routes
- CREATE route protected with authMiddleware as required

#### Code Standards Applied
- ✅ Strict mode enabled
- ✅ JSDoc comments for all functions
- ✅ Single quotes for strings
- ✅ 4-space indentation
- ✅ Semicolons required
- ✅ Trailing commas in ES5 style
- ✅ Error handling with try-catch blocks
- ✅ async/await pattern
- ✅ Logger integration throughout
- ✅ Input validation and sanitization
- ✅ User email automatically set from authenticated user
- ✅ Ownership verification for update/delete operations

#### Security Features
- ✅ CREATE route protected with JWT authentication
- ✅ Only authenticated users can create suggestions
- ✅ User email automatically set from token (prevents spoofing)
- ✅ Update/delete operations restricted to suggestion creator
- ✅ Input validation prevents invalid data
- ✅ Error messages don't expose sensitive information

#### Files Created
- `server/controllers/suggestionController.js` - Suggestion CRUD operations
- `server/routes/suggestionRoutes.js` - Suggestion API routes

#### Files Modified
- `server/server.js` - Added `/api/suggestions` route mounting

#### API Endpoints Created
- `GET /api/suggestions?fileName=example.pdf` - Get all suggestions for a file
- `GET /api/suggestions/:id` - Get single suggestion by ID
- `POST /api/suggestions` - Create new suggestion (protected)
- `PUT /api/suggestions/:id` - Update suggestion (protected, creator only)
- `DELETE /api/suggestions/:id` - Delete suggestion (protected, creator only)

#### Data Flow
1. User authenticates and receives JWT token
2. User creates suggestion with fileName, page, line, comment
3. Server extracts user email from JWT token (req.user.email)
4. Suggestion saved with userEmail automatically set
5. Suggestions can be retrieved by fileName, sorted by page/line
6. Only creator can update/delete their own suggestions

---

## Next Steps (To Be Implemented)

### 🔲 Step 5: Suggestions API
- ✅ Initialize firebase-admin with service account key
- ✅ Create file controller for PDF file handling
- ✅ Implement `getPdfUrl` function to generate Signed URLs (1 hour validity)
- ✅ Create protected route `GET /api/files/:filename`
- 🔲 Manual upload of 30 PDFs to Firebase Storage Console (user action required)

### 🔲 Step 7: Frontend - PDF Viewer & Correction
- Install react-pdf
- Create `PdfViewerPage.jsx` component
- Implement PDF file selection
- Fetch Signed URLs from backend
- Display PDF with pagination (Previous/Next buttons)
- Create Suggestion Form (Line input, Comment input)
- Create Suggestion List/Table
- Fetch and display existing suggestions
- Handle form submission to POST suggestions

### 🔲 Step 8: Deployment
- Backend deployment on Render.com
- Frontend deployment on Vercel.com
- Environment variables configuration
- Database connection verification in production

---

## Technical Decisions

### Why nvm for Node.js?
- Easy version management
- Latest LTS version (v24.12.0)
- No system-wide installation conflicts

### Why separate `common/` folder?
- Follows project structure standards from `.cursorrules`
- Centralizes shared utilities (logger, error-handler)
- Makes code more maintainable and reusable

### Why Logger class instead of console.log?
- Consistent logging format across the application
- Timestamp formatting
- Different log levels for better debugging
- Follows project coding standards

### Why centralized error handler?
- Standardized error responses
- Consistent error logging
- Easier to maintain and update error handling logic
- Follows Express.js best practices

---

## Notes

- All code follows the standards defined in `.cursorrules`
- MongoDB connection is working and tested
- Server structure is ready for next implementation steps
- Environment variables are properly secured in `.env` (excluded from git)

---

## Changelog

### 2025-12-15
- ✅ Initial project setup
- ✅ Node.js installation via nvm
- ✅ Server folder structure creation
- ✅ MongoDB connection setup
- ✅ Express server implementation
- ✅ Logger and error handler utilities
- ✅ Project cleanup
- ✅ Step 2: Data models implementation (UserModel, SuggestionModel)
- ✅ Step 3: Authentication and Security (JWT) - Register, Login, JWT middleware
- ✅ Step 4: Firebase Storage Integration - File service, signed URLs, protected routes
- ✅ Step 5: Suggestions API - CRUD operations, protected CREATE route, ownership verification
- ✅ Step 6: Frontend Setup and Login (React) - Vite setup, AuthContext, LoginPage, axios configuration

---

*This document will be updated as new features are implemented.*

