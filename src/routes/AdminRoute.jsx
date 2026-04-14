import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { clearAuthData } from '../auth/authSession';


export default function AdminRoute() {
  const rawUser = localStorage.getItem('userLogado');

  if (!rawUser) {
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const user = JSON.parse(rawUser);
    const isAuthorized = user?.role === 'admin';

    if (!isAuthorized) {
      return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
  } catch {
    clearAuthData();
    return <Navigate to="/admin/login" replace />;
  }
}
