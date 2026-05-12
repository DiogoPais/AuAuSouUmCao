import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || '';

  // 1. Não tem token? Vai para a página de Login!
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. O perfil atual NÃO ESTÁ na lista de permitidos para esta rota?
  if (!allowedRoles.includes(role)) {
    
    // Expulsa o utilizador para a sua respetiva "casa"
    if (role === 'Tutor') return <Navigate to="/tutor" replace />;
    if (role === 'Admin' || role === 'Gestora') return <Navigate to="/admin-gateway" replace />;
    if (role === 'Vet') return <Navigate to="/vet" replace />;
    if (role === 'Rececao') return <Navigate to="/rececao" replace />;
    if (role === 'Staff') return <Navigate to="/staff" replace />;
    
    // Fallback de segurança se o perfil for desconhecido
    return <Navigate to="/" replace />;
  }

  // 3. Tudo OK! Renderiza a página pedida.
  return <Outlet />;
};

export default ProtectedRoute;