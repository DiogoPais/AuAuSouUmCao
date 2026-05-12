import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Download, DollarSign, Activity, Printer, ArrowLeft, ShieldCheck, FileSearch, Building, CalendarDays, Package, AlertTriangle
} from 'lucide-react';
import Header from '../components/Header';
import './GestoraPage.css';

interface Fatura {
  idFaturas: string;
  nifCliente: string;
  valorTotal: number;
  documento: string;
  metodoPagamento: string;
}

interface Log {
  idRegisto: string;
  descricao: string;
  timestamp: string;
  animal: { nome: string };
}

interface Documentacao {
  idReserva: string;
  dataEntrada: string;
  dataSaida: string;
  estado: string;
  termoAceite: boolean;
  animal: {
    nome: string;
    tipoTrela: string;
    planoVacinal?: { documento: string; isValido: boolean };
    tutor?: { utilizador?: { nome: string } };
  };
}

interface StockItem {
  idItem: string;
  nome: string;
  quantidade: number;
  tipo: string;
}

const GestoraPage: React.FC = () => {
  // A aba 'HOTEL' é agora a padrão mal a gestora entra na página!
  const [activeTab, setActiveTab] = useState<'HOTEL' | 'FINANCAS' | 'LOGS' | 'ARQUIVO'>('HOTEL');
  
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [docs, setDocs] = useState<Documentacao[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const gestora = {
    nome: localStorage.getItem('user_nome') || 'Gestora',
    nif: localStorage.getItem('user_nif') || '---',
    telemovel: localStorage.getItem('user_telemovel') || '---',
    perfil: localStorage.getItem('role') || 'Gestora',
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Puxamos todas as infos de uma vez
        const [resFaturas, resLogs, resDocs, resStock] = await Promise.all([
          axios.get(`${API_URL}/api/faturas`),
          axios.get(`${API_URL}/api/logs`),
          axios.get(`${API_URL}/api/reservas`),
          axios.get(`${API_URL}/api/stock`)
        ]);
        setFaturas(resFaturas.data);
        setLogs(resLogs.data);
        setDocs(resDocs.data);
        setStock(resStock.data);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleAbrirPdf = async (chave: string) => {
    const novaAba = window.open('about:blank', '_blank');
    if (novaAba) novaAba.document.write('<h2>A carregar documento seguro...</h2>');
    try {
      const res = await axios.get(`${API_URL}/api/documentos/ver/${chave}`);
      if (novaAba) novaAba.location.href = res.data.url;
    } catch (err) {
      if (novaAba) novaAba.close();
      alert("Erro ao aceder ao arquivo digital.");
    }
  };

  // ==========================================
  // CÁLCULOS: OCUPAÇÃO (CALENDÁRIO DE 7 DIAS)
  // ==========================================
  const calcularOcupacao = () => {
    const dias = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const dataDia = new Date(hoje);
      dataDia.setDate(dataDia.getDate() + i);
      
      const ocupados = docs.filter(r => {
        if (r.estado === 'Cancelada' || r.estado === 'CheckOut') return false;
        
        const inDate = new Date(r.dataEntrada).setHours(0, 0, 0, 0);
        const outDate = new Date(r.dataSaida).setHours(0, 0, 0, 0);
        
        // O cão está no hotel se o dia atual for >= data de entrada e < data de saída
        return dataDia.getTime() >= inDate && dataDia.getTime() < outDate;
      }).length;

      dias.push({ data: dataDia, ocupados });
    }
    return dias;
  };

  const ocupacaoDias = calcularOcupacao();

  // ==========================================
  // MÉTRICAS FINANCEIRAS E EXPORTAÇÕES
  // ==========================================
  const totalFaturado = faturas.reduce((acc, f) => acc + f.valorTotal, 0);
  const totalIVA = totalFaturado * 0.23; 
  const receitaLiquida = totalFaturado - totalIVA;

  const exportarCSV = () => {
    let csvContent = "Data,Hora,Animal,Incidente/Descrição\n";
    logs.forEach(log => {
      const data = new Date(log.timestamp).toLocaleDateString('pt-PT');
      const hora = new Date(log.timestamp).toLocaleTimeString('pt-PT');
      const descSegura = log.descricao.replace(/,/g, ' '); 
      csvContent += `${data},${hora},${log.animal?.nome || 'N/A'},"${descSegura}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Logs_Auditoria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imprimirRelatorioPDF = () => window.print();

  if (loading) {
    return (
      <div className="gestora-page-container">
        <Header userData={gestora} />
        <div style={{ textAlign: 'center', padding: '50px' }}>A carregar Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="gestora-page-container" style={{ minHeight: '100vh', backgroundColor: '#f4f7f6', paddingBottom: '40px' }}>
      
      <div className="no-print">
        <Header userData={gestora} />
      </div>

      <div className="print-only" style={{ display: 'none', textAlign: 'center', marginBottom: '20px' }}>
        <h2>Relatório de Incidentes e Auditoria - Hotel Canino</h2>
        <p>Data de Emissão: {new Date().toLocaleDateString('pt-PT')}</p>
        <hr />
      </div>

      <main className="gestora-main" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* MENU DE NAVEGAÇÃO DA GESTORA */}
        <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto' }}>
          <button className={`tab-btn-gestora ${activeTab === 'HOTEL' ? 'ativo' : ''}`} onClick={() => setActiveTab('HOTEL')}>
            <Building size={18} /> Visão Geral
          </button>
          <button className={`tab-btn-gestora ${activeTab === 'FINANCAS' ? 'ativo' : ''}`} onClick={() => setActiveTab('FINANCAS')}>
            <DollarSign size={18} /> Finanças
          </button>
          <button className={`tab-btn-gestora ${activeTab === 'LOGS' ? 'ativo' : ''}`} onClick={() => setActiveTab('LOGS')}>
            <Activity size={18} /> Auditoria e Logs
          </button>
          <button className={`tab-btn-gestora ${activeTab === 'ARQUIVO' ? 'ativo' : ''}`} onClick={() => setActiveTab('ARQUIVO')}>
            <ShieldCheck size={18} /> Arquivo Digital
          </button>
        </div>

        {/* ============================================== */}
        {/* ABA 0: VISÃO GERAL (HOTEL, CALENDÁRIO E STOCK) */}
        {/* ============================================== */}
        {activeTab === 'HOTEL' && (
          <section className="gestora-section no-print">
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Visão Geral Operacional</h2>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              
              {/* Ocupação / Calendário */}
              <div style={{ flex: 1, minWidth: '350px', background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarDays size={20} color="#0066cc" /> Próximos 7 Dias (Hóspedes)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
                  {ocupacaoDias.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: d.ocupados >= 35 ? '#fff3cd' : '#f8f9fa', borderRadius: '6px', borderLeft: d.ocupados >= 35 ? '4px solid #ffc107' : '4px solid #28a745' }}>
                      <span style={{ fontWeight: '500' }}>
                        {i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : d.data.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <strong>{d.ocupados} Cães {d.ocupados >= 40 && '(Lotação Esgotada)'}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controlo de Stock Rápido */}
              <div style={{ flex: 1, minWidth: '350px', background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={20} color="#6f42c1" /> Estado do Armazém
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: '15px 0 0 0' }}>
                  {stock.length > 0 ? stock.map(item => (
                    <li key={item.idItem} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 10px', borderBottom: '1px solid #eee' }}>
                      <span>{item.nome} <small style={{ color: '#888' }}>({item.tipo})</small></span>
                      <span style={{ color: item.quantidade <= 10 ? '#dc3545' : '#28a745', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.quantidade <= 10 && <AlertTriangle size={16} />} 
                        {item.quantidade} unid.
                      </span>
                    </li>
                  )) : (
                    <p style={{ color: '#888', textAlign: 'center' }}>Sem stock registado.</p>
                  )}
                </ul>
              </div>

            </div>
          </section>
        )}

        {/* ============================================== */}
        {/* ABA 1: FINANÇAS INTEGRAIS                      */}
        {/* ============================================== */}
        {activeTab === 'FINANCAS' && (
          <section className="dashboard-section no-print">
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Dashboard Financeiro</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '5px solid #28a745' }}>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Faturação Bruta Total</p>
                <h3 style={{ margin: '5px 0 0 0', fontSize: '28px', color: '#333' }}>{totalFaturado.toFixed(2)} €</h3>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '5px solid #17a2b8' }}>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Receita Líquida Estimada</p>
                <h3 style={{ margin: '5px 0 0 0', fontSize: '28px', color: '#333' }}>{receitaLiquida.toFixed(2)} €</h3>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '5px solid #ffc107' }}>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Imposto (IVA 23%)</p>
                <h3 style={{ margin: '5px 0 0 0', fontSize: '28px', color: '#333' }}>{totalIVA.toFixed(2)} €</h3>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '5px solid #6c757d' }}>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Faturas Emitidas</p>
                <h3 style={{ margin: '5px 0 0 0', fontSize: '28px', color: '#333' }}>{faturas.length}</h3>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}><FileText size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Histórico de Faturação</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Documento</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>NIF Cliente</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Método Pagamento</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {faturas.length > 0 ? faturas.map(f => (
                    <tr key={f.idFaturas} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', color: '#0066cc', fontWeight: 'bold' }}>{f.documento}</td>
                      <td style={{ padding: '12px' }}>{f.nifCliente}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: '#e9ecef', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{f.metodoPagamento}</span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{f.valorTotal.toFixed(2)} €</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Nenhuma fatura emitida.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ============================================== */}
        {/* ABA 2: AUDITORIA E LOGS                        */}
        {/* ============================================== */}
        {activeTab === 'LOGS' && (
          <section className="logs-section">
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Auditoria de Operações e Incidentes</h2>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={exportarCSV}
                  style={{ padding: '8px 15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Download size={16} /> Exportar CSV
                </button>
                <button 
                  onClick={imprimirRelatorioPDF}
                  style={{ padding: '8px 15px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Printer size={16} /> Gerar Relatório PDF
                </button>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Data e Hora</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Animal Relacionado</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Descrição do Log / Incidente</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? logs.map(log => {
                    const isAlerta = log.descricao.includes('🚨') || log.descricao.includes('[CHECK');
                    return (
                      <tr key={log.idRegisto} style={{ borderBottom: '1px solid #eee', backgroundColor: isAlerta ? '#fffaf0' : 'transparent' }}>
                        <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{log.animal?.nome || 'Sistema'}</td>
                        <td style={{ padding: '12px', color: isAlerta ? '#d39e00' : '#333' }}>{log.descricao}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Nenhum log registado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ============================================== */}
        {/* ABA 3: ARQUIVO DIGITAL                         */}
        {/* ============================================== */}
        {activeTab === 'ARQUIVO' && (
          <section className="gestora-section no-print">
            <h2 style={{ marginBottom: '20px' }}><FileSearch size={22} style={{ verticalAlign: 'middle' }} /> Consulta de Documentação Legal</h2>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Animal / Tutor</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Termo Resp.</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Boletim Vacinas</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Trela / Saúde</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.idReserva} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>
                        <strong>{d.animal.nome}</strong><br/>
                        <small style={{ color: '#666' }}>{d.animal.tutor?.utilizador?.nome || 'N/A'}</small>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {d.termoAceite ? 
                          <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Aceite</span> : 
                          <span style={{ color: '#dc3545' }}>⚠ Pendente</span>
                        }
                      </td>
                      <td style={{ padding: '12px' }}>
                        {d.animal.planoVacinal?.documento ? (
                          <button 
                            onClick={() => handleAbrirPdf(d.animal.planoVacinal!.documento)}
                            style={{ background: '#e3f2fd', color: '#007bff', border: '1px solid #007bff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            📄 Abrir Boletim
                          </button>
                        ) : 'Não submetido'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '13px' }}>Trela: {d.animal.tipoTrela}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* BOTÃO VOLTAR AO MENU */}
        <div className="no-print" style={{ marginTop: '40px' }}>
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
            <ArrowLeft size={18} /> Voltar ao Menu Principal
          </button>
        </div>

      </main>

      <style>{`
        .tab-btn-gestora { padding: 12px 20px; border: none; background: #eee; cursor: pointer; border-radius: 6px 6px 0 0; display: flex; align-items: center; gap: 8px; font-weight: bold; }
        .tab-btn-gestora.ativo { background: #7DDFD3; color: #333; }
        
        @media print {
          body { background-color: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .gestora-page-container { background: transparent !important; }
          table { border: 1px solid #ddd; }
          th, td { border: 1px solid #ddd !important; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
};

export default GestoraPage;