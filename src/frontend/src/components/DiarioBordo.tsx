import { useState, useEffect } from 'react';
import axios from 'axios';

// 1. Tipagem exata do que o Backend nos vai enviar
interface RegistoDiario {
    dataHora: string;
    descricao: string;
    fotoUrl: string;
}

interface HistorialAnimal {
    idAnimal: string;
    nome: string;
    estadoClinico: string;
    diarioBordo: RegistoDiario[];
}

export default function DiarioBordo() {
    // 2. Estados do Componente
    const [historial, setHistorial] = useState<HistorialAnimal | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [erro, setErro] = useState<string | null>(null);

    // 3. Fazer o pedido à API quando o componente aparece no ecrã
    useEffect(() => {
        const fetchHistorial = async () => {
            try {
                // Pedido GET ao nosso servidor Express
                const resposta = await axios.get('http://localhost:3000/api/animais/A-789/historial');
                setHistorial(resposta.data);
                setLoading(false);
            } catch (err) {
                setErro('Não foi possível carregar o diário. Verifica se o backend está a correr!');
                setLoading(false);
            }
        };

        fetchHistorial();
    }, []);

    // 4. Interface (UI) dependendo do estado
    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>A carregar Diário de Bordo do hóspede... 🐾</div>;
    if (erro) return <div style={{ color: 'red', padding: '20px' }}>{erro}</div>;
    if (!historial) return null;

    // 5. O Ecrã Principal (Estilo Mobile-First)
    return (
        <div style={{ maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh', border: '1px solid #e5e7eb' }}>
            {/* Cabeçalho */}
            <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '20px', textAlign: 'center' }}>
                <h2 style={{ margin: 0 }}>Diário de {historial.nome}</h2>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>Estado: {historial.estadoClinico}</p>
            </div>

            {/* Timeline */}
            <div style={{ padding: '20px' }}>
                {historial.diarioBordo.map((registo, index) => (
                    <div key={index} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '15px' }}>
                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#1f2937' }}>
                            {new Date(registo.dataHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        
                        {/* Simulação da imagem */}
                        <div style={{ width: '100%', height: '150px', backgroundColor: '#d1d5db', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                            <span style={{ color: '#4b5563' }}>📸 Imagem do Passeio</span>
                        </div>
                        
                        <p style={{ margin: 0, color: '#4b5563' }}>{registo.descricao}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}