import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const [statusBarHeight, setStatusBarHeight] = useState(0);

  // 设置页面标题
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Vaulty2';
      case '/diary':
        return '我的日记';
      case '/todo':
        return '待办事项';
      case '/calendar':
        return '日历总览';
      case '/stats':
        return '使用统计';
      case '/settings':
        return '设置';
      default:
        return 'Vaulty2';
    }
  };

  // 模拟获取状态栏高度 (实际项目中可以使用 Capacitor Status Bar API)
  useEffect(() => {
    // 这里仅作为示例，实际项目中会使用 Capacitor API 获取
    const getStatusBarHeight = () => {
      try {
        // 通常在 iOS 上会大一些
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        return isIOS ? 44 : 24; // iOS 通常是 44px，Android 通常是 24px
      } catch (e) {
        return 0;
      }
    };

    setStatusBarHeight(getStatusBarHeight());
  }, []);

  return (
    <>
      {/* 主标题栏 */}
      <header className="bg-blue-600 text-white z-40 shadow-sm">
        <div className="px-5 py-3 flex justify-center items-center relative">
          {/* 返回按钮 - 仅在非首页显示 */}
          {location.pathname !== '/' && (
            <button
              onClick={() => window.history.back()}
              className="absolute left-2 p-1.5 rounded-full hover:bg-blue-500 active:bg-blue-700 transition-colors"
              aria-label="返回"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* 居中显示标题 */}
          <h1 className="text-lg font-bold">
            {getPageTitle(location.pathname)}
          </h1>
        </div>
      </header>
    </>
  );
};

export default Header;
