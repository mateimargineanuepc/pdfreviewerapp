'use strict';

import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { Link } from 'react-router-dom';
import './HomePage.css';

/**
 * HomePage component - Main landing page after login
 * @returns {JSX.Element} HomePage component
 */
function HomePage() {
    const { user } = useAuth();
    const { t } = useI18n();

    return (
        <div className="home-page">
            <div className="home-container">
                <h1>{t('home.welcome')}</h1>
                <h2>{t('home.projectInfo')}</h2>
                <p>{t('home.projectDescription')}</p>
                <h2>{t('home.thankYou')}</h2>
                <p>{t('home.beforeStart')}</p>
                <div className="home-section">
                    <h3>{t('home.mainFeatures')}</h3>
                    <ul style={{ textAlign: 'left', maxWidth: 700, margin: '20px auto' }}>
                        <li>
                            <strong>{t('home.featureViewDocuments')}</strong> {t('home.featureViewDocumentsDesc')}
                        </li>
                        <li>
                            <strong>{t('home.featureSuggestions')}</strong> {t('home.featureSuggestionsDesc')}
                        </li>
                        <li>
                            <strong>{t('home.featureAccount')}</strong> {t('home.featureAccountDesc')}
                        </li>
                    </ul>
                    <p style={{ marginTop: 14 }}>
                        <strong>{t('home.howToUse')}</strong><br />
                        {t('home.howToUseDesc')}
                    </p>
                    <p style={{ marginTop: 14 }}>
                        <strong>{t('home.howToUseDots')}</strong><br />
                        {t('home.howToUseDotsDesc')}
                    </p>
                </div>
                <p>{t('home.viewDocumentsPrompt')}</p>
               
                <div className="actions">
                    <Link to="/documents" className="viewer-button">
                        {t('home.viewDocuments')}
                    </Link>
                </div>
                {user && (
                    <div className="user-info">
                        <p>{t('auth.loggedInAs')}: <strong>{user.email}</strong></p>
                        <p>{t('auth.role')}: <strong>{user.role}</strong></p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HomePage;

