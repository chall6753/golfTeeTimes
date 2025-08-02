import React, { useState } from 'react';
import TeeTimeAlertForm from './components/TeeTimeAlertForm';
import LoginForm from './components/LoginForm';
import SubscriptionList from './components/SubscriptionList';
import './App.css';

function App() {
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' or 'subscriptions'

  if (!userId) return <LoginForm onLogin={setUserId} />;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Menu</h2>
        <button onClick={() => setActiveTab('alerts')}>New Alert</button>
        <button onClick={() => setActiveTab('subscriptions')}>My Subscriptions</button>
      </aside>

      <main className="main-content">
        <h1>Denver Golf Tee Times</h1>
        {activeTab === 'alerts' && <TeeTimeAlertForm userId={userId} />}
        {activeTab === 'subscriptions' && <SubscriptionList userId={userId} />}
      </main>
    </div>
  );
}

export default App;
