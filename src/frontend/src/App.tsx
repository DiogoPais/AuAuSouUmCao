import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PortalTutor from './pages/PortalTutor';     
import DiarioBordoPage from './pages/DiarioBordoPage'; 
import MarcacoesPage from './pages/MarcacoesPage';
import RececaoPage from './pages/RececaoPage';
import StaffPage from './pages/StaffPage';
import VeterinariaPage from './pages/VeterinariaPage';
import GatewayGestoraPage from './pages/GatewayGestoraPage';
import GestoraPage from './pages/GestoraPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/criar-conta" element={<RegisterPage />} />
        
        {/* ROTAS DO TUTOR */}
        <Route path="/tutor" element={<PortalTutor />} />
        <Route path="/tutor/marcacoes" element={<MarcacoesPage />} />
        
        {/* NOVA ROTA DINÂMICA: Agora aceita o ID do animal! */}
        <Route path="/tutor/diario/:idAnimal" element={<DiarioBordoPage />} />
        <Route path="/rececao" element={<RececaoPage />} />
        <Route path="/staff" element={<StaffPage/>}/>
        <Route path="/vet" element={<VeterinariaPage/>}/>
        {/* ROTA DA GATEWAY DA GESTORA */}
        <Route path="/admin-gateway" element={<GatewayGestoraPage />} />
        {/* ROTA DO PAINEL DA GESTORA (Que vamos construir de seguida) */}
        <Route path="/gestao" element={<GestoraPage />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;