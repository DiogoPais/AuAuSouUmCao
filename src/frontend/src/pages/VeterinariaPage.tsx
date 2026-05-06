import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, Plus } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
  const [showModoQuarentena, setShowModoQuarentena] = useState(false);
  const [motivoQuarentena, setMotivoQuarentena] = useState('');
  const [loading, setLoading] = useState(true);

  // NOVOS ESTADOS PARA A PRESCRIÇÃO
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [todosAnimais, setTodosAnimais] = useState<Animal[]>([]);
  const [formPrescricao, setFormPrescricao] = useState({
    animalId: '',
    medicamentoId: '',
    dosagem: '',
    frequencia: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Carregar dados
  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);
        const [resVerificar, resQuarentena, resStock, resAnimais] = await Promise.all([
          axios.get(`${API_URL}/api/veterinaria/caes-para-verificar`),
          axios.get(`${API_URL}/api/veterinaria/caes-quarentena`),
          axios.get(`${API_URL}/api/stock`),
          axios.get(`${API_URL}/api/animais`)
        ]);
        
        setCaesParaVerificar(resVerificar.data);
        setCaesQuarentena(resQuarentena.data);
        setTodosAnimais(resAnimais.data);
        
        // Filtramos o stock para mostrar apenas o que é Medicamento na dropdown
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

  const handleFinalizarCheck = async () => {
    if (!caesSelecionado || !notasCheck.trim()) {
      alert('Por favor, preencha as notas do check.');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/veterinaria/check-diario/${caesSelecionado.idAnimal}`, {
        notas: notasCheck
      });

      alert('Check realizado com sucesso!');
      setCaesParaVerificar(caesParaVerificar.filter(c => c.idAnimal !== caesSelecionado.idAnimal));
      setCaesSelecionado(null);
      setNotasCheck('');
      setShowModoQuarentena(false);
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
      await axios.patch(`${API_URL}/api/veterinaria/quarentena/${caesSelecionado.idAnimal}`, {
        ativar: true,
        motivo: motivoQuarentena
      });

      alert('Quarentena ativada! Animal será registado no diário.');
      // Atualizar listas
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

  const handleCriarPrescricao = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formPrescricao.animalId || !formPrescricao.medicamentoId || !formPrescricao.dosagem || !formPrescricao.frequencia) {
      alert('Por favor, preencha todos os campos da prescrição.');
      return;
    }

    try {
      // O backend precisa do ID do funcionário (Vet). Vamos buscar ao localStorage
      const vetId = localStorage.getItem('user_id') || 'funcionario-desconhecido';

      const payload = {
        animalId: formPrescricao.animalId,
        funcionarioId: vetId,
        linhas: [
          {
            medicamentoId: formPrescricao.medicamentoId,
            dosagem: Number(formPrescricao.dosagem),
            frequencia: formPrescricao.frequencia
          }
        ]
      };

      await axios.post(`${API_URL}/api/veterinaria/prescricao`, payload);
      
      alert('Prescrição criada com sucesso! O stock do medicamento foi descontado.');
      
      // Limpa o formulário e atualiza o stock chamando a API novamente
      setFormPrescricao({ animalId: '', medicamentoId: '', dosagem: '', frequencia: '' });
      
      const resStock = await axios.get(`${API_URL}/api/stock`);
      const apenasMedicamentos = resStock.data.filter((item: any) => item.tipo === 'Medicamento');
      setMedicamentos(apenasMedicamentos);
      
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao criar prescrição. Verifique se há stock suficiente.');
    }
  };

  if (loading) {
    return (
      <div className="veterinaria-page-container">
        <Header userData={vet} />
        <div className="loading">Carregando...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="veterinaria-page-container">
      <Header userData={vet} />

      <main className="vet-main">
        {/* TABS */}
        <div className="vet-tabs">
          <button
            className={`tab-btn ${tab === 'verificar' ? 'ativo' : ''}`}
            onClick={() => setTab('verificar')}
          >
            Verificar Cães ({caesParaVerificar.length})
          </button>
          <button
            className={`tab-btn quarentena-badge ${tab === 'quarentena' ? 'ativo' : ''}`}
            onClick={() => setTab('quarentena')}
          >
            🚨 Quarentena ({caesQuarentena.length})
          </button>
          <button
            className={`tab-btn ${tab === 'prescricao' ? 'ativo' : ''}`}
            onClick={() => setTab('prescricao')}
          >
            Prescrições
          </button>
        </div>

        {/* CONTEÚDO POR TAB */}
        <div className="vet-content">
          {/* TAB 1: VERIFICAR CÃES */}
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

              {/* PAINEL DE VERIFICAÇÃO */}
              {caesSelecionado && !showModoQuarentena && (
                <section className="verificacao-panel">
                  <div className="cao-detalhes">
                    <h3>{caesSelecionado.nome}</h3>
                    <p>Raça: <strong>{caesSelecionado.raca || 'N/A'}</strong></p>
                    <p>Reatividade: <strong>{caesSelecionado.reatividade}</strong></p>
                    <p>Tutor: <strong>{caesSelecionado.tutor?.utilizador?.nome || 'N/A'}</strong></p>
                    <p>Contacto: <strong>{caesSelecionado.tutor?.nif || 'N/A'}</strong></p>
                  </div>

                  <div className="formulario-check">
                    <label>Notas do Check (obrigatório):</label>
                    <textarea
                      value={notasCheck}
                      onChange={(e) => setNotasCheck(e.target.value)}
                      placeholder="Ex: Animal alerta, sem sinais de doença. Respiração normal. Pele saudável."
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
                  </div>
                </section>
              )}

              {/* MODO QUARENTENA */}
              {caesSelecionado && showModoQuarentena && (
                <section className="quarentena-panel">
                  <h3>🚨 Ativar Quarentena - {caesSelecionado.nome}</h3>
                  <label>Motivo da Quarentena:</label>
                  <textarea
                    value={motivoQuarentena}
                    onChange={(e) => setMotivoQuarentena(e.target.value)}
                    placeholder="Ex: Suspeita de doença contagiosa. Observar por 7 dias."
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

          {/* TAB 2: QUARENTENA */}
          {tab === 'quarentena' && (
            <section className="vet-section">
              <h2>🚨 Cães em Quarentena</h2>
              <div className="caes-lista">
                {caesQuarentena.length > 0 ? (
                  caesQuarentena.map(cao => (
                    <div key={cao.idAnimal} className="cao-card quarentena-card">
                      <div className="cao-header">
                        <h3>{cao.nome}</h3>
                        <span className="badge-quarentena">QUARENTENA</span>
                      </div>
                      <p className="cao-info">Raça: {cao.raca || 'N/A'}</p>
                      <p className="cao-info">Tutor: {cao.tutor?.utilizador?.nome || 'N/A'}</p>
                      <p className="cao-info">Estado: {cao.estado}</p>
                      <button className="btn-detalhes">Ver Detalhes</button>
                    </div>
                  ))
                ) : (
                  <p className="vazio">Nenhum cão em quarentena</p>
                )}
              </div>
            </section>
          )}

          {/* TAB 3: PRESCRIÇÕES */}
          {tab === 'prescricao' && (
            <section className="vet-section">
              <h2>Nova Prescrição Médica</h2>
              
              <form onSubmit={handleCriarPrescricao} className="formulario-check" style={{ marginTop: '20px', maxWidth: '600px' }}>
                
                <label>Selecionar Cão:</label>
                <select 
                  className="notas-input" 
                  value={formPrescricao.animalId}
                  onChange={(e) => setFormPrescricao({...formPrescricao, animalId: e.target.value})}
                  style={{ marginBottom: '15px', padding: '10px' }}
                >
                  <option value="">-- Escolha um Cão --</option>
                  {todosAnimais.map(cao => (
                    <option key={cao.idAnimal} value={cao.idAnimal}>{cao.nome}</option>
                  ))}
                </select>

                <label>Medicamento (Stock Atual):</label>
                <select 
                  className="notas-input"
                  value={formPrescricao.medicamentoId}
                  onChange={(e) => setFormPrescricao({...formPrescricao, medicamentoId: e.target.value})}
                  style={{ marginBottom: '15px', padding: '10px' }}
                >
                  <option value="">-- Escolha um Medicamento --</option>
                  {medicamentos.map(med => (
                    <option key={med.idItem} value={med.medicamento?.idMedicamento}>
                      {med.nome} (Disponível: {med.quantidade})
                    </option>
                  ))}
                </select>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Dosagem (Quantidade a descontar):</label>
                    <input 
                      type="number" 
                      min="0.1"
                      step="0.1"
                      className="notas-input"
                      placeholder="Ex: 1"
                      value={formPrescricao.dosagem}
                      onChange={(e) => setFormPrescricao({...formPrescricao, dosagem: e.target.value})}
                      style={{ padding: '10px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Frequência:</label>
                    <input 
                      type="text" 
                      className="notas-input"
                      placeholder="Ex: 12/12h durante 5 dias"
                      value={formPrescricao.frequencia}
                      onChange={(e) => setFormPrescricao({...formPrescricao, frequencia: e.target.value})}
                      style={{ padding: '10px' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-finalizar-check" style={{ width: '100%', justifyContent: 'center' }}>
                  <Plus size={18} /> Receitar e Descontar do Stock
                </button>
              </form>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VeterinariaPage;