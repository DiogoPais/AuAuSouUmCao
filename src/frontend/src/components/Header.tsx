import React, { useState, useEffect } from 'react';
import { LogOut, LogIn } from 'lucide-react'; // Importamos o LogIn também
import { Link, useNavigate } from 'react-router-dom';
import './Shared.css';
import logoImg from '../../foto.webp';

interface HeaderProps {
  title?: string;
  userData?: { 
    nome: string; 
    nif?: string; 
    telemovel?: string; 
    perfil?: string; 
  };
}

const Header: React.FC<HeaderProps> = ({ title, userData }) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="site-header" style={{ height: '130px', padding: '0 0px' }}>
      <Link to="/" className="logo-container">
        <img 
          src={logoImg} 
          alt="Logo"
          style={{ width: '250px', height: '130px' }}
        />
      </Link>
      
      <div className="header-center">
        {userData ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Nome: {userData.nome}</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                Perfil: {userData.perfil || (userData.nif ? 'Tutor' : 'Utilizador')}
              </p>
            </div>

            <div style={{ width: '2px', height: '60px', backgroundColor: '#1A1A1A' }}></div>

            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Hora: {currentTime.toLocaleTimeString('pt-PT')}</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Data: {currentTime.toLocaleDateString('pt-PT')}</p>
            </div>
          </div>
        ) : (
          <h1 className="header-title">{title}</h1>
        )}
      </div>
      
      {/* ZONA CONDICIONAL: LOGIN vs LOGOUT */}
      <div className="header-auth-zone" style={{ width: '100px'}}>
        {userData ? (
          /* SE ESTIVER LOGADO -> MOSTRA LOGOUT */
          <div onClick={handleLogout} style={{ cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <LogOut size={40} color="#000" />
              
            </div>
            <p style={{ margin: '5px 0 0', fontSize: '14px', fontWeight: 'bold' }}>Log Out</p>
          </div>
        ) : (
          /* SE NÃO ESTIVER LOGADO -> MOSTRA LOGIN */
          <div onClick={() => navigate('/login')} style={{ cursor: 'pointer', textAlign: 'center' }}>
            <LogIn size={40} color="#000" />
            <p style={{ margin: '5px 0 0', fontSize: '14px', fontWeight: 'bold' }}>Login</p>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;