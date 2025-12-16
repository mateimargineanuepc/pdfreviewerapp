# Quick Start Guide

## 🚀 Start Everything with One Command

### Option 1: Using npm (Recommended)

```bash
# Make sure Node.js is loaded (if using nvm)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Start both servers
npm start
```

### Option 2: Using Bash Script

```bash
# Make sure Node.js is loaded (if using nvm)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Run the startup script
./start.sh
```

## 📋 What Gets Started

- ✅ **Backend Server**: `http://localhost:3000`
- ✅ **Frontend Client**: `http://localhost:5173`

## ⚙️ Prerequisites

Before starting, make sure you have:

1. ✅ **Node.js installed** (v18+)
2. ✅ **server/.env configured** with:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `FIREBASE_SERVICE_ACCOUNT_PATH`
   - `FIREBASE_STORAGE_BUCKET`
3. ✅ **Dependencies installed**:
   ```bash
   npm run install:all
   ```

## 🛑 Stopping the Servers

Press `Ctrl+C` in the terminal where you started the servers.

## 📝 Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start both backend and frontend |
| `npm run dev` | Start both with concurrent output |
| `npm run install:all` | Install all dependencies |
| `npm run start:server` | Start only backend |
| `npm run start:client` | Start only frontend |
| `npm run build` | Build frontend for production |

## 🔧 Troubleshooting

### "Node.js not found"
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### "server/.env not found"
Create `server/.env` with required variables (see README.md)

### "Port already in use"
- Backend (3000): Stop any process using port 3000
- Frontend (5173): Vite will automatically use next available port

### Dependencies not installed
```bash
npm run install:all
```

## 📚 More Information

See `README.md` for complete documentation.

