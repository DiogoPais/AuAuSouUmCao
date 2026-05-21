import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './PortalTutor.css';

interface Animal {
    idAnimal: string;
    nome: string;
    estado: string;
    tutorNif: string;
}

interface Reserva {
    idReserva: string;
    estado: string;
    animalId: string;
    animal: Animal;
    dataEntrada: string;
    dataSaida: string;
}

const PortalTutor: React.FC = () => {
    const [reservasAtivas, setReservasAtivas] = useState<Reserva[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    const utilizador = {
        nome: localStorage.getItem('user_nome') || "Utilizador",
        nif: localStorage.getItem('user_nif') || "---",
        telemovel: localStorage.getItem('user_telemovel') || "---",
        perfil: localStorage.getItem('role') || "Tutor"
    };

    useEffect(() => {
        const fetchDados = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                const res = await axios.get(`${API_URL}/api/reservas`);
                const todasAsReservas: Reserva[] = res.data;

                const filtradas = todasAsReservas.filter(r => 
                    r.animal.tutorNif === utilizador.nif && 
                    r.estado === 'CheckIn'
                );

                setReservasAtivas(filtradas);
            } catch (err) {
                console.error('Erro ao carregar dados:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDados();
    }, [utilizador.nif]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
            <Header userData={utilizador} />

            <div style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '40px', fontSize: '28px' }}>
                    Bem-vindo ao seu Portal, {utilizador.nome}
                </h1>

                {/* GRELHA DE 3 COLUNAS */}
                <main style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                    gap: '30px' 
                }}>
                    
                    {/* CARD 1: Marcações */}
                    <div 
                        onClick={() => navigate('/tutor/marcacoes')} 
                        style={{ 
                            background: '#fff', borderRadius: '12px', padding: '30px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer', 
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            transition: 'transform 0.2s', border: '1px solid #eee'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <h2 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '20px' }}>Marcações e Reservas</h2>
                        <img 
                          src="https://img.freepik.com/free-vector/appointment-booking-with-calendar_23-2148556782.jpg" 
                          alt="Reservas" 
                          style={{ width: '100%', maxWidth: '220px', objectFit: 'contain' }}
                        />
                        <p style={{ color: '#666', textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
                            Agende a próxima estadia do seu patudo connosco.
                        </p>
                    </div>

                    {/* CARD 2: Faturas */}
                    <div 
                        onClick={() => navigate('/tutor/faturas')} 
                        style={{ 
                            background: '#fff', borderRadius: '12px', padding: '30px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer', 
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            transition: 'transform 0.2s', border: '1px solid #eee'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <h2 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '20px' }}>Faturas e Recibos</h2>
                        <img 
                          src="https://img.freepik.com/free-vector/receipt-concept-illustration_114360-1896.jpg" 
                          alt="Faturas" 
                          style={{ width: '100%', maxWidth: '220px', objectFit: 'contain' }}
                        />
                        <p style={{ color: '#666', textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
                            Consulte e imprima o seu histórico de pagamentos.
                        </p>
                    </div>

                    {/* CARD 3: Hóspedes Ativos (Diário) */}
                    <div style={{ 
                        background: '#fff', borderRadius: '12px', padding: '30px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eee',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <h2 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '20px', textAlign: 'center' }}>
                            Diário de Bordo (Ativos)
                        </h2>
                        
                        {loading ? (
                            <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>A verificar estadias...</p>
                        ) : reservasAtivas.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                                {reservasAtivas.map(reserva => (
                                    <div 
                                        key={reserva.idReserva} 
                                        onClick={() => navigate(`/tutor/diario/${reserva.animalId}`)}
                                        style={{ 
                                            padding: '15px', borderRadius: '8px', cursor: 'pointer', 
                                            border: '1px solid #7DDFD3', background: '#f0fdfa',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#e6fcf5'}
                                        onMouseOut={(e) => e.currentTarget.style.background = '#f0fdfa'}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1A1A1A' }}>
                                                {reserva.animal.nome}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#555' }}>
                                                Saída: {new Date(reserva.dataSaida).toLocaleDateString('pt-PT')}
                                            </span>
                                            <span style={{ fontSize: '13px', color: '#27AE60', fontWeight: 'bold', marginTop: '5px' }}>
                                                Ver Diário ➜
                                            </span>
                                        </div>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27AE60' }}></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', marginTop: '30px', padding: '0 10px' }}>
                                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1A1A1A' }}>Nenhum patudo no hotel.</p>
                                <p style={{ fontSize: '13px', color: '#666', marginTop: '10px', lineHeight: '1.5' }}>
                                    O diário de bordo ficará disponível aqui assim que o check-in for realizado na receção.
                                </p>
                            </div>
                        )}
                    </div>

                </main>
            </div>

            <Footer />
        </div>
    );
};

export default PortalTutor;