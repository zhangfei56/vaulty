import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import AppRouter from './router';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 初始化应用数据和资源
    const initializeApp = async () => {
      try {
        // 这里可以添加应用初始化逻辑，如数据库连接等
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <AppRouter />
      </div>
    </Provider>
  );
};

export default App;
