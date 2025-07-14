import { AppUsageStat, HourlyUsageStat } from '../../types/appUsage';
import { format, subDays, addDays, isBefore } from 'date-fns';

// 应用使用记录接口
interface AppUsageRecord {
  packageName: string;
  appName: string;
  startTime: number;
  endTime: number;
  duration: number;
  date: string;
  icon?: string;
}

interface MockApp {
  packageName: string;
  appName: string;
  icon?: string;
}

/**
 * 统一的Web环境数据库实现
 * 使用localStorage存储数据，提供完整的mock数据生成功能
 */
export class SimpleWebDatabase {
  private static instance: SimpleWebDatabase;
  private readonly STORAGE_KEY = 'vaulty_web_data';
  private readonly MOCK_DATA_KEY = 'vaulty_mock_data_generated_v2';
  private readonly RECORDS_KEY = 'vaulty_app_usage_records';
  
  // 扩展的模拟应用列表，包含更多常用应用
  private mockApps: MockApp[] = [
    { packageName: 'com.tencent.mm', appName: '微信', icon: this.generateAppIcon('微', '#1AAD19') },
    { packageName: 'com.tencent.mobileqq', appName: 'QQ', icon: this.generateAppIcon('Q', '#12B7F5') },
    { packageName: 'com.ss.android.ugc.aweme', appName: '抖音', icon: this.generateAppIcon('抖', '#FE2C55') },
    { packageName: 'com.sina.weibo', appName: '微博', icon: this.generateAppIcon('微', '#E6162D') },
    { packageName: 'com.eg.android.AlipayGphone', appName: '支付宝', icon: this.generateAppIcon('支', '#1677FF') },
    { packageName: 'com.taobao.taobao', appName: '淘宝', icon: this.generateAppIcon('淘', '#FF4400') },
    { packageName: 'com.netease.cloudmusic', appName: '网易云音乐', icon: this.generateAppIcon('网', '#C20C0C') },
    { packageName: 'com.zhihu.android', appName: '知乎', icon: this.generateAppIcon('知', '#0084FF') },
    { packageName: 'tv.danmaku.bili', appName: 'B站', icon: this.generateAppIcon('B', '#FB7299') },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', icon: this.generateAppIcon('W', '#25D366') },
    { packageName: 'com.instagram.android', appName: 'Instagram', icon: this.generateAppIcon('I', '#E4405F') },
    { packageName: 'com.facebook.katana', appName: 'Facebook', icon: this.generateAppIcon('F', '#1877F2') },
    { packageName: 'com.twitter.android', appName: 'Twitter', icon: this.generateAppIcon('T', '#1DA1F2') },
    { packageName: 'com.spotify.music', appName: 'Spotify', icon: this.generateAppIcon('S', '#1DB954') },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', icon: this.generateAppIcon('N', '#E50914') },
    { packageName: 'com.google.android.youtube', appName: 'YouTube', icon: this.generateAppIcon('Y', '#FF0000') },
    { packageName: 'com.google.android.gm', appName: 'Gmail', icon: this.generateAppIcon('G', '#EA4335') },
    { packageName: 'com.google.android.apps.maps', appName: 'Google Maps', icon: this.generateAppIcon('M', '#4285F4') },
    { packageName: 'com.reddit.frontpage', appName: 'Reddit', icon: this.generateAppIcon('R', '#FF4500') },
    { packageName: 'com.slack', appName: 'Slack', icon: this.generateAppIcon('S', '#4A154B') },
    { packageName: 'com.discord', appName: 'Discord', icon: this.generateAppIcon('D', '#5865F2') },
    { packageName: 'com.baidu.searchbox', appName: '百度', icon: this.generateAppIcon('百', '#2932E1') },
  ];

  /**
   * 生成简单的应用图标（SVG格式的Base64）
   */
  private generateAppIcon(text: string, color: string): string {
    const svg = `
      <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="8" fill="${color}"/>
        <text x="24" y="32" font-family="Arial, sans-serif" font-size="20" font-weight="bold" 
              fill="white" text-anchor="middle">${text}</text>
      </svg>
    `;
    
    // 使用URL编码的SVG，避免Base64编码中文字符的问题
    const encodedSvg = encodeURIComponent(svg);
    return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
  }

  public static getInstance(): SimpleWebDatabase {
    if (!SimpleWebDatabase.instance) {
      SimpleWebDatabase.instance = new SimpleWebDatabase();
    }
    return SimpleWebDatabase.instance;
  }

