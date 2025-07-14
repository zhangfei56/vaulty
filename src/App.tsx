import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';

import Home from './pages/Home';
import DiaryPage from './pages/DiaryPage';
import TodoPage from './pages/TodoPage';
import CalendarPage from './pages/CalendarPage';
import StatsPage from './pages/StatsPage';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import SettingsPage from './pages/SettingsPage';
import MockDataPage from './pages/MockDataPage';
import './test-typeorm'; // 导入TypeORM测试
import { TypeORMManager } from './services/data-source/TypeORMManager';

function App() {
  useEffect(() => {
    // 在应用启动时重置连接状态，避免连接冲突
    TypeORMManager.resetConnectionState().catch(console.error);
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <div className="App flex flex-col min-h-screen bg-gray-100">
          <Header />
          <main className="flex-1 pb-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/diary" element={<DiaryPage />} />
              <Route path="/diary/:id" element={<DiaryPage />} />
              <Route path="/todo" element={<TodoPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/mock-data" element={<MockDataPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
