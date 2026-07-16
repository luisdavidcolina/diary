import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import SubjectDetail from './pages/SubjectDetail';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Finance from './pages/Finance';
import Lifestyle from './pages/Lifestyle';
import Journal from './pages/Journal';
import Library from './pages/Library';
import Calendar from './pages/Calendar';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Rutas Protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="subject/:id" element={<SubjectDetail />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="finance" element={<Finance />} />
          <Route path="lifestyle" element={<Lifestyle />} />
          <Route path="journal" element={<Journal />} />
          <Route path="library" element={<Library />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
