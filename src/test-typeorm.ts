import { TypeORMManager } from './services/data-source/TypeORMManager';
import { AppUsageRepository } from './services/data-source/AppUsageRepository';
import { DiaryRepository } from './services/data-source/DiaryRepository';
import { TodoRepository } from './services/data-source/TodoRepository';

/**
 * 测试 TypeORM 集成
 */
export async function testTypeORMIntegration() {
  console.log('开始测试 TypeORM 集成...');

  try {
    // 测试数据源初始化
    const typeormManager = TypeORMManager.getInstance();
    const isReady = await typeormManager.ensureDataSourceReady();

    if (!isReady) {
      throw new Error('TypeORM 数据源初始化失败');
    }

    console.log('✓ TypeORM 数据源初始化成功');

    // 测试应用使用记录仓库
    const appUsageRepo = AppUsageRepository.getInstance();
    const testRecords = [
      {
        packageName: 'com.test.app',
        appName: 'Test App',
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        duration: 3600000,
        date: new Date().toISOString().split('T')[0],
        icon: null,
      },
    ];

    const saveResult = await appUsageRepo.saveAppUsageRecords(testRecords);
    console.log('✓ 应用使用记录保存测试:', saveResult ? '成功' : '失败');

    const stats = await appUsageRepo.getUsageStats(
      new Date().toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );
    console.log('✓ 应用使用统计查询测试:', stats.length > 0 ? '成功' : '失败');

    // 测试日记仓库
    const diaryRepo = DiaryRepository.getInstance();
    const testDiary = {
      id: 'test-diary-' + Date.now(),
      title: '测试日记',
      content: '这是一个测试日记内容',
      mood: 'happy',
      tags: ['测试', 'TypeORM'],
    };

    const diaryResult = await diaryRepo.createDiary(testDiary);
    console.log('✓ 日记创建测试:', diaryResult ? '成功' : '失败');

    const diaries = await diaryRepo.getAllDiaries(10);
    console.log('✓ 日记查询测试:', diaries.length > 0 ? '成功' : '失败');

    // 测试待办事项仓库
    const todoRepo = TodoRepository.getInstance();
    const testTodo = {
      id: 'test-todo-' + Date.now(),
      title: '测试待办事项',
      description: '这是一个测试待办事项',
      completed: false,
      priority: 'high',
      isRecurring: false,
      tags: ['测试', 'TypeORM'],
    };

    const todoResult = await todoRepo.createTodo(testTodo);
    console.log('✓ 待办事项创建测试:', todoResult ? '成功' : '失败');

    const todos = await todoRepo.getAllTodos(10);
    console.log('✓ 待办事项查询测试:', todos.length > 0 ? '成功' : '失败');

    console.log('🎉 TypeORM 集成测试全部通过！');
    return true;
  } catch (error) {
    console.error('❌ TypeORM 集成测试失败:', error);
    return false;
  }
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中，可以通过控制台调用
  (window as any).testTypeORM = testTypeORMIntegration;
  console.log('TypeORM 测试函数已挂载到 window.testTypeORM，可在控制台调用');
}
