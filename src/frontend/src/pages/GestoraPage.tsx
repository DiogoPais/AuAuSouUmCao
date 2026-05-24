import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Download, DollarSign, Activity, Printer, ArrowLeft, ShieldCheck, FileSearch, Building, CalendarDays, Package, AlertTriangle, Eye, BellRing, Search, X
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
  animal?: { nome: string }; 
  reserva?: { animal: { nome: string } };
}

interface Documentacao {
  idReserva: string;
  dataEntrada: string;
  dataSaida: string;
  estado: string;
  termoAceite: boolean;
  boxNumero: number;
  animal: {
    nome: string;
    tipoTrela: string;
    estado: string;
    reatividade: string;
    planoVacinal?: { documento: string; isValido: boolean; dataUltimaVacina?: string };
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
  const [activeTab, setActiveTab] = useState<'HOTEL' | 'FINANCAS' | 'LOGS' | 'ARQUIVO'>('HOTEL');
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [docs, setDocs] = useState<Documentacao[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Calendário
  const [diaDetalheSelecionado, setDiaDetalheSelecionado] = useState<{data: string, caes: any[]} | null>(null);

  // NOVOS ESTADOS: Filtros da Auditoria
  const [filtroAnimal, setFiltroAnimal] = useState('');
  const [filtroData, setFiltroData] = useState('');

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

  // Função original usada para abrir ficheiros reais (ex: Vacinas)
  const handleAbrirPdf = async (chave: string) => {
    const novaAba = window.open('about:blank', '_blank');
    if (novaAba) novaAba.document.write('<h2>A carregar documento seguro...</h2>');
    try {
      const res = await axios.get(`${API_URL}/api/documentos/ver`, { params: { chave } });
      if (novaAba) novaAba.location.href = res.data.url;
    } catch (err) {
      if (novaAba) novaAba.close();
      alert("Erro ao aceder ao arquivo digital.");
    }
  };

  // ==========================================
  // NOVA FUNÇÃO: Gerar Recibo Virtual da Fatura
  // ==========================================
  const handleImprimirFatura = (fatura: Fatura) => {
    const novaAba = window.open('', '_blank');
    if (novaAba) {
      // Extrair a data do nome da fatura, se possível
      const timestampPart = fatura.documento.split('-')[1];
      const dataEmissao = timestampPart ? new Date(parseInt(timestampPart)).toLocaleString('pt-PT') : new Date().toLocaleString('pt-PT');

      novaAba.document.write(`
        <html>
          <head>
            <title>Recibo - ${fatura.documento}</title>
            <style>
              body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #7DDFD3; padding-bottom: 20px; }
              .logo { width: 80px; height: 80px; border-radius: 50%; border: 2px solid #7DDFD3; }
              .details { margin-top: 30px; line-height: 1.6; }
              .total-box { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 5px solid #28a745; }
              .print-btn { margin-top: 40px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
              @media print { .print-btn { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1 style="margin:0;">Hotel Canino - AuAuSouUmCão</h1>
                <p style="margin: 5px 0 0 0; color: #666;">Comprovativo de Pagamento</p>
              </div>
              <img src="https://cdn.discordapp.com/attachments/1212044201747816518/1496523823208599603/Gemini_Generated_Image_sebx2ssebx2ssebx.png?ex=69ea31eb&is=69e8e06b&hm=e86093c99b49fbbe0b718a5942cb18caa1e6e79fdf19253b2e252c75d225bb2e" class="logo" />
            </div>
            
            <div class="details">
              <p><strong>Nº Documento:</strong> ${fatura.documento}</p>
              <p><strong>Data de Emissão:</strong> ${dataEmissao}</p>
              <br/>
              <p><strong>NIF do Cliente:</strong> ${fatura.nifCliente}</p>
            </div>

            <div class="total-box">
              <h2 style="margin: 0 0 10px 0;">Total Pago: ${fatura.valorTotal.toFixed(2)} €</h2>
              <p style="margin: 0; color: #555;"><strong>Método de Pagamento:</strong> ${fatura.metodoPagamento}</p>
            </div>

            <button class="print-btn" onclick="window.print()">🖨️ Imprimir Recibo</button>
          </body>
        </html>
      `);
      novaAba.document.close();
    }
  };

  // NOVA FUNÇÃO: Dar Restock
  const handleReforcarStock = async (idItem: string, nomeItem: string) => {
    const qtdStr = window.prompt(`Recebeste uma encomenda de ${nomeItem}.\nQuantas unidades queres adicionar ao stock?`);
    if (!qtdStr) return; 
    
    const qtd = parseInt(qtdStr, 10);
    if (isNaN(qtd) || qtd <= 0) {
      alert("Quantidade inválida.");
      return;
    }
    
    try {
      await axios.patch(`${API_URL}/api/stock/${idItem}/reforcar`, { quantidade: qtd });
      alert(`+${qtd} unidades de ${nomeItem} adicionadas com sucesso!`);
      const resStock = await axios.get(`${API_URL}/api/stock`);
      setStock(resStock.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao atualizar stock.');
    }
  };

  // ==========================================
  // CÁLCULOS: OCUPAÇÃO E AVISOS
  // ==========================================
  const alertasDeStock = stock.filter(s => s.quantidade <= 10);

  const calcularOcupacao = () => {
    const dias = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const dataDia = new Date(hoje);
      dataDia.setDate(dataDia.getDate() + i);
      
      const caesNesteDia = docs.filter(r => {
        if (r.estado === 'Cancelada' || r.estado === 'CheckOut') return false;
        const inDate = new Date(r.dataEntrada).setHours(0, 0, 0, 0);
        const outDate = new Date(r.dataSaida).setHours(0, 0, 0, 0);
        return dataDia.getTime() >= inDate && dataDia.getTime() < outDate;
      }).map(r => ({ nome: r.animal.nome, box: r.boxNumero, dono: r.animal.tutor?.utilizador?.nome }));

      dias.push({ data: dataDia, ocupados: caesNesteDia.length, caes: caesNesteDia });
    }
    return dias;
  };

  const ocupacaoDias = calcularOcupacao();

  // ==========================================
  // EXPORTAÇÕES E FINANÇAS
  // ==========================================
  const totalFaturado = faturas.reduce((acc, f) => acc + f.valorTotal, 0);
  const totalIVA = totalFaturado * 0.23; 
  const receitaLiquida = totalFaturado - totalIVA;

  // LÓGICA DE FILTRAGEM DOS LOGS
  const logsFiltrados = logs.filter(log => {
    const nomeCao = log.reserva?.animal?.nome || log.animal?.nome || '';
    const matchAnimal = filtroAnimal ? nomeCao.toLowerCase().includes(filtroAnimal.toLowerCase()) : true;
    const logDataStr = new Date(log.timestamp).toISOString().split('T')[0];
    const matchData = filtroData ? logDataStr === filtroData : true;
    return matchAnimal && matchData;
  });

  const exportarCSV = () => {
    let csvContent = "Data,Hora,Animal,Incidente/Descrição\n";
    logsFiltrados.forEach(log => {
      const data = new Date(log.timestamp).toLocaleDateString('pt-PT');
      const hora = new Date(log.timestamp).toLocaleTimeString('pt-PT');
      const descSegura = log.descricao.replace(/,/g, ' '); 
      const nomeCao = log.reserva?.animal?.nome || log.animal?.nome || 'Sistema';
      csvContent += `${data},${hora},${nomeCao},"${descSegura}"\n`;
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

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>A carregar Dashboard...</div>;

  return (
    <div className="gestora-page-container" style={{ minHeight: '100vh', backgroundColor: '#f4f7f6', paddingBottom: '40px' }}>
      
      <div className="no-print"><Header userData={gestora} /></div>

      <div className="print-only" style={{ display: 'none', textAlign: 'center', marginBottom: '20px' }}>
        <h2>Relatório de Incidentes e Auditoria - Hotel Canino</h2>
        <p>Data de Emissão: {new Date().toLocaleDateString('pt-PT')}</p>
        {filtroData && <p>Filtro de Data: {new Date(filtroData).toLocaleDateString('pt-PT')}</p>}
        {filtroAnimal && <p>Filtro de Cão: {filtroAnimal}</p>}
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
        {/* ABA 0: VISÃO GERAL (HOTEL, CALENDÁRIO, AVISOS) */}
        {/* ============================================== */}
        {activeTab === 'HOTEL' && (
          <section className="gestora-section no-print">
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Visão Geral Operacional</h2>
            
            {alertasDeStock.length > 0 && (
              <div style={{ background: '#fff3cd', borderLeft: '5px solid #ffc107', padding: '15px 20px', borderRadius: '4px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#856404', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BellRing size={20} /> Avisos Importantes do Sistema
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404', fontSize: '14px' }}>
                  {alertasDeStock.map(a => (
                    <li key={a.idItem}><strong>{a.nome}</strong> está a acabar! (Restam apenas {a.quantidade} unid.)</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              
              {/* CALENDÁRIO CLICÁVEL */}
              <div style={{ flex: 1, minWidth: '350px', background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarDays size={20} color="#0066cc" /> Próximos 7 Dias (Hóspedes)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
                  {ocupacaoDias.map((d, i) => {
                    const nomeDia = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : d.data.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' });
                    return (
                      <div 
                        key={i} 
                        onClick={() => setDiaDetalheSelecionado(diaDetalheSelecionado?.data === nomeDia ? null : { data: nomeDia, caes: d.caes })}
                        style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: diaDetalheSelecionado?.data === nomeDia ? '#e2e6ea' : (d.ocupados >= 35 ? '#fff3cd' : '#f8f9fa'), borderRadius: '6px', borderLeft: d.ocupados >= 35 ? '4px solid #ffc107' : '4px solid #28a745', cursor: 'pointer', transition: 'background 0.2s' }}
                      >
                        <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {nomeDia} <Eye size={16} color="#0066cc" />
                        </span>
                        <strong>{d.ocupados} Cães {d.ocupados >= 40 && '(Cheio)'}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PAINEL DINÂMICO DE CÃES */}
              {diaDetalheSelecionado && (
                <div style={{ flex: 1, minWidth: '350px', background: '#fff', borderRadius: '8px', padding: '20px', border: '2px solid #0066cc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#0066cc' }}>Animais - {diaDetalheSelecionado.data}</h3>
                    <button onClick={() => setDiaDetalheSelecionado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold', color: '#666' }}>
                      <X size={20} />
                    </button>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '15px 0 0 0', maxHeight: '350px', overflowY: 'auto' }}>
                    {diaDetalheSelecionado.caes.length > 0 ? diaDetalheSelecionado.caes.map((cao, index) => (
                      <li key={index} style={{ padding: '8px 10px', borderBottom: '1px dashed #ccc', fontSize: '14px' }}>
                        <strong>{cao.nome}</strong> (Box {cao.box || 'N/A'}) <br/>
                        <small style={{ color: '#666' }}>Tutor: {cao.dono || 'N/A'}</small>
                      </li>
                    )) : (
                      <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>Nenhum cão previsto para este dia.</p>
                    )}
                  </ul>
                </div>
              )}

              {/* ESTADO DO ARMAZÉM */}
              <div style={{ flex: 1, minWidth: '350px', background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={20} color="#6f42c1" /> Estado do Armazém
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: '15px 0 0 0' }}>
                  {stock.length > 0 ? stock.map(item => (
                    <li key={item.idItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 10px', borderBottom: '1px solid #eee' }}>
                      <div>
                        <span>{item.nome} <small style={{ color: '#888' }}>({item.tipo})</small></span>
                        <div style={{ marginTop: '6px' }}>
                          <button 
                            onClick={() => handleReforcarStock(item.idItem, item.nome)} 
                            style={{ background: '#e3f2fd', color: '#0066cc', border: '1px solid #0066cc', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            + Receber Encomenda
                          </button>
                        </div>
                      </div>
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
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Data/Fatura</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>NIF Cliente</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Método Pagamento</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Valor Total</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Visualizar</th>
                  </tr>
                </thead>
                <tbody>
                  {faturas.length > 0 ? faturas.map(f => (
                    <tr key={f.idFaturas} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', color: '#555', fontWeight: 'bold' }}>{f.documento.split('-')[1] ? new Date(parseInt(f.documento.split('-')[1])).toLocaleDateString() : 'N/A'}</td>
                      <td style={{ padding: '12px' }}>{f.nifCliente}</td>
                      <td style={{ padding: '12px' }}><span style={{ background: '#e9ecef', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{f.metodoPagamento}</span></td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{f.valorTotal.toFixed(2)} €</td>
                      <td style={{ padding: '12px' }}>
                        {/* AQUI ESTÁ A ALTERAÇÃO: O botão agora desenha a fatura no momento */}
                        <button 
                          onClick={() => handleImprimirFatura(f)}
                          style={{ background: '#e3f2fd', color: '#007bff', border: '1px solid #007bff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          📄 Imprimir Recibo
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Nenhuma fatura emitida.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ============================================== */}
        {/* ABA 2: AUDITORIA E LOGS COM FILTROS            */}
        {/* ============================================== */}
        {activeTab === 'LOGS' && (
          <section className="logs-section">
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: '0', color: '#333' }}>Auditoria de Operações e Incidentes</h2>
              
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

            <div className="no-print" style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
                <Search size={18} color="#666" />
                <input 
                  type="text" 
                  placeholder="Procurar por nome do Cão..." 
                  value={filtroAnimal}
                  onChange={(e) => setFiltroAnimal(e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>Data exata:</label>
                <input 
                  type="date" 
                  value={filtroData}
                  onChange={(e) => setFiltroData(e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              {(filtroAnimal || filtroData) && (
                <button 
                  onClick={() => { setFiltroAnimal(''); setFiltroData(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#dc3545', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
                >
                  <X size={16} /> Limpar
                </button>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Data e Hora</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Animal</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #dee2e6' }}>Descrição da Ação / Funcionário</th>
                  </tr>
                </thead>
                <tbody>
                  {logsFiltrados.length > 0 ? logsFiltrados.map(log => {
                    const isAlerta = log.descricao.includes('🚨') || log.descricao.includes('[CHECK');
                    return (
                      <tr key={log.idRegisto} style={{ borderBottom: '1px solid #eee', backgroundColor: isAlerta ? '#fffaf0' : 'transparent' }}>
                        <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{log.reserva?.animal?.nome || log.animal?.nome || 'Sistema'}</td>
                        <td style={{ padding: '12px', color: isAlerta ? '#d39e00' : '#333' }}>{log.descricao}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Nenhum log encontrado com os filtros atuais.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ============================================== */}
        {/* ABA 3: ARQUIVO DIGITAL (MAIS INFORMAÇÃO)       */}
        {/* ============================================== */}
        {activeTab === 'ARQUIVO' && (
          <section className="gestora-section no-print">
            <h2 style={{ marginBottom: '20px' }}><FileSearch size={22} style={{ verticalAlign: 'middle' }} /> Consulta de Documentação Legal</h2>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Animal / Tutor</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Estado Físico / Estadia</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Termo Resp.</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Data Vacina / Boletim</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.idReserva} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>
                        <strong>{d.animal.nome}</strong> <span style={{ color: '#888', fontSize: '12px' }}>({d.animal.reatividade})</span><br/>
                        <small style={{ color: '#666' }}>{d.animal.tutor?.utilizador?.nome || 'N/A'}</small>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ color: d.animal.estado === 'Quarentena' ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>{d.animal.estado}</span><br/>
                        <small style={{ color: '#888' }}>{d.estado}</small>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {d.termoAceite ? <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Aceite</span> : <span style={{ color: '#dc3545' }}>⚠ Pendente</span>}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ marginBottom: '5px' }}>{d.animal.planoVacinal?.dataUltimaVacina ? new Date(d.animal.planoVacinal.dataUltimaVacina).toLocaleDateString() : 'Sem Data'}</div>
                        {d.animal.planoVacinal?.documento && (
                          <button onClick={() => handleAbrirPdf(d.animal.planoVacinal!.documento)} style={{ background: '#e3f2fd', color: '#007bff', border: '1px solid #007bff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                            📄 Abrir Boletim
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="no-print" style={{ marginTop: '40px' }}>
          <button 
            onClick={() => window.history.back()}
            style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
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