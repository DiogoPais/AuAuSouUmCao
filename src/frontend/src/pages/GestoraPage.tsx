import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import './GestoraPage.css';

type Tab = 'dashboard' | 'calendario' | 'stock';
type StockView = 'main' | 'atual' | 'historico';

interface Reserva {
  idReserva: string;
  dataEntrada: string;
  dataSaida: string;
  estado: string;
}

interface StockItem {
  idItem: string;
  nome: string;
  tipo: string;
  quantidade: number;
  dataAtualizacao?: string;
}

const GestoraPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stockView, setStockView] = useState<StockView>('main');
  const [quarentenaAtiva, setQuarentenaAtiva] = useState(false);
  
  // DADOS REAIS DA BD
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros de Stock
  const [filtroRacao, setFiltroRacao] = useState(false);
  const [filtroMed, setFiltroMed] = useState(false);
  const [filtroEmFalta, setFiltroEmFalta] = useState(false);
  const [ordemData, setOrdData] = useState<'A' | 'D'>('D'); // Ascendente ou Descendente

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const CAPACIDADE_MAXIMA = 30; // Ajusta para o limite real de boxes do vosso hotel

  const admin = {
    nome: localStorage.getItem('user_nome') || 'Gestora',
    perfil: 'Admin',
  };

  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);
        // Vai buscar as reservas e o stock à API
        const [resReservas, resStock] = await Promise.all([
          axios.get(`${API_URL}/api/reservas`),
          axios.get(`${API_URL}/api/stock`).catch(() => ({ data: [] })) // Previne erro caso a rota ainda não exista
        ]);
        setReservas(resReservas.data);
        setStock(resStock.data);
      } catch (err) {
        console.error("Erro ao carregar dados reais:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, [API_URL]);

  // =====================================
  // RENDERIZAR: DASHBOARD (Com alertas dinâmicos)
  // =====================================
  const renderDashboard = () => {
    const itensEmFalta = stock.filter(s => s.quantidade < 5).length;

    return (
      <>
        <div className="dashboard-alert-card">
          <div className="alert-info">
            <h3>Verificar Calendario para caso de Overbooking</h3>
            <p>Mantenha-se atento à lotação máxima das boxes nos próximos dias.</p>
          </div>
          <button className="btn-alerta-neutro" onClick={() => setActiveTab('calendario')}>
            Ir para o Calendario
          </button>
        </div>

        {itensEmFalta > 0 && (
          <div className="dashboard-alert-card">
            <div className="alert-info">
              <h3>Alerta de Stock Crítico!</h3>
              <p>Existem {itensEmFalta} itens em falta ou a acabar. Devemos encomendar.</p>
            </div>
            <button className="btn-alerta-urgente" onClick={() => { setActiveTab('stock'); setStockView('atual'); setFiltroEmFalta(true); }}>
              Ir para Stock
            </button>
          </div>
        )}

        <div className="dashboard-footer">
          <button 
            className="btn-quarentena-toggle"
            onClick={() => setQuarentenaAtiva(!quarentenaAtiva)}
          >
            Ativar Modo Quarentena = {quarentenaAtiva ? 'Ativado' : 'Desativado'}
          </button>
        </div>
      </>
    );
  };

  // =====================================
  // RENDERIZAR: CALENDÁRIO DINÂMICO
  // =====================================
  const renderCalendario = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1);

    return (
      <div className="calendario-wrapper">
        <div className="cal-header">
          <span>Dom</span><span>Seg</span><span>Ter</span>
          <span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
        </div>
        <div className="cal-grid">
          {dias.map(dia => {
            const dataAtual = new Date(ano, mes, dia);
            dataAtual.setHours(0, 0, 0, 0);

            // CALCULAR OCUPAÇÃO REAL DESTE DIA:
            const ocupacaoDia = reservas.filter(r => {
              if (r.estado === 'Cancelada' || r.estado === 'CheckOut') return false;
              const entrada = new Date(r.dataEntrada);
              const saida = new Date(r.dataSaida);
              entrada.setHours(0, 0, 0, 0);
              saida.setHours(23, 59, 59, 999);
              return dataAtual >= entrada && dataAtual <= saida;
            }).length;

            const isLotado = ocupacaoDia >= CAPACIDADE_MAXIMA;
            
            return (
              <div key={dia} className={`cal-cell ${isLotado ? 'lotado' : 'ok'}`}>
                <span className="dia-num">{dia}</span>
                <span className="capacidade">{ocupacaoDia}/{CAPACIDADE_MAXIMA}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // =====================================
  // RENDERIZAR: STOCK DINÂMICO
  // =====================================
  const renderStock = () => {
    // Filtramos o array de stock real baseado nos toggles
    let stockFiltrado = stock;
    
    if (filtroRacao) stockFiltrado = stockFiltrado.filter(s => s.tipo === 'Racao');
    if (filtroMed) stockFiltrado = stockFiltrado.filter(s => s.tipo === 'Medicamento');
    if (filtroEmFalta) stockFiltrado = stockFiltrado.filter(s => s.quantidade < 5); // Exemplo: < 5 é falta

    if (stockView === 'historico') {
      stockFiltrado = [...stockFiltrado].sort((a, b) => {
        if (ordemData === 'A') return a.quantidade - b.quantidade;
        return b.quantidade - a.quantidade;
      });
    }

    if (stockView === 'main') {
      return (
        <div className="stock-main-card">
          <div className="stock-section" style={{ borderBottom: '1px solid #CCCCCC' }}>
            <div className="stock-section-left">
              <h3>Pedido de Ração Automático:</h3>
              <p>O sistema cruza as necessidades com os níveis atuais.</p>
            </div>
            <div className="stock-section-right">
              <button className="btn-stock">Aceitar</button>
            </div>
          </div>
          
          <div className="stock-section">
            <div className="stock-section-left"><h3 style={{fontWeight: 'normal'}}>Obter Stock Atualmente no Hotel</h3></div>
            <div className="stock-section-right">
              <button className="btn-stock" onClick={() => setStockView('atual')}>Ver</button>
            </div>
          </div>

          <div className="stock-section">
            <div className="stock-section-left"><h3 style={{fontWeight: 'normal'}}>Obter Dados de historico de Stock</h3></div>
            <div className="stock-section-right">
              <button className="btn-stock" onClick={() => setStockView('historico')}>Ver</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="stock-view-container">
        {/* FILTROS LATERAIS */}
        <div className="stock-filters">
          <h4>Filtros:</h4>
          <div className="filter-item">
            <span>Ração</span>
            <div className="toggle-switch" style={{ background: filtroRacao ? '#7DDFD3' : '#CCC' }} onClick={() => setFiltroRacao(!filtroRacao)}></div>
          </div>
          <div className="filter-item">
            <span>Medicamentos</span>
            <div className="toggle-switch" style={{ background: filtroMed ? '#7DDFD3' : '#CCC' }} onClick={() => setFiltroMed(!filtroMed)}></div>
          </div>
          
          <div style={{height: '10px'}}></div>
          
          {stockView === 'atual' ? (
            <div className="filter-item">
              <span>Em Falta</span>
              <div className="toggle-switch" style={{ background: filtroEmFalta ? '#E74C3C' : '#CCC' }} onClick={() => setFiltroEmFalta(!filtroEmFalta)}></div>
            </div>
          ) : (
            <div className="filter-item">
              <span>Ord Qtd</span>
              <div className="ord-buttons">
                <button className={`btn-ord ${ordemData === 'A' ? 'ativo' : 'inativo'}`} onClick={() => setOrdData('A')}>A</button>
                <button className={`btn-ord ${ordemData === 'D' ? 'ativo' : 'inativo'}`} onClick={() => setOrdData('D')}>D</button>
              </div>
            </div>
          )}
          
          <button className="btn-stock" style={{marginTop: '20px'}} onClick={() => { setStockView('main'); setFiltroEmFalta(false); setFiltroMed(false); setFiltroRacao(false); }}>Voltar</button>
        </div>
        
        {/* LISTA DINÂMICA DE STOCK */}
        <div className="stock-list">
          {stockFiltrado.length > 0 ? stockFiltrado.map((item, idx) => (
            <div className="stock-item" key={idx}>
              <div className="stock-section-left">
                <h3>{item.nome} {stockView === 'historico' && ' (Histórico)'}</h3>
                <p>Quantidade: {item.quantidade} {item.tipo === 'Racao' ? 'kg' : 'un'}</p>
              </div>
              {item.quantidade < 5 && stockView === 'atual' && <div className="badge-falta">Em Falta!!</div>}
              {stockView === 'atual' && <button className="btn-stock">Pedir</button>}
            </div>
          )) : (
            <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>Nenhum item encontrado.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="gestora-page-container">
      <Header userData={admin} />
      
      {/* BARRA DE NAVEGAÇÃO SUPERIOR - VETERINÁRIA REMOVIDA! */}
      <div className="gestora-navbar">
        <button 
          className={`gestora-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dashboard'); setStockView('main'); }}
        >
          DashBoard
        </button>
        <button 
          className={`gestora-tab ${activeTab === 'calendario' ? 'active' : ''}`}
          onClick={() => { setActiveTab('calendario'); setStockView('main'); }}
        >
          Calendario
        </button>
        <button 
          className={`gestora-tab ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          Stock
        </button>
      </div>

      <main className="gestora-content">
        {loading ? <p style={{textAlign: 'center', marginTop: '50px'}}>A carregar dados do Hotel...</p> : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'calendario' && renderCalendario()}
            {activeTab === 'stock' && renderStock()}
          </>
        )}
      </main>

      <button className="btn-logout-global" onClick={() => navigate('/admin-gateway')}>
        Voltar à Gateway
      </button>
    </div>
  );
};

export default GestoraPage;