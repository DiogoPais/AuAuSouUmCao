import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, DollarSign, Activity, Printer, ArrowLeft } from 'lucide-react';
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
  animalId: string;
  animal: { nome: string };
}

const GestoraPage: React.FC = () => {
  const gestora = {
    nome: localStorage.getItem('user_nome') || 'Gestora',
    nif: localStorage.getItem('user_nif') || '---',
    telemovel: localStorage.getItem('user_telemovel') || '---',
    perfil: localStorage.getItem('role') || 'Gestora',
  };

  const [activeTab, setActiveTab] = useState<'FINANCAS' | 'LOGS'>('FINANCAS');
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resFaturas, resLogs] = await Promise.all([
          axios.get(`${API_URL}/api/faturas`),
          axios.get(`${API_URL}/api/logs`)
        ]);
        setFaturas(resFaturas.data);
        setLogs(resLogs.data);
      } catch (err) {
        console.error('Erro ao carregar dados da gestora:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ==========================================
  // MÉTRICAS FINANCEIRAS
  // ==========================================
  const totalFaturado = faturas.reduce((acc, f) => acc + f.valorTotal, 0);
  const totalIVA = totalFaturado * 0.23; // Estimativa de IVA (23%) do total bruto
  const receitaLiquida = totalFaturado - totalIVA;

  // ==========================================
  // EXPORTAÇÃO CSV
  // ==========================================
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

  // ==========================================
  // GERAÇÃO DE PDF
  // ==========================================
  const imprimirRelatorioPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="gestora-page-container">
        <Header userData={gestora} />
        <div style={{ textAlign: 'center', padding: '50px' }}>A carregar métricas...</div>
      </div>
    );
  }

  return (
    <div className="gestora-page-container" style={{ minHeight: '100vh', backgroundColor: '#f4f7f6', paddingBottom: '40px' }}>
      
      <div className="no-print">
        <Header userData={gestora} />
      </div>

      {/* CABEÇALHO SÓ VISÍVEL NO PDF */}
      <div className="print-only" style={{ display: 'none', textAlign: 'center', marginBottom: '20px' }}>
        <h2>Relatório de Incidentes e Auditoria - Hotel Canino</h2>
        <p>Data de Emissão: {new Date().toLocaleDateString('pt-PT')}</p>
        <hr />
      </div>

      <main className="gestora-main" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div className="no-print" style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          <button 
            style={{ padding: '10px 20px', background: activeTab === 'FINANCAS' ? '#7DDFD3' : '#eee', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => setActiveTab('FINANCAS')}
          >
            <DollarSign size={18} /> Dashboard Financeiro
          </button>
          <button 
            style={{ padding: '10px 20px', background: activeTab === 'LOGS' ? '#7DDFD3' : '#eee', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => setActiveTab('LOGS')}
          >
            <Activity size={18} /> Auditoria e Logs
          </button>
        </div>

        {activeTab === 'FINANCAS' && (
          <section className="dashboard-section no-print">
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Visão Geral Financeira</h2>
            
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
                    <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Nenhuma fatura emitida ainda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

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
                        <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{log.animal?.nome || 'Sistema'}</td>
                        <td style={{ padding: '12px', color: isAlerta ? '#d39e00' : '#333' }}>
                          {log.descricao}
                        </td>
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

        {/* BOTÃO DE VOLTAR */}
        <div className="no-print" style={{ marginTop: '30px' }}>
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
            <ArrowLeft size={18} /> Voltar ao Menu
          </button>
        </div>

      </main>

      <style>{`
        @media print {
          body { background-color: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .gestora-page-container { background: transparent; }
          table { border: 1px solid #ddd; }
          th, td { border: 1px solid #ddd !important; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
};

export default GestoraPage;