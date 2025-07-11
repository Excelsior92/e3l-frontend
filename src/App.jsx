import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import './App.css'
import MainLayout from './layouts/MainLayout'
import { Toaster } from 'react-hot-toast'
import ProfilePage from './components/Profile/ProfilePage'
import Dashboard from './components/Dashboard/Dashboard'
import 'katex/dist/katex.min.css';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />} />
        <Route path="/dashboard" element={<MainLayout showDashboard={true} />} />
        <Route path="/user-profile" element={<MainLayout showProfile={true} />} />
        <Route path="/settings" element={<MainLayout showProfile={true} />} />
        <Route path="/resources" element={<MainLayout showResources={true} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </Router>
  )
}

export default App