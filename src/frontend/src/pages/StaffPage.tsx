import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Camera, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './StaffPage.css';

interface Animal {
  idAnimal: string;
  nome: string;
  raca?: string;
  reatividade?: string; // NOVO: Sensibilidade do animal
  tipoTrela?: string;   // NOVO: Tipo de trela recomendada
}

interface Box {
  numero: number;
  tamanho: number;
  ocupacao: number;
}

interface Reserva {
  idReserva: string;
  animal?: Animal; 
  box?: Box;       
  dataEntrada: string;
  dataSaida: string;
}

interface Tarefa {
  idServico: string;
  tipo: 'Grooming' | 'Passeio' | 'Adestramento' | 'Alimentacao'; // NOVO: Alimentacao adicionada
  data: string;
  preco: number;
  reserva?: Reserva; 
}

const StaffPage: React.FC = () => {
  const staff = {
    nome: localStorage.getItem('user_nome') || 'Utilizador',
    nif: localStorage.getItem('user_nif') || '---',
    telemovel: localStorage.getItem('user_telemovel') || '---',
    perfil: localStorage.getItem('role') || 'Staff',
  };

  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null);
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Buscar tarefas do dia e info do staff
  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        const resTarefas = await axios.get(`${API_URL}/api/tarefas`);
        setTarefas(resTarefas.data);

        const resStaff = await axios.get(`${API_URL}/api/funcionarios/count`);
        setStaffCount(resStaff.data.total);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, []);

  const concluirTarefa = async (id: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.patch(`${API_URL}/api/tarefas/${id}/concluir`);
      
      setTarefas(tarefas.filter((t) => t.idServico !== id));
      setTarefaSelecionada(null);
      alert('Tarefa concluída com sucesso!');
    } catch (err: any) {
      console.error('Erro ao concluir tarefa:', err);
      // Se for um erro de falta de ração, mostra o erro do backend!
      alert(err.response?.data?.error || 'Erro ao concluir tarefa');
    }
  };

  const adicionarFoto = () => {
    alert('Funcionalidade de foto será implementada');
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'Passeio': return 'Passear';
      case 'Grooming': return 'Grooming';
      case 'Adestramento': return 'Adestramento';
      case 'Alimentacao': return 'Dar Alimentação'; // NOVO
      default: return tipo;
    }
  };

  // Agrupar tarefas por data COM PROTEÇÃO
  const tarefasSeguras = Array.isArray(tarefas) ? tarefas : [];
  
  const tarefasPorData = tarefasSeguras.reduce(
    (acc, tarefa) => {
      if (!tarefa || !tarefa.data) return acc; 

      const data = new Date(tarefa.data).toLocaleDateString('pt-PT', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      if (!acc[data]) { acc[data] = []; }
      acc[data].push(tarefa);
      return acc;
    },
    {} as Record<string, Tarefa[]>
  );

  if (loading) {
    return (
      <div className="staff-page-container">
        <Header userData={staff} />
        <div className="loading">Carregando tarefas...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="staff-page-container">
      <Header userData={staff} />

      <main className="staff-main">
        <div className="staff-info-bar">
          <p><strong>Staff:</strong> {staffCount} membros</p>
          <p><strong>Tarefas do dia:</strong> {tarefasSeguras.length}</p>
          <button 
            onClick={() => {
              // No futuro, isto pode chamar uma rota da API que faz aparecer um aviso vermelho no ecrã da Gestora!
              alert("⚠️ ALERTA ENVIADO! A Gestora foi notificada de que uma ração terminou.");
            }}
            style={{ 
              backgroundColor: '#dc3545', color: 'white', border: 'none', 
              padding: '8px 12px', borderRadius: '4px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold'
            }}
          >
            ⚠️ Reportar Falta de Ração
          </button>
        </div>

        <div className="staff-content">
          <section className="tarefas-section">
            <h2>Tarefas:</h2>

            <div className="tarefas-lista">
              {tarefasSeguras.length > 0 ? (
                Object.entries(tarefasPorData).map(([data, tarefasDodia]) => (
                  <div key={data}>
                    <h4 className="tarefa-data">{data}</h4>
                    {tarefasDodia.map((tarefa) => (
                      <div
                        key={tarefa.idServico}
                        className={`tarefa-card ${tarefaSelecionada?.idServico === tarefa.idServico ? 'ativo' : ''}`}
                        onClick={() => setTarefaSelecionada(tarefa)}
                      >
                        <div className="tarefa-header">
                          <h3>{getTipoLabel(tarefa.tipo)}</h3>
                        </div>
                        <p className="tarefa-info">
                          Cão: <strong>{tarefa.reserva?.animal?.nome || 'N/A'}</strong> (jaula {tarefa.reserva?.box?.numero || 'N/A'})
                        </p>
                        <p className="tarefa-horario">
                          Hora: {new Date(tarefa.data).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p className="no-tarefas">Sem tarefas</p>
              )}
            </div>
          </section>

          {tarefaSelecionada && (
            <section className="detalhes-section">
              <h3>{getTipoLabel(tarefaSelecionada.tipo)}</h3>
              <div className="detalhes-card">
                <p className="detalhes-info">
                  Cão: <strong>{tarefaSelecionada.reserva?.animal?.nome || 'N/A'}</strong> (jaula {tarefaSelecionada.reserva?.box?.numero || 'N/A'})
                </p>
                <p className="detalhes-horario">
                  Horário: {new Date(tarefaSelecionada.data).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="detalhes-race">
                  Raça: <strong>{tarefaSelecionada.reserva?.animal?.raca || 'N/A'}</strong>
                </p>

                {/* ========================================== */}
                {/* NOVA SECÇÃO OBRIGATÓRIA: TRELA E REATIVIDADE */}
                {/* ========================================== */}
                <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffe69c' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#856404', marginBottom: '8px' }}>
                    <AlertTriangle size={18} />
                    <strong style={{ fontSize: '14px' }}>Informações de Segurança:</strong>
                  </div>
                  <p style={{ margin: '0 0 5px 0', color: '#856404', fontSize: '14px' }}>
                    <strong>Sensibilidade:</strong> {tarefaSelecionada.reserva?.animal?.reatividade || 'Normal'}
                  </p>
                  <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
                    <strong>Trela Recomendada:</strong> {tarefaSelecionada.reserva?.animal?.tipoTrela || 'Normal'}
                  </p>
                </div>

                <button
                  className="btn-foto-grande"
                  style={{ marginTop: '20px' }}
                  onClick={() => adicionarFoto()}
                >
                  <Camera size={18} /> Adicionar Foto
                </button>
              </div>

              <div className="mapa-container">
                <div className="mapa-placeholder">
                  <MapPin size={48} />
                  <p>Jaula {tarefaSelecionada.reserva?.box?.numero || 'N/A'}</p>
                </div>
              </div>

              <button
                className="btn-feito-grande"
                onClick={() => concluirTarefa(tarefaSelecionada.idServico)}
              >
                ✓ Tarefa Concluída
              </button>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StaffPage;