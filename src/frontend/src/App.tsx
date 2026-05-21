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
import MinhasFaturasPage from './pages/MinhasFaturasPage'; 

// Importa o novo segurança das rotas!
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================== */}
        {/* ROTAS PÚBLICAS (Acesso Livre)              */}
        {/* ========================================== */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/criar-conta" element={<RegisterPage />} />
        
        {/* ========================================== */}
        {/* ZONA EXCLUSIVA: TUTOR                      */}
        {/* ========================================== */}
        <Route element={<ProtectedRoute allowedRoles={['Tutor']} />}>
          <Route path="/tutor" element={<PortalTutor />} />
          <Route path="/tutor/marcacoes" element={<MarcacoesPage />} />
          <Route path="/tutor/diario/:idAnimal" element={<DiarioBordoPage />} />
          <Route path="/tutor/faturas" element={<MinhasFaturasPage />} />
        </Route>

        {/* ========================================== */}
        {/* ZONA EXCLUSIVA: RECEÇÃO (& GESTORA)        */}
        {/* ========================================== */}
        <Route element={<ProtectedRoute allowedRoles={['Rececao', 'Admin', 'Gestora']} />}>
          <Route path="/rececao" element={<RececaoPage />} />
        </Route>

        {/* ========================================== */}
        {/* ZONA EXCLUSIVA: STAFF (& GESTORA)          */}
        {/* ========================================== */}
        <Route element={<ProtectedRoute allowedRoles={['Staff', 'Admin', 'Gestora']} />}>
          <Route path="/staff" element={<StaffPage/>}/>
        </Route>

        {/* ========================================== */}
        {/* ZONA EXCLUSIVA: VETERINÁRIA (& GESTORA)    */}
        {/* ========================================== */}
        <Route element={<ProtectedRoute allowedRoles={['Vet', 'Admin', 'Gestora']} />}>
          <Route path="/vet" element={<VeterinariaPage/>}/>
        </Route>

        {/* ========================================== */}
        {/* ZONA EXCLUSIVA: GESTORA (ADMINISTRADOR)    */}
        {/* ========================================== */}
        <Route element={<ProtectedRoute allowedRoles={['Admin', 'Gestora']} />}>
          <Route path="/admin-gateway" element={<GatewayGestoraPage />} />
          <Route path="/gestao" element={<GestoraPage />} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;