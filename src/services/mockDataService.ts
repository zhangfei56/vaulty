import { AppUsageRepository } from './data-source/AppUsageRepository';
import { format, subDays, addDays, isBefore } from 'date-fns';

/**
 * 模拟数据服务
 * 负责为Web环境生成模拟数据
 */
export class MockDataService {
  private static instance: MockDataService;
  private repository: AppUsageRepository;
  private mockApps = [
    { packageName: 'com.whatsapp', appName: 'WhatsApp', icon: null },
    { packageName: 'com.instagram.android', appName: 'Instagram', icon: null },
    { packageName: 'com.facebook.katana', appName: 'Facebook', icon: null },
    { packageName: 'com.twitter.android', appName: 'Twitter', icon: null },
    { packageName: 'com.spotify.music', appName: 'Spotify', icon: null },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', icon: null },
    {
      packageName: 'com.google.android.youtube',
      appName: 'YouTube',
      icon: null,
    },
    { packageName: 'com.tencent.mm', appName: 'WeChat', icon: null },
    { packageName: 'com.ss.android.ugc.trill', appName: 'TikTok', icon: null },
    {
      packageName: 'com.amazon.mShop.android.shopping',
      appName: 'Amazon',
      icon: null,
    },
    { packageName: 'com.google.android.gm', appName: 'Gmail', icon: null },
    {
      packageName: 'com.google.android.apps.maps',
      appName: 'Google Maps',
      icon: null,
    },
    { packageName: 'com.reddit.frontpage', appName: 'Reddit', icon: null },
    { packageName: 'com.slack', appName: 'Slack', icon: null },
    { packageName: 'com.discord', appName: 'Discord', icon: null },
  ];

  /**
   * 获取单例实例
   */
  public static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  /**
   * 私有构造函数，确保单例模式
   */
  private constructor() {
    this.repository = AppUsageRepository.getInstance();
  }

  /**
   * 生成单日的模拟数据
   * @param date 要生成数据的日期 (YYYY-MM-DD)
   */
  async generateDailyMockData(date: string): Promise<boolean> {
    try {
      // 先检查该日期是否已有数据
      const existingData = await this.repository.checkDateHasData(date);

      if (existingData) {
        console.log(`日期 ${date} 已存在数据，跳过生成`);
        return true;
      }

      // 当前日期的开始时间戳
      const dateObj = new Date(date);
      dateObj.setHours(0, 0, 0, 0);
      const startOfDay = dateObj.getTime();

      const records = [];

      // 为每个小时生成一些随机使用记录
      for (let hour = 8; hour < 23; hour++) {
        // 每个小时使用3-8个应用
        const appCount = Math.floor(Math.random() * 6) + 3;
        const shuffledApps = [...this.mockApps]
          .sort(() => 0.5 - Math.random())
          .slice(0, appCount);

        // 每个小时的起始时间戳
        const hourStart = startOfDay + hour * 3600 * 1000;

        // 在每个小时内生成应用使用记录
        let currentTime = hourStart;
        const endHourTime = hourStart + 3600 * 1000;

        while (currentTime < endHourTime) {
          // 随机选择一个应用
          const app =
            shuffledApps[Math.floor(Math.random() * shuffledApps.length)];

          // 使用时长：30秒到15分钟之间
          const usageDuration =
            Math.floor(Math.random() * (15 * 60 * 1000 - 30 * 1000)) +
            30 * 1000;

          // 确保不超过小时结束时间
          const endTime = Math.min(currentTime + usageDuration, endHourTime);
          const actualDuration = endTime - currentTime;

          records.push({
            packageName: app.packageName,
            appName: app.appName,
            startTime: currentTime,
            endTime: endTime,
            duration: actualDuration,
            date: date,
            icon: app.icon,
          });

          // 下次使用的应用间隔：0-5分钟
          const breakTime = Math.floor(Math.random() * 5 * 60 * 1000);
          currentTime = endTime + breakTime;
        }
      }

      // 保存记录到数据库
      const result = await this.repository.saveAppUsageRecords(records);
      return result;
    } catch (error) {
      console.error(`生成日期 ${date} 的模拟数据失败:`, error);
      return false;
    }
  }

  /**
   * 生成指定日期范围的模拟数据
   * @param startDate 开始日期 (YYYY-MM-DD)
   * @param endDate 结束日期 (YYYY-MM-DD)
   */
  async generateDateRangeMockData(
    startDate: string,
    endDate: string
  ): Promise<boolean> {
    try {
      let currentDate = new Date(startDate);
      const end = new Date(endDate);

      // 对日期范围内的每一天生成数据
      while (
        isBefore(currentDate, end) ||
        format(currentDate, 'yyyy-MM-dd') === endDate
      ) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        await this.generateDailyMockData(dateStr);
        currentDate = addDays(currentDate, 1);
      }

      return true;
    } catch (error) {
      console.error(
        `生成日期范围 ${startDate} 至 ${endDate} 的模拟数据失败:`,
        error
      );
      return false;
    }
  }

  /**
   * 生成过去N天的模拟数据
   * @param days 过去的天数
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
   * 一键初始化模拟数据（生成过去30天的数据）
   */
  async initializeMockData(): Promise<boolean> {
    return await this.generatePastDaysMockData(30);
  }
}

export const mockDataService = MockDataService.getInstance();
