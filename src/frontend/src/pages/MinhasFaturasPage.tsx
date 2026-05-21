import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, DollarSign } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import logoImg from '../../foto.webp';

interface Fatura {
  idFaturas: string;
  nifCliente: string;
  valorTotal: number;
  documento: string;
  metodoPagamento: string;
}

const MinhasFaturasPage: React.FC = () => {
  const navigate = useNavigate();
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);

  const tutor = {
    nome: localStorage.getItem('user_nome') || 'Tutor',
    nif: localStorage.getItem('user_nif') || '---',
    perfil: localStorage.getItem('role') || 'Tutor',
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchFaturas = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/faturas/tutor/${tutor.nif}`);
        setFaturas(res.data);
      } catch (err) {
        console.error('Erro ao carregar faturas:', err);
      } finally {
        setLoading(false);
      }
    };
    if (tutor.nif !== '---') fetchFaturas();
  }, [tutor.nif]);

  const handleImprimirFatura = (fatura: Fatura) => {
    const novaAba = window.open('', '_blank');
    if (novaAba) {
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
                <p style="margin: 5px 0 0 0; color: #666;">Comprovativo de Pagamento do Cliente</p>
              </div>
              
              <img src="${window.location.origin}${logoImg}" class="logo" alt="Logo" />
              
            </div>
            
            <div class="details">
              <p><strong>Nº Fatura:</strong> ${fatura.documento}</p>
              <p><strong>Data de Emissão:</strong> ${dataEmissao}</p>
              <br/>
              <p><strong>Nome do Cliente:</strong> ${tutor.nome}</p>
              <p><strong>NIF do Cliente:</strong> ${fatura.nifCliente}</p>
            </div>

            <div class="total-box">
              <h2 style="margin: 0 0 10px 0;">Total Liquidado: ${fatura.valorTotal.toFixed(2)} €</h2>
              <p style="margin: 0; color: #555;"><strong>Método de Liquidação:</strong> ${fatura.metodoPagamento}</p>
            </div>

            <button class="print-btn" onclick="window.print()">🖨️ Imprimir Segunda Via</button>
          </body>
        </html>
      `);
      novaAba.document.close();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Header userData={tutor} />

      <main style={{ flex: 1, padding: '40px 5%', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: '#666', marginBottom: '20px' }}>
          <ArrowLeft size={20} /> Voltar ao Painel
        </button>

        <h1 style={{ fontSize: '28px', color: '#333', marginBottom: '10px' }}>O Meu Histórico de Faturação</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>Consulte e emita segundas vias dos seus recibos das estadias passadas.</p>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>A carregar os seus recibos...</p>
        ) : faturas.length > 0 ? (
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eee', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px' }}>Data do Recibo</th>
                  <th style={{ padding: '12px' }}>Nº Fatura</th>
                  <th style={{ padding: '12px' }}>Método</th>
                  <th style={{ padding: '12px' }}>Total Pago</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {faturas.map(f => {
                  const timestampPart = f.documento.split('-')[1];
                  const dataFormatada = timestampPart ? new Date(parseInt(timestampPart)).toLocaleDateString('pt-PT') : '---';
                  return (
                    <tr key={f.idFaturas} style={{ borderBottom: '1px solid #f1f3f5' }}>
                      <td style={{ padding: '14px 12px', fontWeight: '500' }}>{dataFormatada}</td>
                      <td style={{ padding: '14px 12px', color: '#666' }}>{f.documento.split('-')[0]}</td>
                      <td style={{ padding: '14px 12px' }}><span style={{ background: '#e9ecef', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>{f.metodoPagamento}</span></td>
                      <td style={{ padding: '14px 12px', fontWeight: 'bold', color: '#2e7d32' }}>{f.valorTotal.toFixed(2)} €</td>
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleImprimirFatura(f)}
                          style={{ background: '#7DDFD3', color: '#333', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <Printer size={14} /> Ver Recibo
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8f9fa', borderRadius: '8px' }}>
            <DollarSign size={40} color="#ccc" style={{ marginBottom: '10px' }} />
            <p style={{ fontWeight: 'bold', color: '#333', margin: 0 }}>Ainda não tem faturas emitidas.</p>
            <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>Assim que o seu patudo concluir a primeira estadia e fizer check-out, o recibo aparecerá aqui.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MinhasFaturasPage;