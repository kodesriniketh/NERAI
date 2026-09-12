import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import Login from '../pages/Login/Login';
import Admin from '../pages/Admin/Admin';
import Transport from '../pages/Transport/Transport';
import Field from '../pages/Field/Field';
import Disaster from '../pages/Disaster/Disaster';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="ADMIN">
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="/transport" element={
            <ProtectedRoute requiredRole="TRANSPORT_MANAGER">
              <Transport />
            </ProtectedRoute>
          } />
          <Route path="/field" element={
            <ProtectedRoute requiredRole="FIELD_OFFICIAL">
              <Field />
            </ProtectedRoute>
          } />
          <Route path="/disaster" element={
            <ProtectedRoute requiredRole="DISASTER_OFFICIAL">
              <Disaster />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
