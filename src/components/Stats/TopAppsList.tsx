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
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>

      {apps.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">暂无数据</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {apps.map((app, index) => (
            <li key={app.packageName} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 text-center font-medium text-gray-500">
                {index + 1}
              </div>

              {app.icon ? (
                <img
                  src={app.icon}
                  alt={app.appName}
                  className="w-10 h-10 rounded-xl"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500">
                  {app.appName.charAt(0)}
                </div>
              )}

              <div className="flex-grow">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{app.appName}</span>
                  <span className="text-sm text-gray-500">
                    {formatDuration(app.totalDuration)}
                  </span>
                </div>

                <div className="w-full h-2 bg-gray-100 rounded-full mt-1">
                  <div
                    className="h-2 bg-orange-400 rounded-full"
                    style={{
                      width: `${calculatePercentage(app.totalDuration)}%`,
                    }}
                  ></div>
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
