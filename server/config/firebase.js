'use strict';

const admin = require('firebase-admin');
const Logger = require('../common/logger');

/**
 * Initializes Firebase Admin SDK using service account key
 * Service account key should be provided via FIREBASE_SERVICE_ACCOUNT environment variable (JSON string)
 * or via FIREBASE_SERVICE_ACCOUNT_PATH pointing to a JSON file
 * @returns {admin.app.App} Initialized Firebase Admin app instance
 */
function initializeFirebase() {
    try {
        // Check if Firebase is already initialized
        if (admin.apps.length > 0) {
            Logger.info('Firebase Admin already initialized');
            return admin.app();
        }

        // Get service account from environment variable
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

        let serviceAccount;

        if (serviceAccountJson) {
            // Parse service account from JSON string
            try {
                serviceAccount = JSON.parse(serviceAccountJson);
            } catch (error) {
                throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON format');
            }
        } else if (serviceAccountPath) {
            // Load service account from file path
            const fs = require('fs');
            const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
            serviceAccount = JSON.parse(serviceAccountFile);
        } else {
            throw new Error(
                'Firebase service account not configured. Set FIREBASE_SERVICE_ACCOUNT (JSON string) or FIREBASE_SERVICE_ACCOUNT_PATH (file path)'
            );
        }

        // Initialize Firebase Admin
        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || serviceAccount.project_id + '.appspot.com',
        });

        Logger.info('Firebase Admin initialized successfully');
        return app;
    } catch (error) {
        Logger.error('Firebase initialization error', error);
        throw error;
    }
}

/**
 * Gets the Firebase Storage bucket instance
 * @returns {admin.storage.Bucket} Storage bucket instance
 */
function getStorageBucket() {
    const app = initializeFirebase();
    return admin.storage().bucket();
}

module.exports = {
    initializeFirebase,
    getStorageBucket,
};

