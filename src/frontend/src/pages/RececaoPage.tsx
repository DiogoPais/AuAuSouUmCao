import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './RececaoPage.css';

interface Reserva {
  idReserva: string;
  dataEntrada: string;
  dataSaida: string;
  estado: string;
  valor: number; // NOVO: Precisamos do valor base para a faturação
  animal: {
    idAnimal: string;
    nome: string;
    raca: string;
    tutorNif: string;
    tutor?: {
      utilizador?: { nome: string };
    };
    planoVacinal?: { documento: string; isValido: boolean };
  };
}

const RececaoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'IN' | 'OUT'>('IN');
  const [showBilling, setShowBilling] = useState(false);
  const [reservaParaPagar, setReservaParaPagar] = useState<string | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  
  // Estados do Modal Check-in
  const [showPlanoModal, setShowPlanoModal] = useState(false);
  const [reservaPlanoSelecionada, setReservaPlanoSelecionada] = useState<Reserva | null>(null);
  const [dataVacina, setDataVacina] = useState('');
  const [vacinaValida, setVacinaValida] = useState(true);
  
  // NOVOS ESTADOS: Termos de Responsabilidade (Check-IN) e Pagamento (Check-OUT)
  const [termo1, setTermo1] = useState(false);
  const [termo2, setTermo2] = useState(false);
  const [metodoPagamento, setMetodoPagamento] = useState('');

  const funcionario = { 
    nome: localStorage.getItem('user_nome') || "Funcionário", 
    perfil: localStorage.getItem('role') || "Receção" 
  };
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/reservas`);
      setReservas(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleAbrirPdf = async (chave: string) => {
    const novaAba = window.open('about:blank', '_blank');
    if (novaAba) novaAba.document.write('<h2>A carregar o documento seguro de forma encriptada...</h2>');
    try {
      const res = await axios.get(`${API_URL}/api/documentos/ver/${chave}`);
      if (novaAba) novaAba.location.href = res.data.url;
    } catch (err: any) {
      console.error(err);
      if (novaAba) novaAba.close();
      alert("Erro ao abrir documento. O acesso pode ter expirado.");
    }
  };

  const handleCheckInAction = async (id: string, accept: boolean) => {
    try {
      if (accept) {
        const reserva = reservas.find(r => r.idReserva === id);
        setReservaPlanoSelecionada(reserva || null);
        setShowPlanoModal(true);
        setDataVacina('');
        setVacinaValida(true);
        setTermo1(false); // Reset aos termos
        setTermo2(false);
        return;
      } else {
        await axios.patch(`${API_URL}/api/reservas/${id}/cancelar`);
        alert("Reserva cancelada e removida da lista.");
      }
      fetchData(); 
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro no servidor ao processar a ação.");
    }
  };

  const handleConfirmarPlanoVacinal = async () => {
    if (!reservaPlanoSelecionada || !dataVacina) {
      alert("Por favor, preencha a data da última vacina.");
      return;
    }

    try {
      // 1. Atualiza a vacina
      await axios.patch(`${API_URL}/api/plano-vacinal/${reservaPlanoSelecionada.animal.idAnimal}`, {
        dataUltimaVacina: new Date(dataVacina),
        isValido: vacinaValida,
        estado: vacinaValida ? 'Valido' : 'Caducado'
      });

      // 2. Faz o Check-in passando a confirmação dos termos!
      await axios.patch(`${API_URL}/api/reservas/${reservaPlanoSelecionada.idReserva}/checkin`, {
        termosAceites: termo1 && termo2
      });
      
      alert("Check-In realizado com sucesso!");
      setShowPlanoModal(false);
      setReservaPlanoSelecionada(null);
      fetchData(); 
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao atualizar check-in.");
    }
  };

  const handleFinalizarPagamento = async () => {
    if (!reservaParaPagar) return;
    if (!metodoPagamento) {
      alert("Selecione um método de pagamento para emitir a fatura.");
      return;
    }

    try {
      await axios.patch(`${API_URL}/api/reservas/${reservaParaPagar}/checkout`, {
        metodoPagamento: metodoPagamento
      });
      alert("Pagamento e Check-OUT concluídos com sucesso! Fatura emitida.");
      setShowBilling(false);
      setReservaParaPagar(null);
      setMetodoPagamento('');
      fetchData(); 
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao finalizar pagamento.");
    }
  };

  // ==========================================
  // LÓGICA DE FATURAÇÃO E ATRASOS (FRONTEND PREVIEW)
  // ==========================================
  const reservaAtual = reservas.find(r => r.idReserva === reservaParaPagar);
  let diasAtraso = 0;
  let multa = 0;
  
  if (reservaAtual) {
    const agora = new Date();
    const saida = new Date(reservaAtual.dataSaida);
    if (agora > saida) {
      const msAtraso = agora.getTime() - saida.getTime();
      diasAtraso = Math.ceil(msAtraso / (1000 * 60 * 60 * 24));
      multa = diasAtraso * 20; // 20€ por dia extra
    }
  }

  const valorBase = reservaAtual?.valor || 0;
  const valorTotalSemIva = valorBase + multa;
  const imposto = valorTotalSemIva * 0.23;
  const totalFaturar = valorTotalSemIva + imposto;

  // Render do Ecrã de Faturação
  if (showBilling && reservaAtual) {
    return (
      <div className="rececao-page">
        <Header userData={funcionario} />
        <div className="billing-bar">Check-OUT / Faturação</div>
        <div className="rececao-card" style={{ margin: '0 25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '26px' }}>Fatura Proforma</h1>
            <div className="logo-circle" style={{ width: '100px', height: '100px', border: '2px solid #7DDFD3' }}>
              <img src="https://cdn.discordapp.com/attachments/1212044201747816518/1496523823208599603/Gemini_Generated_Image_sebx2ssebx2ssebx.png?ex=69ea31eb&is=69e8e06b&hm=e86093c99b49fbbe0b718a5942cb18caa1e6e79fdf19253b2e252c75d225bb2e" alt="Logo" />
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <p><strong>Cliente:</strong> {reservaAtual.animal.tutor?.utilizador?.nome} (NIF: {reservaAtual.animal.tutorNif})</p>
            <p><strong>Hóspede:</strong> {reservaAtual.animal.nome}</p>
          </div>

          <table className="rececao-table" style={{ marginTop: '20px' }}>
            <thead>
              <tr><th>Descrição</th><th>Valor</th></tr>
            </thead>
            <tbody>
              <tr><td>Estadia Base e Serviços Contratados</td><td>{valorBase.toFixed(2)}€</td></tr>
              
              {diasAtraso > 0 && (
                <tr style={{ color: '#dc3545', fontWeight: 'bold' }}>
                  <td>Multa por Atraso no Check-Out ({diasAtraso} dias extras)</td>
                  <td>{multa.toFixed(2)}€</td>
                </tr>
              )}
              
              <tr><td>Subtotal</td><td>{valorTotalSemIva.toFixed(2)}€</td></tr>
              <tr><td>IVA (23%)</td><td>{imposto.toFixed(2)}€</td></tr>
              <tr><td><strong style={{ fontSize: '18px' }}>TOTAL A PAGAR</strong></td><td><strong style={{ fontSize: '18px' }}>{totalFaturar.toFixed(2)}€</strong></td></tr>
            </tbody>
          </table>

          <div style={{ marginTop: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <label style={{ fontWeight: 'bold' }}>Método de Pagamento: </label>
            <select 
              value={metodoPagamento} 
              onChange={(e) => setMetodoPagamento(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}
            >
              <option value="">-- Selecione --</option>
              <option value="Multibanco">Multibanco</option>
              <option value="MBWay">MBWay</option>
              <option value="Dinheiro">Dinheiro Físico</option>
              <option value="Cartao_Credito">Cartão de Crédito</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', margin: '20px 40px' }}>
            <button className="btn-filter" style={{ padding: '10px 30px' }} onClick={() => setShowBilling(false)}>Cancelar</button>
            <button 
              className="btn-pagar" 
              onClick={handleFinalizarPagamento}
              disabled={!metodoPagamento}
              style={{ opacity: metodoPagamento ? 1 : 0.5, cursor: metodoPagamento ? 'pointer' : 'not-allowed' }}
            >
              EMITIR FATURA E PAGAR
            </button>
        </div>
        <Footer />
      </div>
    );
  }

  // ==========================================
  // LÓGICA DE ORDENAÇÃO DOS CHECK-OUTS
  // ==========================================
  const checkoutsOrdenados = reservas
    .filter(r => r.estado === 'CheckIn')
    .sort((a, b) => new Date(a.dataSaida).getTime() - new Date(b.dataSaida).getTime()); // Ordem cronológica pura

  return (
    <div className="rececao-page">
      <Header userData={funcionario} />
      
      {/* MODAL PARA PREENCHER PLANO VACINAL E TERMOS */}
      {showPlanoModal && reservaPlanoSelecionada && (
        <div className="modal-overlay">
          <div className="modal-plano-vacinal" style={{ maxWidth: '600px' }}>
            <h3>Check-in - {reservaPlanoSelecionada.animal.nome}</h3>
            
            <div className="modal-content">
              <div className="modal-section" style={{ background: '#f8f9fa', padding: '10px', borderRadius: '6px' }}>
                <p><strong>Tutor:</strong> {reservaPlanoSelecionada.animal.tutor?.utilizador?.nome || 'N/A'}</p>
                <p><strong>NIF:</strong> {reservaPlanoSelecionada.animal.tutorNif}</p>
              </div>

              {/* PASSO 1: VACINAS */}
              <h4 style={{ marginTop: '15px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>1. Validação Clínica</h4>
              <div className="modal-form-group">
                <label htmlFor="data-vacina">Data da Última Vacina:</label>
                <input id="data-vacina" type="date" value={dataVacina} onChange={(e) => setDataVacina(e.target.value)} className="modal-input" />
              </div>

              <div className="modal-form-group">
                <label>
                  <input type="checkbox" checked={vacinaValida} onChange={(e) => setVacinaValida(e.target.checked)} />
                  Vacina válida e em conformidade
                </label>
              </div>

              {reservaPlanoSelecionada.animal.planoVacinal?.documento && (
                <div className="modal-section" style={{ textAlign: 'center' }}>
                  <button type="button" onClick={() => handleAbrirPdf(reservaPlanoSelecionada.animal.planoVacinal!.documento)} className="modal-link" style={{ background: 'transparent', border: '1px solid #667eea', cursor: 'pointer', width: '100%', padding: '8px', borderRadius: '4px' }}>
                    📄 Ver PDF da Ficha Técnica
                  </button>
                </div>
              )}

              {/* PASSO 2: TERMOS DE RESPONSABILIDADE */}
              <h4 style={{ marginTop: '20px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>2. Termo de Responsabilidade</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', fontSize: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={termo1} onChange={(e) => setTermo1(e.target.checked)} style={{ marginTop: '3px' }} />
                  <span>Declaro que o tutor leu e aceitou as condições gerais do Termo de Responsabilidade Digital do Hotel.</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={termo2} onChange={(e) => setTermo2(e.target.checked)} style={{ marginTop: '3px' }} />
                  <span>Confirmo a autorização do tutor para a prestação de cuidados veterinários de urgência, caso seja necessário.</span>
                </label>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn-cancelar-modal" onClick={() => { setShowPlanoModal(false); setReservaPlanoSelecionada(null); }}>
                Cancelar
              </button>
              <button 
                className="btn-confirmar-modal" 
                onClick={handleConfirmarPlanoVacinal}
                disabled={!(termo1 && termo2)} // Só ativa se os dois termos estiverem selecionados
                style={{ opacity: (termo1 && termo2) ? 1 : 0.5, cursor: (termo1 && termo2) ? 'pointer' : 'not-allowed' }}
              >
                ✓ Confirmar e Check-In
              </button>
            </div>
          </div>
        </div>
      )}
      
      <nav className="tabs-bar">
        <button className={`tab-btn ${activeTab === 'IN' ? 'active' : ''}`} onClick={() => setActiveTab('IN')}>Check-IN</button>
        <div className="tab-separator"></div>
        <button className={`tab-btn ${activeTab === 'OUT' ? 'active' : ''}`} onClick={() => setActiveTab('OUT')}>Check-OUT</button>
      </nav>

      <main className="rececao-content">
        <div className="rececao-card">
          <h2>{activeTab === 'IN' ? 'Check-IN pré-feitos:' : 'Check-OUT (Cronológico):'}</h2>
          
          <table className="rececao-table">
            <thead>
              {activeTab === 'IN' ? (
                <tr><th>Nome</th><th>Ficha Tecnica</th><th>Pre-Check-IN</th><th>Operações</th></tr>
              ) : (
                <tr><th>Nome</th><th>Nome do Dono</th><th>Dia de Saida</th><th>Confirmar Saida</th></tr>
              )}
            </thead>
            <tbody>
              {/* RENDERIZAÇÃO INTELIGENTE (Pendente para IN, Cronológica para OUT) */}
              {(activeTab === 'IN' ? reservas.filter(r => r.estado === 'Pendente') : checkoutsOrdenados).map((r, i) => (
                <tr key={i}>
                  {activeTab === 'IN' ? (
                    <>
                      <td>{r.animal.nome}</td>
                        <td>
                          {r.animal.planoVacinal?.documento ? (
                            <button onClick={() => handleAbrirPdf(r.animal.planoVacinal!.documento)} style={{ color: '#17a2b8', fontWeight: 'bold', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '15px' }}>
                              📄 Ver Ficha
                            </button>
                          ) : "Sem Ficha"}
                        </td>
                      <td>{r.animal.planoVacinal?.isValido ? "Sim" : "Não"}</td>
                      <td>
                        <button className="btn-s" onClick={() => handleCheckInAction(r.idReserva, true)}>S</button>
                        <button className="btn-n" onClick={() => handleCheckInAction(r.idReserva, false)}>N</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{r.animal.nome}</td>
                      <td>{r.animal.tutor?.utilizador?.nome || 'Dono não encontrado'}</td>
                      {/* Cor vermelha se o cão estiver em atraso */}
                      <td style={{ color: new Date() > new Date(r.dataSaida) ? '#dc3545' : 'inherit', fontWeight: new Date() > new Date(r.dataSaida) ? 'bold' : 'normal' }}>
                        {new Date(r.dataSaida).toLocaleDateString()}
                      </td>
                      <td>
                        <button className="btn-pagar" onClick={() => { setReservaParaPagar(r.idReserva); setShowBilling(true); }}>
                          Faturar & Pagar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>  
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RececaoPage;