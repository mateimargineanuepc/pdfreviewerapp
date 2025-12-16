# PDF Review Application - Requirements

## Chosen Architecture: MERN Stack + Firebase Storage (Serverless-ish)

This is the "Golden Path" for your needs. It combines flexibility with generous free services.

- **Backend**: Node.js + Express (hosted for free on Render.com).
- **Database**: MongoDB Atlas (Free M0 Cluster). It's perfect for storing suggestions and users.
- **File Storage (PDF)**: Firebase Storage (Free "Spark" Plan). Provides 5GB space (you need approximately 1GB) and 1GB/day download traffic (sufficient for 10 people). It's easier to configure than AWS S3.
- **Frontend**: React + Vite (hosted for free on Vercel).

Here is the battle plan, step by step. You can copy-paste prompts directly into an AI (like me, ChatGPT or Claude) to get the code.

---

## Step 1: Backend Setup & Project Structure

**Objective**: Creating the server, configuring basic security (CORS), and connecting to the database.

**What you need to do**:

- Install Node.js on your PC.
- Create a `server` folder and run `npm init -y`.
- Create a MongoDB Atlas account and get the "Connection String".

### 📋 Prompt for AI:

```
Act as a Senior Node.js Developer. Create a basic Express.js server structure for a REST API.

- Use express, mongoose (for MongoDB), dotenv, cors, and helmet.
- Create a server.js file that connects to MongoDB using a MONGO_URI from env variables.
- Create a clean folder structure: models, routes, controllers, middleware.
- Add a simple root route / that returns 'API is running'.
- Provide the necessary npm install command.
```

---

## Step 2: Defining the Data Model (Schema)

**Objective**: To define what a "User" and a "Suggestion" look like in the database.

**What you need to do**: Create the files in the `models` folder.

### 📋 Prompt for AI:

```
I need Mongoose schemas for a PDF review application.

- User Schema (User.js): Should have email (unique, required), password (string), and role (default 'user').
- Suggestion Schema (Suggestion.js): Should have fileName (string), pdfId (string), pageNumber (number), lineNumber (number), comment (text, required), userEmail (string), and createdAt (date). Write the code for these two models.
```

---

## Step 3: Authentication and Security (JWT)

**Objective**: To allow users to register and log in, receiving a secure token.

**What you need to do**: Implement the registration/login logic.

### 📋 Prompt for AI:

```
Implement Authentication using JSON Web Tokens (JWT) in Node.js.

- Create an authController.js with register and login functions. Use bcryptjs to hash passwords.
- Create an authMiddleware.js that verifies the JWT token from the Authorization: Bearer header.
- Create userRoutes.js to handle /api/auth/register and /api/auth/login.
- Ensure the middleware attaches the user info to req.user if the token is valid.
```

---

## Step 4: Firebase Storage Integration (for PDFs)

**Objective**: To store PDFs in Firebase and generate temporary links (Signed URLs) so users can see them only if they are logged in.

**What you need to do**:

- Go to Firebase Console, create a project, enable "Storage".
- Download "Service Account Key" (JSON file) from the project settings.
- Manually upload the 30 PDFs in Firebase Storage Console.

### 📋 Prompt for AI:

```
I need to serve PDF files stored in Firebase Storage securely via my Node.js API.

- Show me how to initialize firebase-admin using a service account key.
- Create a controller function getPdfUrl that accepts a filename as a parameter.
- This function should generate a Signed URL (valid for 1 hour) for that file from the storage bucket.
- Create a protected route (using the auth middleware) GET /api/files/:filename that returns this signed URL. This ensures only logged-in users can get the link to view the PDF.
```

---

## Step 5: Suggestions API

**Objective**: Saving and reading comments.

### 📋 Prompt for AI:

```
Create the CRUD logic for the Suggestions.

- Create suggestionController.js.
- createSuggestion: Receives fileName, page, line, comment. Saves it to DB using the logged-in user's email.
- getSuggestions: Receives a fileName as a query param. Returns all suggestions for that specific file, sorted by page number.
- Create the routes in suggestionRoutes.js protecting the CREATE route with the auth middleware.
```

---

## Step 6: Frontend - Setup and Login (React)

**Objective**: Basic visual interface.

**What you need to do**:

- In another folder (e.g., `client`), run `npm create vite@latest` (choose React + JavaScript).
- Install `axios`, `react-router-dom`.

### 📋 Prompt for AI:

```
Act as a Senior React Developer. I am building the frontend using Vite.

- Create a logical folder structure (components, pages, context).
- Create an AuthContext.js to handle user login state and storing the JWT in localStorage.
- Create a LoginPage.jsx with a simple form (email/password) that calls my backend /api/auth/login.
- Configure axios to automatically add the Authorization: Bearer token to every request if the user is logged in.
```

---

## Step 7: Frontend - PDF Viewer & Correction (The most complex step)

**Objective**: The page where the magic happens.

**What you need to do**: Install `react-pdf` or use native PDF.js. I recommend `react-pdf` for simplicity in React.

### 📋 Prompt for AI:

```
Create a PdfViewerPage.jsx component using react-pdf.

- The component fetches the list of available PDF filenames (hardcode a list for now or fetch from API).
- When a user selects a file, fetch the Signed URL from my backend /api/files/:filename.
- Display the PDF. Add 'Previous' and 'Next' buttons for pagination.
- Below the PDF, create a 'Suggestion Form' (Line input, Comment input) and a 'Suggestion List'.
- When the page loads or changes, fetch existing suggestions for that file and display them in a table below the viewer.
- Handle the form submission to POST data to the backend.
```

---

## 🚀 Step 8: Deployment (Launch)

This is the moment of truth. To pay nothing:

- **Backend**: Create an account on Render.com. Create a "Web Service", connect the GitHub repo with the server code. Add environment variables (MONGO_URI, FIREBASE_CREDENTIALS).
  - **Note**: On Free Tier, the server "sleeps" after 15 minutes of inactivity. The first load will take 30 seconds. It's acceptable for 10 users.
- **Frontend**: Create an account on Vercel.com. Connect the GitHub repo with the React code. It will be live in 2 minutes.

---

## Why is this the "Best" plan?

- **Cost**: 0 RON (if you stay within the generous limits, which you will).
- **Security**: You don't expose the database to the public, and PDFs are accessible only through temporary signed links, generated by your server.
- **Control**: You have total control over the data. You can always export suggestions to CSV/Excel from MongoDB if needed.
- **Scalability**: If you suddenly have 1000 users, you just upgrade to paid plans (a few dollars), without rewriting the code.
