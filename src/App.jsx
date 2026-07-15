import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import SubjectDetail from './pages/SubjectDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="subject/:id" element={<SubjectDetail />} />
      </Route>
    </Routes>
  );
}

export default App;
