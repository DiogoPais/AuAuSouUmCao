import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapPin, Camera, AlertTriangle, CheckCircle, Droplets } from 'lucide-react';
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
  estado?: string;
  tipo?: string;
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

const SliderConfirmar: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const THRESHOLD = 0.75; // 75% do track para confirmar

  const handleStart = (_clientX: number) => {
    setDragging(true);
    setOffset(0);
  };

  const handleMove = (clientX: number) => {
    if (!dragging || !trackRef.current) return;
    const trackWidth = trackRef.current.offsetWidth;
    const thumbWidth = 60;
    const maxOffset = trackWidth - thumbWidth;
    const rect = trackRef.current.getBoundingClientRect();
    const newOffset = Math.max(0, Math.min(clientX - rect.left - thumbWidth / 2, maxOffset));
    setOffset(newOffset);

    if (newOffset / maxOffset >= THRESHOLD) {
      setDragging(false);
      setOffset(maxOffset);
      setTimeout(onConfirm, 300);
    }
  };

  const handleEnd = () => {
    if (dragging) {
      setDragging(false);
      setOffset(0); // volta atrás se não chegou ao fim
    }
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
        Desliza para confirmar conclusão →
      </p>
      <div
        ref={trackRef}
        style={{
          position: 'relative', height: '56px',
          background: '#e0f5f0', borderRadius: '28px',
          overflow: 'hidden', userSelect: 'none'
        }}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
      >
        {/* Barra de progresso */}
        <div style={{
          position: 'absolute', left: 0, top: 0,
          width: offset + 60, height: '100%',
          background: 'rgba(16, 185, 129, 0.2)',
          transition: dragging ? 'none' : 'width 0.3s ease'
        }} />

        {/* Thumb arrastável */}
        <div
          style={{
            position: 'absolute', left: offset,
            top: '4px', width: '48px', height: '48px',
            background: '#10b981', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'grab', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: dragging ? 'none' : 'left 0.3s ease',
            color: 'white', fontSize: '20px'
          }}
          onMouseDown={(e) => handleStart(e.clientX)}
          onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        >
          ✓
        </div>

        {/* Texto central */}
        <div style={{
          position: 'absolute', width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', color: '#004d40',
          fontWeight: '600', fontSize: '14px', paddingLeft: '60px'
        }}>
          Desliza para concluir
        </div>
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

  // 👇 NOVO ESTADO: Controlador das abas
  const [activeTab, setActiveTab] = useState<'ANIMAIS' | 'LIMPEZAS'>('ANIMAIS');
  
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  // 👇 NOVO ESTADO: Guarda as boxes sujas
  const [boxesSujas, setBoxesSujas] = useState<Box[]>([]);
  
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
        
        // 👇 Agora fazemos 3 pedidos: Tarefas, Staff e Boxes Sujas
        const [resTarefas, resStaff, resBoxes] = await Promise.all([
          axios.get(`${API_URL}/api/tarefas`),
          axios.get(`${API_URL}/api/funcionarios/count`),
          axios.get(`${API_URL}/api/tarefas/limpezas`) // Rota que criaste no backend
        ]);

        setTarefas(resTarefas.data);
        setStaffCount(resStaff.data.total);
        setBoxesSujas(resBoxes.data);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, [activeTab]); // Recarrega sempre que trocarmos de aba

  const concluirTarefa = async (id: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const formData = new FormData();
      if (fotoFile) {
        formData.append('fotoProva', fotoFile);
      }
      formData.append('estado', 'Finalizado');
      formData.append('nomeStaff', staff.nome);

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

  // 👇 NOVA FUNÇÃO: Limpar a box
  const limparBox = async (numero: number) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.patch(`${API_URL}/api/tarefas/limpezas/${numero}`);
      setBoxesSujas(boxesSujas.filter(b => b.numero !== numero));
      alert(`Box ${numero} higienizada e pronta para receber o próximo cão! ✨`);
    } catch (err: any) {
      alert('Erro ao atualizar a Box.');
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
      setFotoPreview(URL.createObjectURL(file)); 
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
        <div className="loading">A atualizar tarefas operacionais...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="staff-page-container">
      <Header userData={staff} />

      <main className="staff-main">
        <div className="staff-info-bar">
          <p><strong>Staff em turno:</strong> {staffCount} membros</p>
          <p><strong>Operações pendentes:</strong> {tarefasSeguras.length + boxesSujas.length}</p>
        </div>

        {/* 👇 TABS DE NAVEGAÇÃO DA EQUIPA */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '0 5%' }}>
          <button 
            onClick={() => setActiveTab('ANIMAIS')} 
            style={{ flex: 1, padding: '12px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: activeTab === 'ANIMAIS' ? '#004d40' : '#ddd', color: activeTab === 'ANIMAIS' ? 'white' : '#666', transition: '0.3s' }}
          >
            🐾 Cuidados Caninos
          </button>
          <button 
            onClick={() => setActiveTab('LIMPEZAS')} 
            style={{ flex: 1, padding: '12px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: activeTab === 'LIMPEZAS' ? '#004d40' : '#ddd', color: activeTab === 'LIMPEZAS' ? 'white' : '#666', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.3s' }}
          >
            <Droplets size={18} /> Manutenção
            {boxesSujas.length > 0 && <span style={{ background: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '12px' }}>{boxesSujas.length}</span>}
          </button>
        </div>

        <div className="staff-content">
          
          {/* ============================================== */}
          {/* ABA 1: CUIDADOS DOS ANIMAIS                    */}
          {/* ============================================== */}
          {activeTab === 'ANIMAIS' && (
            <>
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
                              setFotoPreview(null); 
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

                {/* 2. MAPA */}
                <MapaHotel boxNumero={tarefaSelecionada.reserva?.box?.numero} />

                {/* 1. ALERTA DE SEGURANÇA — PRIMEIRO, SEMPRE */}
                {tarefaSelecionada.reserva?.animal?.reatividade !== 'Não Reativo' && (
                  <div style={{
                    background: '#dc3545', color: 'white',
                    padding: '12px 16px', borderRadius: '8px',
                    marginBottom: '14px', marginTop: '20px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '15px', fontWeight: 'bold'
                  }}>
                    <AlertTriangle size={22} />
                    ATENÇÃO: Cão Reativo — Trela {tarefaSelecionada.reserva?.animal?.tipoTrela || 'Halti'}
                  </div>
                )}

                {/* 3. INFO BÁSICA */}
                <div className="detalhes-card" style={{ marginTop: '16px' }}>
                  <p className="detalhes-info">
                    Cão: <strong>{tarefaSelecionada.reserva?.animal?.nome || 'N/A'}</strong>
                  </p>
                  <p className="detalhes-horario">
                    {new Date(tarefaSelecionada.data).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                  <p className="detalhes-race">
                    Raça: <strong>{tarefaSelecionada.reserva?.animal?.raca || 'N/A'}</strong>
                  </p>
                </div>

                {/* 4. ZONA DE FOTO + CONFIRMAÇÃO — ÁREA DEDICADA */}
                <div style={{
                  marginTop: '20px',
                  border: '2px dashed #7DDFD3',
                  borderRadius: '12px',
                  padding: '20px',
                  background: '#f8fffd',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: '#004d40', fontSize: '14px' }}>
                    📸 Prova do Serviço (opcional)
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handleFotoCapturada}
                    style={{ display: 'none' }}
                  />

                  {!fotoPreview ? (
                    <button
                      onClick={handleAbrirCamera}
                      style={{
                        width: '100%', padding: '14px',
                        background: '#004d40', color: 'white',
                        border: 'none', borderRadius: '8px',
                        fontSize: '15px', fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '8px'
                      }}
                    >
                      <Camera size={20} /> Abrir Câmara
                    </button>
                  ) : (
                    <div>
                      <img
                        src={fotoPreview}
                        alt="Preview"
                        style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <button
                        onClick={handleAbrirCamera}
                        style={{
                          marginTop: '8px', background: 'transparent',
                          border: 'none', color: '#007bff',
                          textDecoration: 'underline', cursor: 'pointer', fontSize: '13px'
                        }}
                      >
                        Tirar novamente
                      </button>
                    </div>
                  )}

                  {/* SLIDER DE CONFIRMAÇÃO */}
                  <SliderConfirmar onConfirm={() => concluirTarefa(tarefaSelecionada.idServico)} />
                </div>

              </section>
            )}
            </>
          )}

          {/* ============================================== */}
          {/* ABA 2: LIMPEZA DE BOXES                        */}
          {/* ============================================== */}
          {activeTab === 'LIMPEZAS' && (
            <section style={{ width: '100%', background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
              <h2 style={{ borderBottom: '2px solid #7DDFD3', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Droplets color="#004d40" /> Limpezas e Higienização Pendentes
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {boxesSujas.length > 0 ? boxesSujas.map(box => (
                  <div key={box.numero} style={{ border: '1px solid #ffc107', background: '#fff3cd', borderRadius: '8px', padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, color: '#856404' }}>BOX {box.numero}</h3>
                      <span style={{ background: '#dc3545', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Suja</span>
                    </div>
                    <p style={{ margin: '10px 0', fontSize: '14px', color: '#666' }}>Tipo: {box.tipo || 'Standard'}</p>
                    <button 
                      onClick={() => limparBox(box.numero)}
                      style={{ width: '100%', background: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                      <CheckCircle size={18} /> Marcar como Limpa
                    </button>
                  </div>
                )) : (
                  <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#888', padding: '30px' }}>O Hotel está a brilhar! Não há boxes a necessitar de limpeza no momento. ✨</p>
                )}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
};

export default StaffPage;