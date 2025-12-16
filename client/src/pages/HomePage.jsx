'use strict';

import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './HomePage.css';

/**
 * HomePage component - Main landing page after login
 * @returns {JSX.Element} HomePage component
 */
function HomePage() {
    const { user } = useAuth();

    return (
        <div className="home-page">
            <div className="home-container">
                <h1>Bine ati venit la aplicatia mea dedicata 
                corectarii si completariiAnastasimatarului scris de T.V Stupcanu</h1>
                <h2>Cateva informatii despre acest proiect</h2>
                <p>Acest proiect a inceput la initiativa mea, Matei Margineanu si 
                    implementat cu ajutorul lui Ioan Capatana care este si principalul tehnoredactor 
                    in melodos al acestei lucrari. In aceasta aplicatie puteti vedea documentele tehnoredactate de noi si puteti face sugestii pentru 
                    corecturi aduse atat la text cat si la notatia muzicala psaltica. Va multumim pentru ca apreciati munca noastra si pentru 
                    rabdarea dumneavoastra spre a primi o versiune tiparita la finalul acestui proiect.</p>
                    <h2>Va multumim anticipat pentru contributiile dumneavoastra aduse la aceasta lucrare.</h2>
                    <p>Inainte de a incepe sa faceti sugestii, va rugam sa cititi urmatoarele informatii:</p>
                <div className="home-section">
                    <h3>Funcționalități principale</h3>
                    <ul style={{ textAlign: 'left', maxWidth: 700, margin: '20px auto' }}>
                        <li>
                            <strong>Vizualizare documente:</strong> Poți accesa și vizualiza fișierele PDF tehnoredactate ale Anastasimatarului organizate in fisiere dedicate fiecarui glas in parte.
                        </li>
                        <li>
                            <strong>Sugestii de corectare:</strong> Pentru fiecare pagină a documentelor poți selecta o linie și trimite sugestii sau observații despre text sau notația muzicală.
                        </li>
                        <li>
                            <strong>Cont personal:</strong> Sugestiile tale sunt asociate contului tau si sunt afisate in josul paginii ca note de subsol pentru fiecare pagina; datele tale de autentificare apar afișate pentru a confirma identitatea.
                        </li>
                    </ul>
                    <p style={{ marginTop: 14 }}>
                        <strong>Cum se folosește?</strong><br />
                        Accesează lista de documente folosind butonul de mai jos. Odată ajuns în vizualizatorul PDF, poți naviga între pagini,
                        identifica rapid randurile și adăuga comentarii sau sugestii despre corecturi direct în contextul fiecărui document.
                        Aceste comentarii si sugestii vor fi vizibile in josul paginii ca note de subsol pentru fiecare pagina.
                    </p>
                </div>
                <p>Pentru a vedea documentele, va rugam sa faceti click pe butonul de mai jos.</p>
               
                <div className="actions">
                    <Link to="/documents" className="viewer-button">
                        Vezi documentele
                    </Link>
                </div>
                {user && (
                    <div className="user-info">
                        <p>Logged in as: <strong>{user.email}</strong></p>
                        <p>Role: <strong>{user.role}</strong></p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HomePage;

