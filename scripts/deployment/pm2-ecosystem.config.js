/**
 * PM2 Ecosystem Configuration
 * Usage: pm2 start ecosystem.config.js
 * This file manages both backend and frontend processes
 */

module.exports = {
    apps: [
        {
            name: 'pdf-review-backend',
            script: './server/server.js',
            cwd: '/var/www/pdf-review-app',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            error_file: '/var/log/pm2/pdf-review-backend-error.log',
            out_file: '/var/log/pm2/pdf-review-backend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
        },
        {
            name: 'pdf-review-frontend',
            script: 'serve',
            args: ['-s', 'dist', '-l', '5173'],
            cwd: '/var/www/pdf-review-app/client',
            env: {
                NODE_ENV: 'production',
            },
            error_file: '/var/log/pm2/pdf-review-frontend-error.log',
            out_file: '/var/log/pm2/pdf-review-frontend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            autorestart: true,
            watch: false,
        },
    ],
};

