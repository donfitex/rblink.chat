import React from 'react';
import { ChatProvider } from './context/ChatContext';
import { AppLayout } from './components/layout/AppLayout';
import { AuthGate } from './auth/AuthGate';
import { RemindersRunner } from './auth/Reminders';

export const App: React.FC = () => {
  return (
    <AuthGate>
      <ChatProvider>
        <RemindersRunner />
        <AppLayout />
      </ChatProvider>
    </AuthGate>
  );
};

export default App;
