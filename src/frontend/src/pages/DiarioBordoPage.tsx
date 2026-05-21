import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckSquare, Camera } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './DiarioBordoPage.css';

interface Registo {
  idRegisto: string;
  descricao: string;
  timestamp: string;
  fotos?: string[]; // AQUI ESTÃO AS FOTOS!
}

interface Servico {
  idServico: string;
  tipo: 'Grooming' | 'Passeio' | 'Adestramento' | 'Alimentacao';
  data: string;
  preco: number;
}

const DiarioBordoPage: React.FC = () => {
  // 👇 Alteramos aqui para apanhar 'idAnimal' ou apenas 'id'
  const params = useParams();
  const animalIdFinal = params.idAnimal || params.id; 
  
  const navigate = useNavigate();
  const [diario, setDiario] = useState<Registo[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [animalInfo, setAnimalInfo] = useState({ nome: 'A carregar...', estadoClinico: '...' });
  const [loading, setLoading] = useState(true);

  const user = {
    nome: localStorage.getItem('user_nome') || "Utilizador",
    perfil: localStorage.getItem('role') || "Tutor"
  };

  useEffect(() => {
    const fetchDados = async () => {
      if (!animalIdFinal) return; // Se não houver ID, não faz o pedido

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
        // Agora se falhar, vais ver o erro vermelho na consola (F12)
        console.error("Erro ao carregar o diário. O backend devolveu:", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDados();
  }, [animalIdFinal]); // E usamos o ID final aqui também!

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

      {/* NOVO BOTÃO DE VOLTAR */}
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
          <img src="https://images.unsplash.com/photo-1516734212448-1dd58be2cb56?w=200&q=80" alt="Foto do Cão" />
        </div>
      </section>

      <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 'bold', margin: '20px 0', color: '#333' }}>
        O Diário de Hoje
      </h2>

      {/* ========================================== */}
      {/* ESTRUTURA SPLIT VIEW (DUAS COLUNAS)        */}
      {/* ========================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', padding: '0 5% 40px 5%' }}>

        {/* COLUNA ESQUERDA: NOTAS CLÍNICAS E AVISOS */}
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

        {/* COLUNA DIREITA: ATIVIDADES DO STAFF E FOTOS */}
        <section style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #e9ecef', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2c3e50', borderBottom: '2px solid #27AE60', paddingBottom: '10px' }}>
            <CheckSquare size={22} color="#27AE60" /> Atividades e Serviços
          </h3>
          
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* 1. Tarefas Adicionais (Banhos, Passeios...) */}
            {servicos.map(s => (
              <div key={s.idServico} style={{ borderLeft: '4px solid #27AE60', background: 'white', padding: '12px', borderRadius: '0 8px 8px 0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#333' }}>✅ {s.tipo}</p>
                <small style={{ color: '#888' }}>Realizado às {new Date(s.data).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</small>
              </div>
            ))}

            {/* 2. Logs com Fotos (Ex: Alimentação) */}
            {diario.filter(log => log.descricao.includes('✅')).map(log => (
              <div key={log.idRegisto} style={{ borderLeft: '4px solid #27AE60', background: 'white', padding: '12px', borderRadius: '0 8px 8px 0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <p style={{ margin: '0 0 8px 0', color: '#333', lineHeight: '1.5' }}>{log.descricao.replace('✅', '✅ ')}</p>
                
                {/* LÓGICA DAS FOTOS */}
                {log.fotos && log.fotos.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {log.fotos.map((fotoUrl, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img 
                          src={fotoUrl} 
                          alt="Foto da Atividade" 
                          style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} 
                        />
                        <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', padding: '4px', borderRadius: '50%' }}>
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

            {/* Mensagem Vazia se não houver tarefas */}
            {servicos.length === 0 && diario.filter(log => log.descricao.includes('✅')).length === 0 && (
              <p style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>Nenhuma atividade registada ainda.</p>
            )}
          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
};

export default DiarioBordoPage;