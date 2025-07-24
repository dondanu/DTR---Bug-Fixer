import React, { useState } from 'react';
import DashboardScreen from './src/components/DashboardScreen';
import Profile from './src/components/Profile';
import LoginScreen from './src/components/LoginScreen';
import ProjectDetailScreen from './src/components/ProjectDetailScreen';

type Screen = 'dashboard' | 'profile' | 'project';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedProject, setSelectedProject] = useState<{id: number, name: string} | null>(null);

  // Handle login
  const handleLogin = (email: string, password: string) => {
    setUserEmail(email);
    setIsLoggedIn(true);
    setCurrentScreen('dashboard');
  };

  // Handle logout (from anywhere)
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    setCurrentScreen('dashboard');
    setSelectedProject(null);
  };

  // Handle project selection
  const handleProjectPress = (projectId: number, projectName: string) => {
    console.log(`🎯 Navigating to project: ${projectName} (ID: ${projectId})`);
    setSelectedProject({ id: projectId, name: projectName });
    setCurrentScreen('project');
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentScreen === 'profile') {
    return (
      <Profile
        userEmail={userEmail}
        onDashboardPress={() => setCurrentScreen('dashboard')}
        onLogoutPress={handleLogout}
        onProfilePress={() => setCurrentScreen('profile')}
      />
    );
  }

  if (currentScreen === 'project' && selectedProject) {
    return (
      <ProjectDetailScreen
        projectId={selectedProject.id}
        projectName={selectedProject.name}
        onDashboardPress={() => setCurrentScreen('dashboard')}
        onProfilePress={() => setCurrentScreen('profile')}
        onLogoutPress={handleLogout}
      />
    );
  }

  const profileFunction = () => {
    setCurrentScreen('profile');
  };

  return (
    <DashboardScreen
      onProfilePress={profileFunction}
      onLogoutPress={handleLogout}
      onProjectPress={handleProjectPress}
    />
  );
};

export default App;