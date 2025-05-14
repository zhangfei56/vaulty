export interface AppEvent {
  id: string;
  appName: string;
  eventType: 'open' | 'close' | 'background' | 'foreground';
  startTime: string;
  endTime?: string;
  duration?: number; // 单位: 毫秒
  metadata?: Record<string, any>;
}
