import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import DiaryPage from '../pages/DiaryPage';
import TodoPage from '../pages/TodoPage';
import CalendarPage from '../pages/CalendarPage';
import StatsPage from '../pages/StatsPage';
import SettingsPage from '../pages/SettingsPage';
import MockDataPage from '../pages/MockDataPage';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const AppRouter = () => {
  return (
    <Router>
      <div className="flex flex-col h-screen bg-gray-50">
        <Header />
        <main className="flex-1 overflow-y-auto pb-16 pt-2 px-3">
          <div className="max-w-md mx-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/diary" element={<DiaryPage />} />
              <Route path="/todo" element={<TodoPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/mock-data" element={<MockDataPage />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default AppRouter;
