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
      // 1. Cálculos do IVA (Assumindo taxa normal de 23% para serviços em Portugal)
      const taxaIva = 0.23;
      const valorBase = fatura.valorTotal / (1 + taxaIva);
      const valorIva = fatura.valorTotal - valorBase;

      // 2. Simulação de Numeração Sequencial e ATCUD
      const anoAtual = new Date().getFullYear();
      const numFaturaSimulado = fatura.documento.split('-')[0].substring(0, 5).toUpperCase(); // Ex: A3F9B
      const faturaIdFormatado = `FT ${anoAtual}/${numFaturaSimulado}`;
      const atcudSimulado = `AT-${fatura.documento.substring(0, 8).toUpperCase()}`;

      // 3. Formatação de datas
      const timestampPart = fatura.documento.split('-')[1];
      const dataEmissao = timestampPart 
        ? new Date(parseInt(timestampPart)).toLocaleDateString('pt-PT') 
        : new Date().toLocaleDateString('pt-PT');

      novaAba.document.write(`
        <html>
          <head>
            <title>Fatura ${faturaIdFormatado}</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; font-size: 14px; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { width: 100px; height: 100px; object-fit: contain; }
              .company-details { font-size: 13px; line-height: 1.5; color: #555; }
              
              .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
              .client-box { border: 1px solid #ccc; padding: 15px; border-radius: 5px; width: 45%; }
              .invoice-meta { width: 45%; text-align: right; }
              
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th { background-color: #f4f4f4; border-bottom: 2px solid #ddd; padding: 10px; text-align: left; }
              td { padding: 10px; border-bottom: 1px solid #eee; }
              .text-right { text-align: right; }
              
              .totals-section { display: flex; justify-content: flex-end; margin-bottom: 40px; }
              .totals-box { width: 300px; border: 1px solid #333; padding: 15px; border-radius: 5px; background-color: #f9f9f9; }
              .totals-line { display: flex; justify-content: space-between; margin-bottom: 8px; }
              .totals-line.bold { font-weight: bold; font-size: 16px; border-top: 1px solid #ccc; padding-top: 8px; margin-top: 8px; }
              
              .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; }
              .qr-mock { width: 80px; height: 80px; background-color: #eee; border: 1px dashed #999; display: flex; align-items: center; justify-content: center; font-size: 10px; text-align: center; }
              
              .print-btn { margin-top: 20px; padding: 10px 20px; background: #000; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; width: 100%; }
              @media print { .print-btn { display: none; } body { padding: 0; } }
            </style>
          </head>
          <body>
            
            <div class="header">
              <div>
                <h1 style="margin: 0 0 10px 0; font-size: 24px;">Fatura / Recibo</h1>
                <div class="company-details">
                  <strong>AuAuSouUmCão - Hotel Canino, Lda.</strong><br/>
                  Rua dos Patudos, 123<br/>
                  4700-000 Braga, Portugal<br/>
                  NIF: 500 123 456
                </div>
              </div>
              <img src="${window.location.origin}${logoImg}" class="logo" alt="Logo" />
            </div>
            
            <div class="info-section">
              <div class="client-box">
                <p style="margin: 0 0 5px 0; color: #777; font-size: 12px;"><strong>Exmo.(a) Senhor(a)</strong></p>
                <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold;">${tutor.nome}</p>
                <p style="margin: 0;">NIF: ${fatura.nifCliente || 'Consumidor Final'}</p>
              </div>
              
              <div class="invoice-meta">
                <h2 style="margin: 0 0 5px 0; color: #333;">${faturaIdFormatado}</h2>
                <p style="margin: 0 0 5px 0;"><strong>Data de Emissão:</strong> ${dataEmissao}</p>
                <p style="margin: 0;"><strong>Data da Operação:</strong> ${dataEmissao}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th class="text-right">Qtd.</th>
                  <th class="text-right">Taxa IVA</th>
                  <th class="text-right">Valor Base</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Serviços de Alojamento e Cuidados Caninos</td>
                  <td class="text-right">1</td>
                  <td class="text-right">23%</td>
                  <td class="text-right">${valorBase.toFixed(2)} €</td>
                </tr>
              </tbody>
            </table>

            <div class="totals-section">
              <div class="totals-box">
                <div class="totals-line">
                  <span>Total Ilíquido:</span>
                  <span>${valorBase.toFixed(2)} €</span>
                </div>
                <div class="totals-line">
                  <span>Total IVA (23%):</span>
                  <span>${valorIva.toFixed(2)} €</span>
                </div>
                <div class="totals-line bold">
                  <span>Total a Pagar:</span>
                  <span>${fatura.valorTotal.toFixed(2)} €</span>
                </div>
                <p style="margin: 10px 0 0 0; font-size: 12px; text-align: right; color: #666;">
                  Método: ${fatura.metodoPagamento}
                </p>
              </div>
            </div>

            <div class="footer">
              <div>
                <p style="margin: 0 0 5px 0;"><strong>ATCUD:</strong> ${atcudSimulado}</p>
                <p style="margin: 0;">Fatura processada por programa certificado n.º 9999/AT.</p>
              </div>
              <div class="qr-mock">
                [QR CODE<br/>SIMULADO]
              </div>
            </div>

            <button class="print-btn" onclick="window.print()">🖨️ Imprimir Fatura</button>
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