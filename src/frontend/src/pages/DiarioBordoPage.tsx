import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckSquare, Camera, X } from 'lucide-react'; // 👈 Adicionado o 'X' aqui
import Header from '../components/Header';
import Footer from '../components/Footer';
import './DiarioBordoPage.css';

interface Registo {
  idRegisto: string;
  descricao: string;
  timestamp: string;
  fotos?: string[];
}

interface Servico {
  idServico: string;
  tipo: 'Grooming' | 'Passeio' | 'Adestramento' | 'Alimentacao';
  data: string;
  preco: number;
}

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1537151608804-ea2f1d71fa25?w=200&q=80';

// ==========================================
// COMPONENTE INTELIGENTE PARA LER FOTOS DA AWS S3
// ==========================================
// 👇 Adicionámos a propriedade onClick para ele saber quando é clicado
const FotoS3: React.FC<{ chaveFoto: string; isProfile?: boolean; onClick?: (url: string) => void }> = ({ chaveFoto, isProfile = false, onClick }) => {
  // Se já for URL completo, usa diretamente. Se for chave relativa, constrói o URL.
  const url = chaveFoto.startsWith('http')
    ? chaveFoto
    : `https://hotel-animais-assets-auau-2026.s3.eu-west-3.amazonaws.com/${chaveFoto}`;

  return (
    <img
      src={url}
      alt="Registo fotográfico"
      style={isProfile
        ? { width: '100%', height: '100%', objectFit: 'cover' }
        // 👇 Adicionámos o 'cursor: pointer' se ele receber a função onClick
        : { width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd', cursor: onClick ? 'pointer' : 'default' }
      }
      onClick={() => onClick && onClick(url)} // 👇 Dispara a função quando clicado
      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
    />
  );
};

const DiarioBordoPage: React.FC = () => {
  const params = useParams();
  const animalIdFinal = params.idAnimal || params.id; 
  
  const navigate = useNavigate();
  const [diario, setDiario] = useState<Registo[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [animalInfo, setAnimalInfo] = useState({ nome: 'A carregar...', estadoClinico: '...' });
  const [loading, setLoading] = useState(true);

  // 👇 NOVO ESTADO: Guarda a foto que está ampliada no momento
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  const user = {
    nome: localStorage.getItem('user_nome') || "Utilizador",
    perfil: localStorage.getItem('role') || "Tutor"
  };

  useEffect(() => {
    const fetchDados = async () => {
      if (!animalIdFinal) return;

      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        const [resDiario, resServicos] = await Promise.all([
            axios.get(`${API_URL}/api/animais/${animalIdFinal}/historial`),
            axios.get(`${API_URL}/api/animais/${animalIdFinal}/servicos-finalizados`)
        ]);
        
        setDiario(resDiario.data.diarioBordo || []);
        setAnimalInfo({ 
          nome: resDiario.data.nome || 'Desconhecido', 
          estadoClinico: resDiario.data.estadoClinico || resDiario.data.estado || '---' 
        });
        setServicos(resServicos.data || []);
      } catch (e) {
        console.error("Erro ao carregar o diário. O backend devolveu:", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDados();
  }, [animalIdFinal]);

  // Procura a primeira chave de foto válida para usar no perfil redondo
  const logComFoto = diario.find(log => log.fotos && log.fotos.filter(f => f.trim() !== '').length > 0);
  const chavePerfil = (logComFoto && logComFoto.fotos) ? logComFoto.fotos.find(f => f.trim() !== '') || '' : '';

  if (loading) {
    return (
      <div className="diario-page-container">
        <Header userData={user} />
        <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '20px' }}>A carregar o diário do seu patudo...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="diario-page-container">
      <Header userData={user} />

      <div style={{ padding: '20px 5%' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: '#666' }}
        >
          <ArrowLeft size={20} /> Voltar
        </button>
      </div>

      <section className="animal-info-card" style={{ margin: '0 5% 20px 5%' }}>
        <div className="info-text-block">
          <h2>Detalhes do Animal:</h2>
          <p>Nome: {animalInfo.nome}</p>
          <p>Estado: {animalInfo.estadoClinico}</p>
          <p>Serviços finalizados hoje: {servicos.length}</p>
        </div>
        <div className="info-text-block">
          <p>Alimentação: Responsivo</p>
          <p>Comportamento: Positivo</p>
        </div>
        <div className="animal-photo-circle">
          <FotoS3 chaveFoto={chavePerfil} isProfile={true} />
        </div>
      </section>

      <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 'bold', margin: '20px 0', color: '#333' }}>
        O Diário de Hoje
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', padding: '0 5% 40px 5%' }}>

        <section style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #e9ecef', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2c3e50', borderBottom: '2px solid #7DDFD3', paddingBottom: '10px' }}>
            <FileText size={22} color="#7DDFD3" /> Notas e Observações Médicas
          </h3>
          
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {diario.filter(log => log.descricao.includes('[CHECK') || log.descricao.includes('🚨')).length > 0 ? (
              diario.filter(log => log.descricao.includes('[CHECK') || log.descricao.includes('🚨')).map(log => (
                <div key={log.idRegisto} style={{ borderLeft: '4px solid #7DDFD3', paddingLeft: '15px', background: 'white', padding: '12px', borderRadius: '0 8px 8px 0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <p style={{ margin: '0 0 8px 0', color: '#333', lineHeight: '1.5' }}>{log.descricao}</p>
                  <small style={{ color: '#888', fontWeight: '500' }}>{new Date(log.timestamp).toLocaleString('pt-PT')}</small>
                </div>
              ))
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>Sem notas clínicas registadas hoje.</p>
            )}
          </div>
        </section>

        <section style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #e9ecef', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2c3e50', borderBottom: '2px solid #27AE60', paddingBottom: '10px' }}>
            <CheckSquare size={22} color="#27AE60" /> Atividades e Serviços
          </h3>
          
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>

            {diario.filter(log => log.descricao.includes('✅')).map(log => (
              <div key={log.idRegisto} style={{ borderLeft: '4px solid #27AE60', background: 'white', padding: '12px', borderRadius: '0 8px 8px 0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <p style={{ margin: '0 0 8px 0', color: '#333', lineHeight: '1.5' }}>{log.descricao.replace('✅', '✅ ')}</p>
                
                {log.fotos && log.fotos.filter(f => f.trim() !== '').length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {log.fotos.filter(f => f.trim() !== '').map((chaveUrl, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        
                        {/* 👇 A FOTO DA ATIVIDADE AGORA PASSA O URL PARA AMPLIAR 👇 */}
                        <FotoS3 
                          chaveFoto={chaveUrl} 
                          onClick={(url) => setFotoAmpliada(url)} 
                        />

                        <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', padding: '4px', borderRadius: '50%', pointerEvents: 'none' }}>
                          <Camera size={14} color="white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <small style={{ color: '#888', display: 'block', marginTop: '8px', fontWeight: '500' }}>
                  {new Date(log.timestamp).toLocaleString('pt-PT')}
                </small>
              </div>
            ))}

            {servicos.length === 0 && diario.filter(log => log.descricao.includes('✅')).length === 0 && (
              <p style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>Nenhuma atividade registada ainda.</p>
            )}
          </div>
        </section>

      </div>

      <Footer />

      {/* ========================================== */}
      {/* O ECRÃ PRETO COM A FOTO GIGANTE (LIGHTBOX) */}
      {/* ========================================== */}
      {fotoAmpliada && (
        <div 
          onClick={() => setFotoAmpliada(null)} // Clicar no ecrã preto também fecha a foto
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out'
          }}
        >
          {/* Botão de Fechar no canto superior direito */}
          <button 
            onClick={() => setFotoAmpliada(null)}
            style={{ 
              position: 'absolute', top: '20px', right: '30px', 
              background: 'none', border: 'none', color: 'white', 
              cursor: 'pointer', padding: '10px'
            }}
          >
            <X size={32} />
          </button>
          
          {/* A foto em ponto grande no centro do ecrã */}
          <img 
            src={fotoAmpliada} 
            alt="Foto Ampliada" 
            style={{ 
              maxWidth: '90%', maxHeight: '90%', 
              objectFit: 'contain', borderRadius: '8px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              cursor: 'default' 
            }} 
            onClick={(e) => e.stopPropagation()} // Impede que ao clicar NA foto o ecrã feche acidentalmente
          />
        </div>
      )}

    </div>
  );
};

export default DiarioBordoPage;