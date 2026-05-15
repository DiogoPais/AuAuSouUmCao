import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, Plus, Check, XCircle, Clock, Save, Trash2, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import './VeterinariaPage.css';

interface Animal {
  idAnimal: string;
  nome: string;
  raca?: string;
  reatividade: string;
  estado: 'Saudavel' | 'Quarentena';
  tutor?: {
    utilizador?: { nome: string };
    nif?: string;
  };
  reservas?: Array<{
    box: { numero: number };
  }>;
}

const VeterinariaPage: React.FC = () => {
  const vet = {
    nome: localStorage.getItem('user_nome') || 'Veterinária',
    nif: localStorage.getItem('user_nif') || '---',
    telemovel: localStorage.getItem('user_telemovel') || '---',
    perfil: localStorage.getItem('role') || 'Vet'
  };

  const [tab, setTab] = useState<'verificar' | 'quarentena' | 'prescricao'>('verificar');
  const [caesParaVerificar, setCaesParaVerificar] = useState<Animal[]>([]);
  const [caesQuarentena, setCaesQuarentena] = useState<Animal[]>([]);
  const [caesSelecionado, setCaesSelecionado] = useState<Animal | null>(null);
  
  const [notasCheck, setNotasCheck] = useState('');
  const [motivoQuarentena, setMotivoQuarentena] = useState('');
  
  const [showModoQuarentena, setShowModoQuarentena] = useState(false);
  const [showModoPrescrever, setShowModoPrescrever] = useState(false);
  const [loading, setLoading] = useState(true);

  // ESTADOS DA PRESCRIÇÃO E TRATAMENTOS
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [todosAnimais, setTodosAnimais] = useState<Animal[]>([]);
  const [tratamentosAtivos, setTratamentosAtivos] = useState<any[]>([]);
  const [agora, setAgora] = useState(new Date());

  // ESTADOS DA NOVA RECEITA
  const [animalSelecionadoParaReceita, setAnimalSelecionadoParaReceita] = useState('');
  const [linhasReceita, setLinhasReceita] = useState<any[]>([]);
  const [linhaAtual, setLinhaAtual] = useState({
    medicamentoId: '',
    dosagem: '',
    frequencia: '',
    totalDoses: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);
        const [resVerificar, resQuarentena, resStock, resReservas, resTratamentos] = await Promise.all([
          axios.get(`${API_URL}/api/veterinaria/caes-para-verificar`),
          axios.get(`${API_URL}/api/veterinaria/caes-quarentena`),
          axios.get(`${API_URL}/api/stock`),
          axios.get(`${API_URL}/api/reservas`), 
          axios.get(`${API_URL}/api/veterinaria/tratamentos-ativos`)
        ]);
        
        setCaesParaVerificar(resVerificar.data);
        setCaesQuarentena(resQuarentena.data);
        setTratamentosAtivos(resTratamentos.data);
        
        const caesInternados = resReservas.data
          .filter((r: any) => r.estado === 'CheckIn')
          .map((r: any) => r.animal);

        const caesUnicos = Array.from(new Map(caesInternados.map((c: any) => [c.idAnimal, c])).values()) as Animal[];
        
        setTodosAnimais(caesUnicos); 
        
        const apenasMedicamentos = resStock.data.filter((item: any) => item.tipo === 'Medicamento');
        setMedicamentos(apenasMedicamentos);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, []);

  const extrairHorasFrequencia = (freq: string): number => {
    const match = freq.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const carregarTratamentosAtivos = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/veterinaria/tratamentos-ativos`);
      setTratamentosAtivos(res.data);
    } catch (err) {
      console.error('Erro ao carregar tratamentos:', err);
    }
  };

  const handleFinalizarCheck = async () => {
    if (!caesSelecionado || !notasCheck.trim()) {
      alert('Por favor, preencha as notas do check.');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/veterinaria/check-diario/${caesSelecionado.idAnimal}`, { notas: notasCheck, nomeVet: vet.nome });
      alert('Check realizado com sucesso!');
      setCaesParaVerificar(caesParaVerificar.filter(c => c.idAnimal !== caesSelecionado.idAnimal));
      setCaesSelecionado(null);
      setNotasCheck('');
      setShowModoQuarentena(false);
      setShowModoPrescrever(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao finalizar check');
    }
  };

  const handleAtivarQuarentena = async () => {
    if (!caesSelecionado || !motivoQuarentena.trim()) {
      alert('Por favor, preencha o motivo da quarentena.');
      return;
    }
    try {
      await axios.patch(`${API_URL}/api/veterinaria/quarentena/${caesSelecionado.idAnimal}`, { ativar: true, motivo: motivoQuarentena });
      alert('Quarentena ativada! Animal será registado no diário.');
      setCaesParaVerificar(caesParaVerificar.filter(c => c.idAnimal !== caesSelecionado.idAnimal));
      setCaesQuarentena([...caesQuarentena, { ...caesSelecionado, estado: 'Quarentena' }]);
      setCaesSelecionado(null);
      setMotivoQuarentena('');
      setShowModoQuarentena(false);
      setNotasCheck('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao ativar quarentena');
    }
  };

  // ==========================================
  // NOVA FUNÇÃO: DAR ALTA DA QUARENTENA
  // ==========================================
  const terminarQuarentena = async (idAnimal: string) => {
    if (!window.confirm("Tem a certeza que deseja dar Alta Médica a este cão?")) return;
    try {
      await axios.patch(`${API_URL}/api/veterinaria/quarentena/${idAnimal}`, { ativar: false });
      alert('Alta médica dada com sucesso! O cão saiu da quarentena.');
      // Remove o cão da lista de quarentena do ecrã
      setCaesQuarentena(caesQuarentena.filter(c => c.idAnimal !== idAnimal));
    } catch (err) {
      alert('Erro ao dar alta médica.');
    }
  };

  // ==========================================
  // LÓGICA DA RECEITA AVANÇADA
  // ==========================================
  const handleAdicionarLinha = () => {
    if (!linhaAtual.medicamentoId || !linhaAtual.dosagem || !linhaAtual.frequencia || !linhaAtual.totalDoses) {
      alert('Preencha todos os campos do medicamento.');
      return;
    }
    setLinhasReceita([...linhasReceita, { ...linhaAtual }]);
    setLinhaAtual({ medicamentoId: '', dosagem: '', frequencia: '', totalDoses: '' });
  };

  const handleRemoverLinha = (index: number) => {
    const novaLista = [...linhasReceita];
    novaLista.splice(index, 1);
    setLinhasReceita(novaLista);
  };

  const handleSubmeterReceitaCompleta = async () => {
    if (!animalSelecionadoParaReceita) {
      alert('Tem de selecionar um cão primeiro.');
      return;
    }
    if (linhasReceita.length === 0) {
      alert('Adicione pelo menos um medicamento à receita.');
      return;
    }

    try {
      const payload = {
        animalId: animalSelecionadoParaReceita,
        linhas: linhasReceita.map(l => ({
          medicamentoId: l.medicamentoId, 
          dosagem: Number(l.dosagem),
          frequencia: l.frequencia,
          totalDoses: Number(l.totalDoses)
        }))
      };

      await axios.post(`${API_URL}/api/veterinaria/prescricao`, payload);
      alert('Receita gravada com sucesso! O stock foi descontado do total.');
      
      setAnimalSelecionadoParaReceita('');
      setLinhasReceita([]);
      
      const resStock = await axios.get(`${API_URL}/api/stock`);
      setMedicamentos(resStock.data.filter((item: any) => item.tipo === 'Medicamento'));
      await carregarTratamentosAtivos();
      
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao criar prescrição.');
    }
  };

  // ADMINISTRAÇÃO DE MEDICAMENTOS
  const handleDarDose = async (idLinha: string) => {
    try {
      const vetId = localStorage.getItem('user_id') || '';
      await axios.post(`${API_URL}/api/veterinaria/tratamentos/${idLinha}/administrar`, {
        funcionarioId: vetId
      });
      alert('Dose registada com sucesso!');
      await carregarTratamentosAtivos(); 
      setAgora(new Date()); 
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao registar dose.');
    }
  };

  const handleFinalizarTratamento = async (idLinha: string) => {
    if (!window.confirm("Confirmas que queres parar / concluir este tratamento? Ele desaparecerá da lista.")) return;
    try {
      await axios.patch(`${API_URL}/api/veterinaria/tratamentos/${idLinha}/finalizar`);
      alert('Tratamento concluído!');
      await carregarTratamentosAtivos(); 
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao finalizar tratamento.');
    }
  };

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="veterinaria-page-container" style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      <Header userData={vet} />

      <main className="vet-main">
        <div className="vet-tabs">
          <button className={`tab-btn ${tab === 'verificar' ? 'ativo' : ''}`} onClick={() => setTab('verificar')}>
            Verificar Cães ({caesParaVerificar.length})
          </button>
          <button className={`tab-btn quarentena-badge ${tab === 'quarentena' ? 'ativo' : ''}`} onClick={() => setTab('quarentena')}>
            🚨 Quarentena ({caesQuarentena.length})
          </button>
          <button className={`tab-btn ${tab === 'prescricao' ? 'ativo' : ''}`} onClick={() => setTab('prescricao')}>
            Prescrições e Tratamentos
          </button>
        </div>

        <div className="vet-content">
          
          {tab === 'verificar' && (
            <section className="vet-section">
              <h2>Tarefas Diárias</h2>
              <div className="caes-lista">
                {caesParaVerificar.length > 0 ? (
                  caesParaVerificar.map(cao => (
                    <div
                      key={cao.idAnimal}
                      className={`cao-card ${caesSelecionado?.idAnimal === cao.idAnimal ? 'selecionado' : ''}`}
                      onClick={() => {
                        setCaesSelecionado(cao);
                        setNotasCheck('');
                        setShowModoQuarentena(false);
                        setShowModoPrescrever(false);
                      }}
                    >
                      <div className="cao-header">
                        <h3>{cao.nome}</h3>
                        <span className="reatividade-badge">{cao.reatividade}</span>
                      </div>
                      <p className="cao-info">Raça: {cao.raca || 'N/A'}</p>
                      <p className="cao-info">Tutor: {cao.tutor?.utilizador?.nome || 'N/A'}</p>
                      {cao.reservas && cao.reservas[0] && (
                        <p className="cao-info">Jaula: {cao.reservas[0].box.numero}</p>
                      )}
                      <button className="btn-comeco">Começar Verificação</button>
                    </div>
                  ))
                ) : (
                  <p className="vazio">Todos os cães foram verificados hoje! ✓</p>
                )}
              </div>

              {caesSelecionado && !showModoQuarentena && !showModoPrescrever && (
                <section className="verificacao-panel">
                  <div className="cao-detalhes">
                    <h3>{caesSelecionado.nome}</h3>
                    <p>Raça: <strong>{caesSelecionado.raca || 'N/A'}</strong></p>
                    <p>Reatividade: <strong>{caesSelecionado.reatividade}</strong></p>
                    <p>Tutor: <strong>{caesSelecionado.tutor?.utilizador?.nome || 'N/A'}</strong></p>
                  </div>

                  <div className="formulario-check">
                    <label>Notas do Check (obrigatório):</label>
                    <textarea
                      value={notasCheck}
                      onChange={(e) => setNotasCheck(e.target.value)}
                      placeholder="Ex: Animal alerta, sem sinais de doença."
                      className="notas-input"
                    />
                  </div>

                  <div className="botoes-check">
                    <button className="btn-finalizar-check" onClick={handleFinalizarCheck}>
                      <CheckCircle size={18} /> Finalizar Check
                    </button>
                    <button
                      className="btn-quarentena"
                      onClick={() => setShowModoQuarentena(true)}
                    >
                      <AlertCircle size={18} /> Modo Quarentena
                    </button>
                    <button
                      className="btn-finalizar-check"
                      onClick={() => {
                        setAnimalSelecionadoParaReceita(caesSelecionado.idAnimal);
                        setTab('prescricao'); 
                      }}
                      style={{ background: '#7DDFD3' }}
                    >
                      <Plus size={18} /> Ir para Prescrição
                    </button>
                  </div>
                </section>
              )}

              {caesSelecionado && showModoQuarentena && (
                <section className="quarentena-panel">
                  <h3>🚨 Ativar Quarentena - {caesSelecionado.nome}</h3>
                  <label>Motivo da Quarentena:</label>
                  <textarea
                    value={motivoQuarentena}
                    onChange={(e) => setMotivoQuarentena(e.target.value)}
                    placeholder="Ex: Suspeita de doença contagiosa..."
                    className="notas-input"
                  />
                  <div className="botoes-quarentena">
                    <button className="btn-ativar-quarentena" onClick={handleAtivarQuarentena}>
                      Ativar Quarentena
                    </button>
                    <button
                      className="btn-cancelar"
                      onClick={() => {
                        setShowModoQuarentena(false);
                        setMotivoQuarentena('');
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </section>
              )}
            </section>
          )}

          {tab === 'quarentena' && (
            <section className="vet-section">
              <h2>🚨 Cães em Quarentena</h2>
              <div className="caes-lista">
                {caesQuarentena.length > 0 ? (
                  caesQuarentena.map(cao => (
                    <div key={cao.idAnimal} className="cao-card quarentena-card">
                      <div className="cao-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3>{cao.nome}</h3>
                          <span className="badge-quarentena" style={{ display: 'inline-block', marginBottom: '10px' }}>QUARENTENA</span>
                        </div>
                        {/* AQUI ESTÁ O NOVO BOTÃO DE ALTA MÉDICA */}
                        <button 
                          onClick={() => terminarQuarentena(cao.idAnimal)} 
                          style={{ background: '#28a745', color: 'white', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <CheckCircle size={16} /> Dar Alta
                        </button>
                      </div>
                      <p className="cao-info">Raça: {cao.raca || 'N/A'}</p>
                      <p className="cao-info">Tutor: {cao.tutor?.utilizador?.nome || 'N/A'}</p>
                    </div>
                  ))
                ) : (
                  <p className="vazio">Nenhum cão em quarentena neste momento. 🎉</p>
                )}
              </div>
            </section>
          )}

          {tab === 'prescricao' && (
            <section className="vet-section">
              <h2>Tratamentos e Prescrições</h2>
              
              <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
                
                <div style={{ flex: 1, minWidth: '400px', background: '#f8f8f8', padding: '20px', borderRadius: '8px', border: '1px solid #7DDFD3' }}>
                  <h3 style={{ marginTop: 0, color: '#333' }}>Criar Receita Médica</h3>
                  
                  <label>1. Selecionar Cão (Paciente):</label>
                  <select 
                    className="notas-input" 
                    value={animalSelecionadoParaReceita}
                    onChange={(e) => setAnimalSelecionadoParaReceita(e.target.value)}
                    style={{ marginBottom: '20px', padding: '10px' }}
                  >
                    <option value="">-- Escolha um Cão --</option>
                    {todosAnimais.map(cao => (
                      <option key={cao.idAnimal} value={cao.idAnimal}>{cao.nome}</option>
                    ))}
                  </select>

                  <div style={{ borderTop: '2px dashed #ccc', margin: '20px 0' }}></div>

                  <label>2. Adicionar Medicamento à Receita:</label>
                  <select 
                    className="notas-input"
                    value={linhaAtual.medicamentoId}
                    onChange={(e) => setLinhaAtual({...linhaAtual, medicamentoId: e.target.value})}
                    style={{ marginBottom: '10px', padding: '10px' }}
                  >
                    <option value="">-- Escolha um Medicamento --</option>
                    {medicamentos.map(med => (
                      <option key={med.idItem} value={med.nome}>
                        {med.nome} (Em stock: {med.quantidade})
                      </option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '13px' }}>Dosagem:</label>
                      <input type="number" min="0.1" step="0.1" className="notas-input" placeholder="Ex: 1"
                        value={linhaAtual.dosagem} onChange={(e) => setLinhaAtual({...linhaAtual, dosagem: e.target.value})} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '13px' }}>Doses Totais:</label>
                      <input type="number" min="1" step="1" className="notas-input" placeholder="Ex: 10"
                        value={linhaAtual.totalDoses} onChange={(e) => setLinhaAtual({...linhaAtual, totalDoses: e.target.value})} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '13px' }}>Frequência:</label>
                      <input type="text" className="notas-input" placeholder="Ex: 12/12h"
                        value={linhaAtual.frequencia} onChange={(e) => setLinhaAtual({...linhaAtual, frequencia: e.target.value})} />
                    </div>
                  </div>

                  <button type="button" onClick={handleAdicionarLinha} style={{ width: '100%', padding: '10px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Adicionar à Lista
                  </button>

                  {linhasReceita.length > 0 && (
                    <div style={{ marginTop: '20px', background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Medicamentos na Receita:</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {linhasReceita.map((linha, index) => (
                          <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed #eee', fontSize: '13px' }}>
                            <span><strong>{linha.medicamentoId}</strong> - {linha.dosagem} unid. ({linha.frequencia}) x {linha.totalDoses} doses</span>
                            <button onClick={() => handleRemoverLinha(index)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}><Trash2 size={16} /></button>
                          </li>
                        ))}
                      </ul>
                      <button onClick={handleSubmeterReceitaCompleta} style={{ width: '100%', padding: '12px', background: '#7DDFD3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        <Save size={18} /> Gravar Receita Completa
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ flex: 2, minWidth: '550px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '15px', borderBottom: '1px solid #ddd', background: '#f8f8f8', borderRadius: '8px 8px 0 0' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>Tratamentos Ativos (Cães a Medicar)</h3>
                  </div>
                  
                  <div style={{ overflowX: 'auto', maxHeight: '550px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#f0f0f0', zIndex: 1 }}>
                        <tr>
                          <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Animal</th>
                          <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Remédio</th>
                          <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Progresso</th>
                          <th style={{ padding: '12px', borderBottom: '2px solid #ddd' }}>Próxima Toma</th>
                          <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'center' }}>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tratamentosAtivos.length > 0 ? (
                          tratamentosAtivos.map((tratamento: any) => {
                            const ultimoLog = tratamento.logsAdministracao?.[0]; 
                            const totalDadas = tratamento.logsAdministracao?.length || 0;
                            const horasIntervalo = extrairHorasFrequencia(tratamento.frequencia);
                            
                            let isPronto = true;
                            let countdownStr = 'Pronto a Dar!';
                            let rowBg = 'transparent';

                            if (ultimoLog && horasIntervalo > 0) {
                              const proximaToma = new Date(ultimoLog.timestamp);
                              proximaToma.setHours(proximaToma.getHours() + horasIntervalo);

                              if (agora < proximaToma) {
                                isPronto = false;
                                rowBg = '#fdfdfd';
                                const diffMs = proximaToma.getTime() - agora.getTime();
                                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                countdownStr = `Faltam ${diffHrs}h ${diffMins}m`;
                              } else {
                                countdownStr = 'Na hora!';
                                rowBg = '#fffaf0';
                              }
                            }

                            return (
                              <tr key={tratamento.idLinha} style={{ borderBottom: '1px solid #eee', backgroundColor: rowBg }}>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{tratamento.prescricao?.animal?.nome || 'N/A'}</td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{ color: '#0066cc', fontWeight: '500' }}>{tratamento.medicamento?.stock?.nome}</span>
                                  <div style={{ fontSize: '12px', color: '#666' }}>Dose: {tratamento.dosagem} | Freq: {tratamento.frequencia}</div>
                                </td>
                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#444' }}>
                                  {totalDadas} / {tratamento.totalDoses}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{ background: isPronto ? '#e6f7ff' : '#f0f0f0', color: isPronto ? '#005580' : '#888', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                    <Clock size={14} /> {totalDadas === 0 ? "Primeira Toma!" : countdownStr}
                                  </span>
                                </td>
                                <td style={{ padding: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button 
                                    onClick={() => handleDarDose(tratamento.idLinha)}
                                    disabled={!isPronto}
                                    style={{ padding: '8px', background: isPronto ? '#28a745' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: isPronto ? 'pointer' : 'not-allowed' }}
                                  >
                                    <Check size={16} /> Dar Dose
                                  </button>

                                  {/* AQUI ESTÁ O BOTÃO DE PARAR TRATAMENTO MELHORADO */}
                                  <button 
                                    onClick={() => handleFinalizarTratamento(tratamento.idLinha)} 
                                    style={{ padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    title="Concluir / Parar Tratamento"
                                  >
                                    <XCircle size={16} /> Parar
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr><td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#888' }}>Nenhum tratamento ativo.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </section>
          )}

          {vet.perfil === 'Admin' && (
            <div style={{ marginTop: '30px', padding: '20px 0' }}>
              <button 
                onClick={() => window.history.back()}
                style={{ 
                  padding: '10px 20px', 
                  background: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontWeight: 'bold',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#5a6268'}
                onMouseOut={(e) => e.currentTarget.style.background = '#6c757d'}
              >
                <ArrowLeft size={18} /> Voltar ao Menu de Gestão
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default VeterinariaPage;