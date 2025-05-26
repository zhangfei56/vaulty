// import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();

  // 检查当前路径是否匹配
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <footer className="bg-white border-t fixed bottom-0 left-0 right-0 z-40">
      <nav className="flex justify-around items-center h-14">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center w-full h-full ${isActive('/') ? 'text-blue-600' : 'text-gray-500'}`}
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
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xs mt-0.5">首页</span>
        </Link>
        <Link
          to="/diary"
          className={`flex flex-col items-center justify-center w-full h-full ${isActive('/diary') ? 'text-blue-600' : 'text-gray-500'}`}
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
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          <span className="text-xs mt-0.5">日记</span>
        </Link>
        <Link
          to="/todo"
          className={`flex flex-col items-center justify-center w-full h-full ${isActive('/todo') ? 'text-blue-600' : 'text-gray-500'}`}
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span className="text-xs mt-0.5">待办</span>
        </Link>
        <Link
          to="/calendar"
          className={`flex flex-col items-center justify-center w-full h-full ${isActive('/calendar') ? 'text-blue-600' : 'text-gray-500'}`}
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs mt-0.5">日历</span>
        </Link>
        <Link
          to="/stats"
          className={`flex flex-col items-center justify-center w-full h-full ${isActive('/stats') ? 'text-blue-600' : 'text-gray-500'}`}
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="text-xs mt-0.5">统计</span>
        </Link>
      </nav>
    </footer>
  );
};

export default Footer;
