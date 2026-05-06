import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AuthPages.css';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [is2FA, setIs2FA] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false); // Pode ser usado para mostrar um spinner ou desabilitar botões durante requisições
  const isSubmitting = useRef(false);


  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting.current) return;

    isSubmitting.current = true; 
    setIsLoading(true);
    try {
      // Mandamos só Email e Password
      const resposta = await axios.post(`${API_URL}/api/login`, { username, password });
      
      if (resposta.data.requires2FA) {
        setIs2FA(true);
        setEmail(resposta.data.email);
        alert(resposta.data.message);
        return;
      }
      
      // Extraímos também os dados do utilizador que o backend vai enviar
      const { token, role, message, nome, nif, telemovel, userId } = resposta.data;
      
      alert(message); 
      localStorage.setItem('token', token);
      localStorage.setItem('role', role); 
      
      // Guardamos os dados pessoais para o cabeçalho
      localStorage.setItem('user_nome', nome || '');
      localStorage.setItem('user_nif', nif || '');
      localStorage.setItem('user_telemovel', telemovel || '');
      localStorage.setItem('user_id', userId || '');
      
      // O REDIRECIONAMENTO AUTOMÁTICO MÁGICO!
      if (role === 'Admin') {
        navigate('/admin-gateway')
      } else if (role === 'Staff') {
        navigate('/staff');
      } else if (role === 'Vet') {
        navigate('/vet')
      } else if (role === 'Rececao') { // <-- ADICIONA ISTO
        navigate('/rececao');
      } else {
        navigate('/tutor'); 
      }
    } catch (erro: any) {
      alert(erro.response?.data?.error || 'Erro ao tentar iniciar sessão.');
    }
    finally {
      isSubmitting.current = false;
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting.current) return;
    isSubmitting.current = true; 

    if (isLoading) return;
      setIsLoading(true);

    try {
      const resposta = await axios.post(`${API_URL}/api/verify-2fa`, { email, code });
      
      const { token, role, message, nome, nif, telemovel, userId } = resposta.data;
      
      alert(message); 
      localStorage.setItem('token', token);
      localStorage.setItem('role', role); 
      
      // Guardamos os dados pessoais para o cabeçalho
      localStorage.setItem('user_nome', nome || '');
      localStorage.setItem('user_nif', nif || '');
      localStorage.setItem('user_telemovel', telemovel || '');
      localStorage.setItem('user_id', userId || '');
      
      // O REDIRECIONAMENTO AUTOMÁTICO MÁGICO!
      if (role === 'Admin') {
        navigate('/gestao');
      } else if (role === 'Staff') {
        navigate('/staff');
      } else if (role === 'Vet') {
        navigate('/vet')
      } else if (role === 'Rececao') { // <-- ADICIONA ISTO
        navigate('/rececao');
      } else {
        navigate('/tutor'); 
      }
    } catch (erro: any) {
      alert(erro.response?.data?.error || 'Código inválido.');
    }
    finally {
      isSubmitting.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Header title="Página de LOGIN" />

      <section className="auth-main-section center-card">
        {!is2FA ? (
          <form className="auth-form-card" style={{ maxWidth: '450px' }} onSubmit={handleLogin}>
            <h2>Iniciar Sessão</h2>
            
            <label>Email:</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            
            <label>Password:</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            
            <div className="form-buttons center-btn">
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                {isLoading ? 'A processar...' : 'Login'}
              </button>
            </div>
            <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '13px' }}>
              Ainda não tem conta? <span style={{ color: '#7DDFD3', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate('/criar-conta')}>Registe-se aqui</span>
            </p>
          </form>
        ) : (
          <form className="auth-form-card" style={{ maxWidth: '450px' }} onSubmit={handleVerify2FA}>
            <h2>Verificação 2FA</h2>
            <p>Insira o código de 5 dígitos enviado para {email}</p>
            
            <label>Código:</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} required maxLength={5} />
            
            <div className="form-buttons center-btn">
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Verificar</button>
            </div>
            <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '13px' }}>
              <span style={{ color: '#7DDFD3', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setIs2FA(false); setCode(''); }}>Voltar ao Login</span>
            </p>
          </form>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default LoginPage;