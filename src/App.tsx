import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CycleTracking } from './components/CycleTracking';
import { MentalWellness } from './components/MentalWellness';
import { Medications } from './components/Medications';
import { FamilyCare } from './components/FamilyCare';
import { LifestyleCoach } from './components/LifestyleCoach';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { EmergencySupport } from './components/EmergencySupport';

type Page =
  | 'dashboard'
  | 'cycles'
  | 'wellness'
  | 'medications'
  | 'family'
  | 'lifestyle'
  | 'analytics'
  | 'emergency';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-500 to-teal-500 animate-pulse" />
          <p className="text-gray-600">Loading FemCare AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={(page) => setCurrentPage(page as Page)} />;
      case 'cycles':
        return <CycleTracking />;
      case 'wellness':
        return <MentalWellness />;
      case 'medications':
        return <Medications />;
      case 'family':
        return <FamilyCare />;
      case 'lifestyle':
        return <LifestyleCoach />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'emergency':
        return <EmergencySupport />;
      default:
        return <Dashboard onNavigate={(page) => setCurrentPage(page as Page)} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
