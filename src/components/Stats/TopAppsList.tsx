import React from 'react';
import { AppUsageStat } from '../../types/appUsage';

interface Props {
  apps: AppUsageStat[];
  title?: string;
}

const TopAppsList: React.FC<Props> = ({ apps, title = '今日应用使用排行' }) => {
  // 格式化使用时长
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}时${minutes % 60}分`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  // 计算占比百分比
  const calculatePercentage = (duration: number): number => {
    const totalTime = apps.reduce((sum, app) => sum + app.totalDuration, 0);
    return totalTime > 0 ? (duration / totalTime) * 100 : 0;
  };

  return (
    <div className="stats-card">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>

      {apps.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">暂无数据</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {apps.map((app, index) => (
            <li key={app.packageName} className="app-list-item">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-6 text-center font-medium text-gray-500 text-sm">
                  {index + 1}
                </div>

                {app.icon ? (
                  <img
                    src={app.icon}
                    alt={app.appName}
                    className="app-icon"
                  />
                ) : (
                  <div className="app-icon bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                    {app.appName.charAt(0)}
                  </div>
                )}

                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="app-name font-medium text-sm">{app.appName}</span>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {formatDuration(app.totalDuration)}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                    <div
                      className="h-1.5 bg-orange-400 rounded-full"
                      style={{
                        width: `${calculatePercentage(app.totalDuration)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopAppsList;
