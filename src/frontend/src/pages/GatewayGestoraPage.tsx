import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Stethoscope } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './GatewayGestoraPage.css';

const GatewayGestoraPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Vamos buscar os dados da Diana ao LocalStorage
  const admin = {
    nome: localStorage.getItem('user_nome') || 'Gestora',
    nif: localStorage.getItem('user_nif') || '---',
    telemovel: localStorage.getItem('user_telemovel') || '---',
    perfil: localStorage.getItem('role') || 'Admin'
  };

  return (
    <div className="gateway-container">
      <Header userData={admin} />
      
      <main className="gateway-main">
        <h1 className="gateway-title">Bem-vinda, {admin.nome}!</h1>
        <p className="gateway-subtitle">Por favor, selecione o painel a que pretende aceder:</p>
        
        <div className="gateway-cards">
          {/* CARTÃO 1: GESTÃO DO HOTEL */}
          <div className="gateway-card" onClick={() => navigate('/gestao')}>
            <div className="gateway-icon-wrapper">
              <Building2 size={50} color="#7DDFD3" />
            </div>
            <h2>Gestão do Hotel</h2>
            <p>Aceda ao Dashboard, Calendário, gestão de Stock e Alertas do hotel.</p>
          </div>
          
          {/* CARTÃO 2: CLÍNICA VETERINÁRIA */}
          <div className="gateway-card" onClick={() => navigate('/vet')}>
            <div className="gateway-icon-wrapper">
              <Stethoscope size={50} color="#7DDFD3" />
            </div>
            <h2>Clínica Veterinária</h2>
            <p>Aceda às verificações diárias, prescrições e gestão de quarentena.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GatewayGestoraPage;