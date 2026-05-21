import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Plus, Trash2, Check, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './MarcacoesPage.css';

interface Animal {
  idAnimal: string;
  nome: string;
  raca: string;
  reatividade: string;
  microchip: string;
  estado: string;
  tutorNif: string;
  boletimVacinasUrl?: string;
  tipoTrela?: string; // NOVO
  racaoId?: string;   // NOVO
  doseDiaria?: number;// NOVO
}

interface Reserva {
  idReserva: string;
  dataEntrada: string;
  dataSaida: string;
  estado: string;
  animalId: string;
  animal: Animal;
}

const MarcacoesPage: React.FC = () => {
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const [dataEntrada, setDataEntrada] = useState<string>(formatDate(today));
  const [dataSaida, setDataSaida] = useState<string>(() => {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  });
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [animalSelecionado, setAnimalSelecionado] = useState<Animal | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarNovoFormulario, setMostrarNovoFormulario] = useState(false);

  // NOVO ESTADO: Para guardar as rações do armazém
  const [racoes, setRacoes] = useState<any[]>([]);

  // Estados para novo animal
  const [vacinasFile, setVacinasFile] = useState<File | null>(null);
  const [racaCustomizada, setRacaCustomizada] = useState('');
  
  // Estados para serviços na reserva
  const [banhos, setBanhos] = useState<number>(0);
  const [tosquias, setTosquias] = useState<number>(0);
  const [passeios, setPasseios] = useState<number>(0);

  // Dados do utilizador autenticado
  const utilizador = {
    nome: localStorage.getItem('user_nome') || 'Utilizador',
    nif: localStorage.getItem('user_nif') || '---',
    telemovel: localStorage.getItem('user_telemovel') || '---',
    perfil: localStorage.getItem('role') || 'Tutor',
  };

  // Carregar animais, reservas e stock ao montar
  useEffect(() => {
    const fetchDados = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        const resAnimais = await axios.get(`${API_URL}/api/animais`);
        setAnimais(resAnimais.data);

        const resReservas = await axios.get(`${API_URL}/api/reservas`);
        setReservas(resReservas.data);

        // Buscar stock para preencher o dropdown de Ração
        const resStock = await axios.get(`${API_URL}/api/stock`);
        // Filtra apenas o que é ração (pela herança ou pelo nome)
        const apenasRacoes = resStock.data.filter((item: any) => item.racao || item.nome.toLowerCase().includes('ração') || item.nome.toLowerCase().includes('racao'));
        setRacoes(apenasRacoes);

      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, []);

  // Formulário para novo animal
  const [novoAnimal, setNovoAnimal] = useState<Animal>({
    idAnimal: '',
    nome: '',
    raca: '',
    reatividade: '',
    microchip: '',
    estado: 'Saudavel',
    tutorNif: utilizador.nif,
    boletimVacinasUrl: '',
    tipoTrela: 'Normal', // Valores por defeito
    racaoId: '',
    doseDiaria: 0,
  });

  const handleNovoAnimalChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNovoAnimal({ ...novoAnimal, [name]: name === 'doseDiaria' ? Number(value) : value });
  };

  const adicionarAnimal = async () => {
    if (!novoAnimal.nome || !novoAnimal.raca || !novoAnimal.reatividade) {
      alert('Por favor, preencha os campos obrigatórios!');
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const finalRaca = novoAnimal.raca === 'Outros' ? racaCustomizada : novoAnimal.raca;
      
      const formData = new FormData();
      formData.append('nome', novoAnimal.nome);
      formData.append('raca', finalRaca);
      formData.append('reatividade', novoAnimal.reatividade);
      formData.append('tutorNif', utilizador.nif);
      formData.append('microchip', novoAnimal.microchip || '');
      formData.append('estado', novoAnimal.estado);
      
      // NOVOS CAMPOS ENVIADOS PARA O BACKEND
      formData.append('tipoTrela', novoAnimal.tipoTrela || 'Normal');
      if (novoAnimal.racaoId) formData.append('racaoId', novoAnimal.racaoId);
      if (novoAnimal.doseDiaria) formData.append('doseDiaria', novoAnimal.doseDiaria.toString());

      if (vacinasFile) {
        formData.append('vacinasFile', vacinasFile);
      }

      const res = await axios.post(`${API_URL}/api/animais`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAnimais([...animais, res.data]);
      setAnimalSelecionado(res.data);
      setMostrarNovoFormulario(false);
      setNovoAnimal({
        idAnimal: '', nome: '', raca: '', reatividade: '', microchip: '', estado: 'Saudavel', tutorNif: utilizador.nif, boletimVacinasUrl: '', tipoTrela: 'Normal', racaoId: '', doseDiaria: 0
      });
      setRacaCustomizada('');
      setVacinasFile(null);
    } catch (err) {
      console.error('Erro ao adicionar animal:', err);
      alert('Erro ao adicionar animal!');
    }
  };

  const animaisTutor = animais.filter((a) => a.tutorNif === utilizador.nif);

  // Calcular preço total
  const calcularPreco = () => {
    const entrada = new Date(dataEntrada);
    const saida = new Date(dataSaida);
    const dias = (saida.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24);
    
    const precoEstadia = dias * 20; 
    const precoBanhos = banhos * 20; 
    const precoTosquias = tosquias * 10; 
    const precoPasseios = passeios * 10; 
    
    return precoEstadia + precoBanhos + precoTosquias + precoPasseios;
  };

  const criarReserva = async () => {
    if (!dataEntrada || !dataSaida || !animalSelecionado) {
      alert('Por favor, selecione o intervalo e o animal!');
      return;
    }

    if (new Date(dataSaida) <= new Date(dataEntrada)) {
      alert('A data de saída deve ser posterior à data de entrada.');
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const res = await axios.post(`${API_URL}/api/reservas`, {
        dataEntrada,
        dataSaida,
        idAnimal: animalSelecionado.idAnimal,
        banhos: banhos,
        tosquias: tosquias,
        passeios: passeios,
        valor: calcularPreco()
      });

      setReservas([...reservas, res.data]);
      alert('Reserva criada com sucesso!');
      setAnimalSelecionado(null);
      setBanhos(0);
      setTosquias(0);
      setPasseios(0);
    } catch (err: any) {
      console.error('Erro ao criar reserva:', err);
      const mensagem = err?.response?.data?.error || 'Erro ao criar reserva!';
      alert(mensagem);
    }
  };

  const apagarReserva = async (idReserva: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.patch(`${API_URL}/api/reservas/${idReserva}/cancelar`);
      setReservas(reservas.filter((r) => r.idReserva !== idReserva));
      alert('Reserva cancelada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao eliminar reserva:', err);
      alert(err.response?.data?.error || 'Erro ao cancelar reserva!');
    }
  };

  const datanormal = (data: string) => {
    const d = new Date(data);
    return d.toLocaleDateString('pt-PT');
  }

  const reservasProprias = reservas.filter((r) => 
    r.animal.tutorNif === utilizador.nif && 
    (r.estado === 'Pendente' || r.estado === 'CheckIn')
  );

  const countReservas = reservas.filter((r) => {
    const entrada = new Date(r.dataEntrada);
    const saida = new Date(r.dataSaida);
    const selecionadaEntrada = new Date(dataEntrada);
    const selecionadaSaida = new Date(dataSaida);
    
    return (
        (entrada >= selecionadaEntrada && entrada < selecionadaSaida) ||
        (saida > selecionadaEntrada && saida <= selecionadaSaida) ||
        (entrada <= selecionadaEntrada && saida >= selecionadaSaida)
    );
  }).length;

  const calcularMaxAdicionais = () => {
    const entrada = new Date(dataEntrada);
    const saida = new Date(dataSaida);
    const dias = (saida.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24);
    return Math.ceil(dias); 
  };


  if (loading) {
    return (
      <div className="marcacoes-page-container">
        <Header userData={utilizador} />
        <div className="loading">Carregando...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="marcacoes-page-container">
      <Header userData={utilizador} />

      <main className="marcacoes-main">
        <div>
          <h1 className="page-title">Minhas Marcações</h1>
        </div>
        <div className="marcacoes-content">
          <section className="secao-calendario">
            <h2>
              <Calendar size={24} /> Selecione a Data
            </h2>

            <div className="calendario-container">
              <div className="date-range-row">
                <div>
                  <label>Entrada</label>
                  <input type="date" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} className="date-input" />
                </div>
                <div>
                  <label>Saída</label>
                  <input type="date" value={dataSaida} onChange={(e) => setDataSaida(e.target.value)} className="date-input" min={dataEntrada} />
                </div>
              </div>
              <p className="data-selecionada">
                Intervalo: <strong>{new Date(dataEntrada).toLocaleDateString('pt-PT')} - {new Date(dataSaida).toLocaleDateString('pt-PT')}</strong>
              </p>
            </div>

            <div className="marcacoes-do-dia">
              <h3>Reservas neste intervalo - {countReservas}</h3>

              <h3>Reservas Minhas</h3>
              {reservasProprias.length > 0 ? (
                <ul className="marcacoes-lista">
                  {reservasProprias.map((reserva) => (
                    <li key={reserva.idReserva} className="marcacao-item">
                      <div>
                        <span>{reserva.animal.nome}</span>
                        <p className="estado-reserva">{reserva.estado}</p>
                        <p className="reserva-descricao">Data Entrada: {datanormal(reserva.dataEntrada)} e Data Saida: {datanormal(reserva.dataSaida)}</p>
                      </div>
                      <button onClick={() => apagarReserva(reserva.idReserva)} className="btn-apagar">
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-marcacoes">Sem reservas para este dia</p>
              )}
            </div>
          </section>

          <section className="secao-cao">
            <h2>
              <Plus size={24} /> Selecione ou Adicione um Animal
            </h2>

            <div className="cao-selector">
              <h3>Animais Registados</h3>
              {animaisTutor.length > 0 ? (
                <div className="caos-grid">
                  {animaisTutor.map((animal) => (
                    <div
                      key={animal.idAnimal}
                      className={`cao-card ${animalSelecionado?.idAnimal === animal.idAnimal ? 'ativo' : ''}`}
                      onClick={() => setAnimalSelecionado(
                        animalSelecionado?.idAnimal === animal.idAnimal ? null : animal
                      )}
                    >
                      <div className="cao-card-header">
                        <h4>{animal.nome}</h4>
                        {animalSelecionado?.idAnimal === animal.idAnimal && (
                          <Check size={20} className="check-icon" />
                        )}
                      </div>
                      <p><strong>Raça:</strong> {animal.raca}</p>
                      <p><strong>Trela Recom.:</strong> {animal.tipoTrela || 'Normal'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-caos">Nenhum animal registado</p>
              )}
            </div>

            <button className="btn-adicionar-cao" onClick={() => setMostrarNovoFormulario(!mostrarNovoFormulario)}>
              <Plus size={18} /> Adicionar Novo Animal
            </button>

            {/* FORMULÁRIO ATUALIZADO */}
            {mostrarNovoFormulario && (
              <form className="novo-cao-form">
                <h3>Registar Novo Animal</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nome do Animal *</label>
                    <input type="text" name="nome" value={novoAnimal.nome} onChange={handleNovoAnimalChange} placeholder="ex: Bobby" required />
                  </div>
                  <div className="form-group">
                    <label>Raça *</label>
                    <select name="raca" value={novoAnimal.raca} onChange={handleNovoAnimalChange} required>
                      <option value="">Selecione a raça</option>
                      <option value="Labrador">Labrador</option>
                      <option value="Pastor Alemão">Pastor Alemão</option>
                      <option value="Golden Retriever">Golden Retriever</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                {novoAnimal.raca === 'Outros' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Especifique a Raça</label>
                      <input type="text" value={racaCustomizada} onChange={(e) => setRacaCustomizada(e.target.value)} placeholder="ex: Pinscher" />
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Reatividade *</label>
                    <select name="reatividade" value={novoAnimal.reatividade} onChange={handleNovoAnimalChange} required>
                      <option value="">Selecione</option>
                      <option value="Não Reativo">Não Reativo</option>
                      <option value="Reativo">Reativo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Microchip</label>
                    <input type="text" name="microchip" value={novoAnimal.microchip} onChange={handleNovoAnimalChange} placeholder="ex: 123456789" />
                  </div>
                </div>

                {/* AS 3 NOVAS PERGUNTAS */}
                <div className="form-row" style={{ backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <div className="form-group">
                    <label>Tipo de Trela Recomendada</label>
                    <select name="tipoTrela" value={novoAnimal.tipoTrela} onChange={handleNovoAnimalChange}>
                      <option value="Normal">Trela Normal</option>
                      <option value="Soft">Trela Soft (Pescoço Sensível)</option>
                      <option value="Peitoral">Peitoral / Arnês</option>
                      <option value="Halti">Halti / Cabresto</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Marca da Ração</label>
                    <select name="racaoId" value={novoAnimal.racaoId} onChange={handleNovoAnimalChange}>
                      <option value="">-- O cão traz a própria comida --</option>
                      {racoes.map(racao => (
                        <option key={racao.idItem} value={racao.idItem}>{racao.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Dose Diária (kg)</label>
                    <input type="number" step="0.1" min="0" name="doseDiaria" value={novoAnimal.doseDiaria} onChange={handleNovoAnimalChange} placeholder="ex: 0.3" disabled={!novoAnimal.racaoId} />
                  </div>
                </div>

                <div className="form-row form-row-full">
                  <div className="form-group">
                    <label>Boletim de Vacinas (PDF)</label>
                    <input type="file" accept=".pdf" onChange={(e) => setVacinasFile(e.target.files?.[0] || null)} />
                    {vacinasFile && <p className="file-info">✓ {vacinasFile.name}</p>}
                  </div>
                </div>

                <button type="button" onClick={adicionarAnimal} className="btn-confirmar">
                  Registar Animal
                </button>
              </form>
            )}

            {animalSelecionado && (
              <div className="detalhes-reserva-section">
                <h3>Confirmar Reserva para {animalSelecionado.nome}</h3>
                <p><strong>Período:</strong> {new Date(dataEntrada).toLocaleDateString('pt-PT')} até {new Date(dataSaida).toLocaleDateString('pt-PT')}</p>
                <p><strong>Raça:</strong> {animalSelecionado.raca}</p>
                <p><strong>Reatividade:</strong> {animalSelecionado.reatividade}</p>
                
                <div className="servicos-section">
                  <h4>Serviços Adicionais</h4>
                  <div className="form-group">
                    <label>Banhos (€20 cada)</label>
                    <input type="number" min="0" max={calcularMaxAdicionais()} value={banhos} onChange={(e) => setBanhos(Math.max(0, parseInt(e.target.value) || 0))} className="quantity-input" />
                  </div>
                  <div className="form-group">
                    <label>Tosquias (€10 cada)</label>
                    <input type="number" min="0" max={calcularMaxAdicionais()} value={tosquias} onChange={(e) => setTosquias(Math.max(0, parseInt(e.target.value) || 0))} className="quantity-input" />
                  </div>
                  <div className="form-group">
                    <label>Passeios (€10 cada)</label>
                    <input type="number" min="0" max={calcularMaxAdicionais()*2} value={passeios} onChange={(e) => setPasseios(Math.max(0, parseInt(e.target.value) || 0))} className="quantity-input" />
                  </div>
                </div>

                <div className="preco-resumo">
                  <p><strong>Estadia:</strong> {((new Date(dataSaida).getTime() - new Date(dataEntrada).getTime()) / (1000 * 60 * 60 * 24)).toFixed(1)} dias × €20 = €{(((new Date(dataSaida).getTime() - new Date(dataEntrada).getTime()) / (1000 * 60 * 60 * 24)) * 20).toFixed(2)}</p>
                  <p><strong>Banhos:</strong> {banhos} × €20 = €{(banhos * 20).toFixed(2)}</p>
                  <p><strong>Tosquias:</strong> {tosquias} × €10 = €{(tosquias * 10).toFixed(2)}</p>
                  <p><strong>Passeios:</strong> {passeios} × €10 = €{(passeios * 10).toFixed(2)}</p>
                  <p className="preco-total"><strong>Total: €{calcularPreco().toFixed(2)}</strong></p>
                </div>

                <button onClick={criarReserva} className="btn-criar-marcacao">
                  Confirmar Reserva - €{calcularPreco().toFixed(2)}
                </button>
              </div>
            )}
          </section>
        </div>
        {/* BOTÃO DE VOLTAR ADICIONADO AQUI */}
        <div style={{ marginTop: '40px', padding: '20px 0', borderTop: '1px solid #eee' }}>
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
            <ArrowLeft size={18} /> Voltar à Página Anterior
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MarcacoesPage;