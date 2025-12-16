#!/usr/bin/env node

'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFiles() {
    log('\n🔍 Checking configuration files...', 'blue');

    const serverEnvPath = path.join(__dirname, '..', 'server', '.env');
    const clientEnvPath = path.join(__dirname, '..', 'client', '.env');

    let allGood = true;

    // Check server .env
    if (!fs.existsSync(serverEnvPath)) {
        log('❌ server/.env file not found!', 'red');
        log('   Please create server/.env with required variables:', 'yellow');
        log('   - MONGO_URI', 'yellow');
        log('   - JWT_SECRET', 'yellow');
        log('   - FIREBASE_SERVICE_ACCOUNT_PATH', 'yellow');
        log('   - FIREBASE_STORAGE_BUCKET', 'yellow');
        allGood = false;
    } else {
        log('✅ server/.env found', 'green');
    }

    // Check client .env (optional)
    if (!fs.existsSync(clientEnvPath)) {
        log('⚠️  client/.env not found (optional, will use defaults)', 'yellow');
    } else {
        log('✅ client/.env found', 'green');
    }

    return allGood;
}

function startServer() {
    return new Promise((resolve, reject) => {
        log('\n🚀 Starting backend server...', 'blue');
        const serverProcess = spawn('npm', ['start'], {
            cwd: path.join(__dirname, '..', 'server'),
            stdio: 'pipe',
            shell: true,
        });

        let serverReady = false;

        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            process.stdout.write(`[SERVER] ${output}`);

            if (output.includes('Server is running on port')) {
                if (!serverReady) {
                    serverReady = true;
                    log('✅ Backend server started successfully!', 'green');
                    resolve(serverProcess);
                }
            }
        });

        serverProcess.stderr.on('data', (data) => {
            const output = data.toString();
            if (!output.includes('injecting env')) {
                process.stderr.write(`[SERVER ERROR] ${output}`);
            }
        });

        serverProcess.on('error', (error) => {
            log(`❌ Failed to start server: ${error.message}`, 'red');
            reject(error);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
            if (!serverReady) {
                log('⚠️  Server startup taking longer than expected...', 'yellow');
            }
        }, 10000);
    });
}

function startClient() {
    return new Promise((resolve, reject) => {
        log('\n🚀 Starting frontend client...', 'blue');
        const clientProcess = spawn('npm', ['run', 'dev'], {
            cwd: path.join(__dirname, '..', 'client'),
            stdio: 'pipe',
            shell: true,
        });

        let clientReady = false;

        clientProcess.stdout.on('data', (data) => {
            const output = data.toString();
            process.stdout.write(`[CLIENT] ${output}`);

            if (output.includes('Local:') || output.includes('localhost')) {
                if (!clientReady) {
                    clientReady = true;
                    log('✅ Frontend client started successfully!', 'green');
                    resolve(clientProcess);
                }
            }
        });

        clientProcess.stderr.on('data', (data) => {
            const output = data.toString();
            process.stderr.write(`[CLIENT ERROR] ${output}`);
        });

        clientProcess.on('error', (error) => {
            log(`❌ Failed to start client: ${error.message}`, 'red');
            reject(error);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
            if (!clientReady) {
                log('⚠️  Client startup taking longer than expected...', 'yellow');
            }
        }, 10000);
    });
}

function handleExit(serverProcess, clientProcess) {
    const cleanup = () => {
        log('\n\n🛑 Shutting down servers...', 'yellow');
        if (serverProcess) {
            serverProcess.kill();
            log('✅ Backend server stopped', 'green');
        }
        if (clientProcess) {
            clientProcess.kill();
            log('✅ Frontend client stopped', 'green');
        }
        process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
}

async function main() {
    log('═══════════════════════════════════════════════════════', 'cyan');
    log('   PDF Review Application - Startup Script', 'cyan');
    log('═══════════════════════════════════════════════════════', 'cyan');

    // Check configuration
    if (!checkEnvFiles()) {
        log('\n❌ Configuration check failed. Please fix the issues above.', 'red');
        process.exit(1);
    }

    let serverProcess, clientProcess;

    try {
        // Start servers
        serverProcess = await startServer();
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

        clientProcess = await startClient();

        log('\n═══════════════════════════════════════════════════════', 'green');
        log('   ✅ Application is running!', 'green');
        log('═══════════════════════════════════════════════════════', 'green');
        log('\n📍 Backend API: http://localhost:3000', 'cyan');
        log('📍 Frontend: http://localhost:5173', 'cyan');
        log('\n💡 Press Ctrl+C to stop all servers\n', 'yellow');

        // Handle graceful shutdown
        handleExit(serverProcess, clientProcess);

        // Keep process alive
        process.stdin.resume();
    } catch (error) {
        log(`\n❌ Startup failed: ${error.message}`, 'red');
        if (serverProcess) serverProcess.kill();
        if (clientProcess) clientProcess.kill();
        process.exit(1);
    }
}

main();