  private constructor() {}

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    console.log('初始化统一Web数据库...');
    // 检查是否需要生成模拟数据
    const mockDataGenerated = localStorage.getItem(this.MOCK_DATA_KEY);
    if (!mockDataGenerated) {
      await this.generateInitialMockData();
      localStorage.setItem(this.MOCK_DATA_KEY, 'true');
    }
  }

  /**
   * 生成初始模拟数据（过去30天）
   */
  private async generateInitialMockData(): Promise<void> {
    console.log('生成初始模拟数据（过去30天）...');
    
    const today = new Date();
    const records: AppUsageRecord[] = [];
    const statsData: { [date: string]: AppUsageStat[] } = {};

    // 生成过去30天的数据
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRecords = this.generateDetailedRecordsForDate(dateStr);
      records.push(...dayRecords);
      
      // 同时生成统计数据
      statsData[dateStr] = this.generateStatsFromRecords(dayRecords);
    }

    // 保存记录和统计数据
    localStorage.setItem(this.RECORDS_KEY, JSON.stringify(records));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(statsData));
    console.log('初始模拟数据生成完成');
  }

  /**
   * 为指定日期生成详细的使用记录
   */
  private generateDetailedRecordsForDate(date: string): AppUsageRecord[] {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    const startOfDay = dateObj.getTime();
    const records: AppUsageRecord[] = [];

    // 为每个小时生成一些随机使用记录
    for (let hour = 8; hour < 23; hour++) {
      // 每个小时使用3-8个应用
      const appCount = Math.floor(Math.random() * 6) + 3;
      const shuffledApps = [...this.mockApps]
        .sort(() => 0.5 - Math.random())
        .slice(0, appCount);

      // 每个小时的起始时间戳
      const hourStart = startOfDay + hour * 3600 * 1000;
      let currentTime = hourStart;
      const endHourTime = hourStart + 3600 * 1000;

      while (currentTime < endHourTime) {
        // 随机选择一个应用
        const app = shuffledApps[Math.floor(Math.random() * shuffledApps.length)];

        // 使用时长：30秒到15分钟之间
        const usageDuration = Math.floor(Math.random() * (15 * 60 * 1000 - 30 * 1000)) + 30 * 1000;

        // 确保不超过小时结束时间
        const endTime = Math.min(currentTime + usageDuration, endHourTime);
        const actualDuration = endTime - currentTime;

        if (actualDuration > 0) {
          records.push({
      packageName: app.packageName,
            appName: app.appName,
            startTime: currentTime,
            endTime: endTime,
            duration: actualDuration,
            date: date,
            icon: app.icon,
          });
        }

        // 下次使用的应用间隔：0-5分钟
        const breakTime = Math.floor(Math.random() * 5 * 60 * 1000);
        currentTime = endTime + breakTime;
      }
    }

    return records;
  }

  /**
   * 从记录生成统计数据
   */
  private generateStatsFromRecords(records: AppUsageRecord[]): AppUsageStat[] {
    const appStats = new Map<string, AppUsageStat>();

    records.forEach(record => {
      const existing = appStats.get(record.packageName);
      if (existing) {
        existing.totalDuration += record.duration;
        existing.usageCount += 1;
        existing.lastUsed = Math.max(existing.lastUsed, record.endTime);
      } else {
        appStats.set(record.packageName, {
          packageName: record.packageName,
          appName: record.appName,
          totalDuration: record.duration,
          usageCount: 1,
          lastUsed: record.endTime,
          icon: record.icon,
        });
      }
    });

    return Array.from(appStats.values()).sort((a, b) => b.totalDuration - a.totalDuration);
  }

  /**
   * 生成单日的模拟数据
   */
  async generateDailyMockData(date: string): Promise<boolean> {
    try {
      // 先检查该日期是否已有数据
      const existingData = await this.checkDateHasData(date);
      if (existingData) {
        console.log(`日期 ${date} 已存在数据，跳过生成`);
        return true;
      }

      // 生成详细记录
      const records = this.generateDetailedRecordsForDate(date);
      
      // 保存记录
      await this.saveAppUsageRecords(records);
      
      // 生成并保存统计数据
      const stats = this.generateStatsFromRecords(records);
      const data = localStorage.getItem(this.STORAGE_KEY);
      const allData = data ? JSON.parse(data) : {};
      allData[date] = stats;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));

      console.log(`为日期 ${date} 生成模拟数据成功`);
      return true;
    } catch (error) {
      console.error(`生成日期 ${date} 的模拟数据失败:`, error);
      return false;
    }
  }

  /**
   * 生成指定日期范围的模拟数据
   */
  async generateDateRangeMockData(startDate: string, endDate: string): Promise<boolean> {
    try {
      let currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (isBefore(currentDate, end) || format(currentDate, 'yyyy-MM-dd') === endDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        await this.generateDailyMockData(dateStr);
        currentDate = addDays(currentDate, 1);
      }

      return true;
    } catch (error) {
      console.error(`生成日期范围 ${startDate} 至 ${endDate} 的模拟数据失败:`, error);
      return false;
    }
  }

  /**
   * 生成过去N天的模拟数据
   */
  async generatePastDaysMockData(days: number): Promise<boolean> {
    try {
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      return await this.generateDateRangeMockData(startDate, endDate);
    } catch (error) {
      console.error(`生成过去${days}天的模拟数据失败:`, error);
      return false;
    }
  }

  /**
   * 检查指定日期是否有数据
   */
  async checkDateHasData(date: string): Promise<boolean> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return false;
    
    const allData = JSON.parse(data);
    return !!allData[date];
  }

  /**
   * 保存应用使用记录
   */
  async saveAppUsageRecords(records: AppUsageRecord[]): Promise<boolean> {
    try {
      const existingData = localStorage.getItem(this.RECORDS_KEY);
      const allRecords = existingData ? JSON.parse(existingData) : [];
      
      // 添加新记录
      allRecords.push(...records);
      
      localStorage.setItem(this.RECORDS_KEY, JSON.stringify(allRecords));
      return true;
    } catch (error) {
      console.error('保存应用使用记录失败:', error);
      return false;
    }
  }

  /**
   * 获取应用使用统计
   */
  async getUsageStats(startDate: string, endDate: string): Promise<AppUsageStat[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return [];
      }

      const allData = JSON.parse(data);
      const result: AppUsageStat[] = [];

      // 合并指定日期范围内的数据
      Object.keys(allData).forEach(date => {
        if (date >= startDate && date <= endDate) {
          const dayStats = allData[date];
          dayStats.forEach((app: AppUsageStat) => {
            const existingApp = result.find(r => r.packageName === app.packageName);
            if (existingApp) {
              existingApp.totalDuration += app.totalDuration;
              existingApp.usageCount += app.usageCount;
              existingApp.lastUsed = Math.max(existingApp.lastUsed, app.lastUsed);
            } else {
              result.push({ ...app });
            }
          });
        }
      });

      return result.sort((a, b) => b.totalDuration - a.totalDuration);
    } catch (error) {
      console.error('获取使用统计失败:', error);
      return [];
    }
  }

  /**
   * 获取每小时使用统计
   */
  async getHourlyUsageStats(date: string): Promise<HourlyUsageStat[]> {
    try {
      const recordsData = localStorage.getItem(this.RECORDS_KEY);
      if (!recordsData) {
        return this.generateMockHourlyStats();
      }

      const allRecords: AppUsageRecord[] = JSON.parse(recordsData);
      const dateRecords = allRecords.filter(record => record.date === date);
      
      if (dateRecords.length === 0) {
        return this.generateMockHourlyStats();
      }

      // 按小时分组统计
      const hourlyStats: HourlyUsageStat[] = [];
      for (let hour = 0; hour < 24; hour++) {
        const hourRecords = dateRecords.filter(record => {
          const recordHour = new Date(record.startTime).getHours();
          return recordHour === hour;
        });

        const totalDuration = hourRecords.reduce((sum, record) => sum + record.duration, 0);
        
        hourlyStats.push({
          hour,
          totalDuration,
          apps: hourRecords.map(record => ({
            packageName: record.packageName,
            appName: record.appName,
            totalDuration: record.duration,
            usageCount: 1,
            lastUsed: record.endTime,
            icon: record.icon,
          })),
        });
      }

      return hourlyStats;
    } catch (error) {
      console.error('获取每小时使用统计失败:', error);
      return this.generateMockHourlyStats();
    }
  }

  /**
   * 生成模拟的小时统计数据
   */
  private generateMockHourlyStats(): HourlyUsageStat[] {
    const stats: HourlyUsageStat[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const totalDuration = Math.floor(Math.random() * 300000) + 10000; // 10秒到5分钟
      const appCount = Math.floor(Math.random() * 5) + 1;
      const apps = this.mockApps
        .sort(() => 0.5 - Math.random())
        .slice(0, appCount)
        .map(app => ({
          packageName: app.packageName,
          appName: app.appName,
          totalDuration: Math.floor(totalDuration / appCount),
          usageCount: 1,
          lastUsed: Date.now(),
          icon: app.icon,
        }));

      stats.push({
        hour,
        totalDuration,
        apps,
      });
    }

    return stats;
  }

  /**
   * 获取每日Top应用
   */
  async getDailyTopApps(date: string, limit: number = 10): Promise<AppUsageStat[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return [];
      }

      const allData = JSON.parse(data);
      const dayData = allData[date];
      
      if (!dayData) {
        return [];
      }

      return dayData
        .sort((a: AppUsageStat, b: AppUsageStat) => b.totalDuration - a.totalDuration)
        .slice(0, limit);
    } catch (error) {
      console.error('获取每日Top应用失败:', error);
      return [];
    }
  }

  /**
   * 生成指定日期的模拟数据（兼容旧接口）
   */
  async generateMockDataForDate(date: string): Promise<boolean> {
    return await this.generateDailyMockData(date);
  }

  /**
   * 检查数据库是否就绪
   */
  isReady(): boolean {
    return true;
  }

  /**
   * 重置数据库
   */
  reset(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.MOCK_DATA_KEY);
    localStorage.removeItem(this.RECORDS_KEY);
    console.log('Web数据库已重置');
  }

  /**
   * 获取数据库状态
   */
  getStatus(): any {
    const statsData = localStorage.getItem(this.STORAGE_KEY);
    const recordsData = localStorage.getItem(this.RECORDS_KEY);
    const mockGenerated = localStorage.getItem(this.MOCK_DATA_KEY);
    
    return {
      environment: 'web',
      isInitialized: !!mockGenerated,
      statsDataSize: statsData ? JSON.parse(statsData).length : 0,
      recordsCount: recordsData ? JSON.parse(recordsData).length : 0,
      storageKeys: [this.STORAGE_KEY, this.MOCK_DATA_KEY, this.RECORDS_KEY],
    };
  }
} 