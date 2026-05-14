import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapPin, Camera, AlertTriangle, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './StaffPage.css';

interface Animal {
  idAnimal: string;
  nome: string;
  raca?: string;
  reatividade?: string; 
  tipoTrela?: string;   
}

interface Box {
  numero: number;
  tamanho: number;
  ocupacao: number;
}

interface Reserva {
  idReserva: string;
  animal?: Animal; 
  box?: Box;       
  dataEntrada: string;
  dataSaida: string;
}

interface Tarefa {
  idServico: string;
  tipo: string;
  data: string;
  preco: number;
  reserva?: Reserva; 
}

// ==========================================
// COMPONENTE DO MAPA INTERATIVO (ALAS A, B, C, D)
// ==========================================
const MapaHotel: React.FC<{ boxNumero?: number }> = ({ boxNumero }) => {
  if (!boxNumero) return <div className="mapa-placeholder"><MapPin size={48} /><p>Sem Box Atribuída</p></div>;

  // Lógica de Alas sugerida pelo Diogo: 4 alas de 10 boxes
  let ala = 'A';
  if (boxNumero > 10 && boxNumero <= 20) ala = 'B';
  if (boxNumero > 20 && boxNumero <= 30) ala = 'C';
  if (boxNumero > 30) ala = 'D';

  return (
    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
        <MapPin size={18} style={{ verticalAlign: 'middle' }} color="#dc3545" /> Localização Exata
      </h4>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '15px' }}>
        {['A', 'B', 'C', 'D'].map(letra => (
          <div key={letra} style={{ 
            padding: '10px 15px', 
            borderRadius: '6px', 
            fontWeight: 'bold',
            backgroundColor: ala === letra ? '#7DDFD3' : '#e9ecef',
            color: ala === letra ? '#004d40' : '#888',
            border: ala === letra ? '2px solid #004d40' : '2px solid transparent',
            transition: 'all 0.3s ease'
          }}>
            ALA {letra}
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '2px dashed #7DDFD3', display: 'inline-block' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Corredor {ala}</p>
        <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
          BOX {boxNumero}
        </p>
      </div>
    </div>
  );
};


const StaffPage: React.FC = () => {
  const staff = {
    nome: localStorage.getItem('user_nome') || 'Utilizador',
    nif: localStorage.getItem('user_nif') || '---',
    telemovel: localStorage.getItem('user_telemovel') || '---',
    perfil: localStorage.getItem('role') || 'Staff',
  };

  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null);
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Estados para a Foto
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        const resTarefas = await axios.get(`${API_URL}/api/tarefas`);
        setTarefas(resTarefas.data);

        const resStaff = await axios.get(`${API_URL}/api/funcionarios/count`);
        setStaffCount(resStaff.data.total);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, []);

  const concluirTarefa = async (id: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Se houver foto, preparamos como FormData (para um futuro upload de prova de serviço)
      const formData = new FormData();
      if (fotoFile) {
        formData.append('fotoProva', fotoFile);
      }
      formData.append('estado', 'Finalizado');

      // Chamada à BD para concluir
      await axios.patch(`${API_URL}/api/tarefas/${id}/concluir`, formData, {
        headers: fotoFile ? { 'Content-Type': 'multipart/form-data' } : {}
      });
      
      setTarefas(tarefas.filter((t) => t.idServico !== id));
      setTarefaSelecionada(null);
      setFotoPreview(null);
      setFotoFile(null);
      alert('Tarefa concluída com sucesso!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao concluir tarefa');
    }
  };

  // ==========================================
  // LÓGICA DA CÂMARA DO TELEMÓVEL
  // ==========================================
  const handleAbrirCamera = () => {
    fileInputRef.current?.click();
  };

  const handleFotoCapturada = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file)); // Gera uma miniatura para o Staff ver
    }
  };

  const getTipoLabel = (tipo: string) => {
    const tipoNormalizado = tipo.toLowerCase().trim();
    if (tipoNormalizado.includes('passeio')) return 'Passeio Diário';
    if (tipoNormalizado.includes('grooming') || tipoNormalizado.includes('tosquia')) return 'Sessão de Grooming / Tosquia';
    if (tipoNormalizado.includes('banho')) return 'Dar Banho';
    if (tipoNormalizado.includes('adestramento') || tipoNormalizado.includes('treino')) return 'Adestramento';
    if (tipoNormalizado.includes('alimentacao') || tipoNormalizado.includes('ração') || tipoNormalizado.includes('racao')) return 'Dar Alimentação';
    return tipo;
  };

  const tarefasSeguras = Array.isArray(tarefas) ? tarefas : [];
  
  const tarefasPorData = tarefasSeguras.reduce(
    (acc, tarefa) => {
      if (!tarefa || !tarefa.data) return acc; 

      const data = new Date(tarefa.data).toLocaleDateString('pt-PT', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      if (!acc[data]) { acc[data] = []; }
      acc[data].push(tarefa);
      return acc;
    },
    {} as Record<string, Tarefa[]>
  );

  if (loading) {
    return (
      <div className="staff-page-container">
        <Header userData={staff} />
        <div className="loading">Carregando tarefas...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="staff-page-container">
      <Header userData={staff} />

      <main className="staff-main">
        <div className="staff-info-bar">
          <p><strong>Staff:</strong> {staffCount} membros</p>
          <p><strong>Tarefas do dia:</strong> {tarefasSeguras.length}</p>
          <button 
            onClick={() => {
              alert("⚠️ ALERTA ENVIADO! A Gestora foi notificada de que uma ração terminou.");
            }}
            style={{ 
              backgroundColor: '#dc3545', color: 'white', border: 'none', 
              padding: '8px 12px', borderRadius: '4px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold'
            }}
          >
            ⚠️ Reportar Falta de Ração
          </button>
        </div>

        <div className="staff-content">
          <section className="tarefas-section">
            <h2>Tarefas Atribuídas:</h2>

            <div className="tarefas-lista">
              {tarefasSeguras.length > 0 ? (
                Object.entries(tarefasPorData).map(([data, tarefasDodia]) => (
                  <div key={data}>
                    <h4 className="tarefa-data" style={{ background: '#eee', padding: '5px 10px', borderRadius: '4px', marginTop: '15px' }}>{data}</h4>
                    {tarefasDodia.map((tarefa) => (
                      <div
                        key={tarefa.idServico}
                        className={`tarefa-card ${tarefaSelecionada?.idServico === tarefa.idServico ? 'ativo' : ''}`}
                        onClick={() => {
                          setTarefaSelecionada(tarefa);
                          setFotoPreview(null); // Limpa a foto se trocar de tarefa
                          setFotoFile(null);
                        }}
                      >
                        <div className="tarefa-header">
                          <h3>{getTipoLabel(tarefa.tipo)}</h3>
                        </div>
                        <p className="tarefa-info">
                          Cão: <strong>{tarefa.reserva?.animal?.nome || 'N/A'}</strong> (jaula {tarefa.reserva?.box?.numero || 'N/A'})
                        </p>
                        <p className="tarefa-horario">
                          Hora: {new Date(tarefa.data).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p className="no-tarefas">O dia de hoje está livre de tarefas! 🎉</p>
              )}
            </div>
          </section>

          {tarefaSelecionada && (
            <section className="detalhes-section">
              <h3>{getTipoLabel(tarefaSelecionada.tipo)}</h3>
              
              {/* O NOVO MAPA COM ALAS FICA LOGO AQUI NO TOPO */}
              <div style={{ marginBottom: '20px' }}>
                <MapaHotel boxNumero={tarefaSelecionada.reserva?.box?.numero} />
              </div>

              <div className="detalhes-card">
                <p className="detalhes-info">
                  Cão: <strong>{tarefaSelecionada.reserva?.animal?.nome || 'N/A'}</strong>
                </p>
                <p className="detalhes-horario">
                  Horário Agendado: {new Date(tarefaSelecionada.data).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
                <p className="detalhes-race">
                  Raça: <strong>{tarefaSelecionada.reserva?.animal?.raca || 'N/A'}</strong>
                </p>

                <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffe69c' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#856404', marginBottom: '8px' }}>
                    <AlertTriangle size={18} />
                    <strong style={{ fontSize: '14px' }}>Informações de Segurança:</strong>
                  </div>
                  <p style={{ margin: '0 0 5px 0', color: '#856404', fontSize: '14px' }}>
                    <strong>Sensibilidade:</strong> {tarefaSelecionada.reserva?.animal?.reatividade || 'Normal'}
                  </p>
                  <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
                    <strong>Trela Recomendada:</strong> {tarefaSelecionada.reserva?.animal?.tipoTrela || 'Normal'}
                  </p>
                </div>

                {/* BOTÃO E PREVIEW DA FOTO */}
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" // Força o telemóvel a abrir a câmara traseira!
                    ref={fileInputRef} 
                    onChange={handleFotoCapturada} 
                    style={{ display: 'none' }} 
                  />
                  
                  {!fotoPreview ? (
                    <button className="btn-foto-grande" onClick={handleAbrirCamera} style={{ display: 'flex', justifyContent: 'center', gap: '8px', width: '100%', alignItems: 'center' }}>
                      <Camera size={20} /> Capturar Foto do Serviço
                    </button>
                  ) : (
                    <div style={{ border: '2px dashed #ccc', padding: '10px', borderRadius: '8px' }}>
                      <img src={fotoPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }} />
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                        <span style={{ color: '#28a745', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <CheckCircle size={16} /> Foto Anexada
                        </span>
                        <button onClick={handleAbrirCamera} style={{ background: 'transparent', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}>
                          Tirar Novamente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                className="btn-feito-grande"
                onClick={() => concluirTarefa(tarefaSelecionada.idServico)}
                style={{ marginTop: '20px' }}
              >
                ✓ Tarefa Concluída
              </button>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StaffPage;