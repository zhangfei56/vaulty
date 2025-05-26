import { TypeORMManager } from './TypeORMManager';
import { Diary } from '../../entities/Diary';

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 日记数据仓库
 * 使用 TypeORM 处理日记相关的数据库操作
 */
export class DiaryRepository {
  private static instance: DiaryRepository;
  private typeormManager: TypeORMManager;

  /**
   * 获取单例实例
   */
  public static getInstance(): DiaryRepository {
    if (!DiaryRepository.instance) {
      DiaryRepository.instance = new DiaryRepository();
    }
    return DiaryRepository.instance;
  }

  /**
   * 私有构造函数，确保单例模式
   */
  private constructor() {
    this.typeormManager = TypeORMManager.getInstance();
  }

  /**
   * 创建日记条目
   */
  async createDiary(
    diary: Omit<DiaryEntry, 'createdAt' | 'updatedAt'>
  ): Promise<DiaryEntry | null> {
    try {
      const repository = await this.typeormManager.getDiaryRepository();
      if (!repository) {
        throw new Error('Diary仓库不可用');
      }

      const entity = new Diary();
      entity.id = diary.id;
      entity.title = diary.title;
      entity.content = diary.content;
      entity.mood = diary.mood;
      entity.tags = diary.tags ? JSON.stringify(diary.tags) : undefined;

      const result = await repository.save(entity);
      return this.mapDiaryEntityToEntry(result);
    } catch (error) {
      console.error('创建日记失败:', error);
      return null;
    }
  }

  /**
   * 更新日记条目
   */
  async updateDiary(
    id: string,
    updates: Partial<Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<DiaryEntry | null> {
    try {
      const repository = await this.typeormManager.getDiaryRepository();
      if (!repository) {
        throw new Error('Diary仓库不可用');
      }

      const updateData: Partial<Diary> = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.content) updateData.content = updates.content;
      if (updates.mood !== undefined) updateData.mood = updates.mood;
      if (updates.tags !== undefined) {
        updateData.tags = updates.tags
          ? JSON.stringify(updates.tags)
          : undefined;
      }

      await repository.update(id, updateData);

      const result = await repository.findOne({ where: { id } });
      return result ? this.mapDiaryEntityToEntry(result) : null;
    } catch (error) {
      console.error('更新日记失败:', error);
      return null;
    }
  }

  /**
   * 删除日记条目
   */
  async deleteDiary(id: string): Promise<boolean> {
    try {
      const repository = await this.typeormManager.getDiaryRepository();
      if (!repository) {
        throw new Error('Diary仓库不可用');
      }

      const result = await repository.delete(id);
      return (result.affected || 0) > 0;
    } catch (error) {
      console.error('删除日记失败:', error);
      return false;
    }
  }

  /**
   * 根据ID获取日记条目
   */
  async getDiaryById(id: string): Promise<DiaryEntry | null> {
    try {
      const repository = await this.typeormManager.getDiaryRepository();
      if (!repository) {
        throw new Error('Diary仓库不可用');
      }

      const result = await repository.findOne({ where: { id } });
      return result ? this.mapDiaryEntityToEntry(result) : null;
    } catch (error) {
      console.error('获取日记失败:', error);
      return null;
    }
  }

  /**
   * 获取所有日记条目
   */
  async getAllDiaries(limit?: number, offset?: number): Promise<DiaryEntry[]> {
    try {
      const repository = await this.typeormManager.getDiaryRepository();
      if (!repository) {
        throw new Error('Diary仓库不可用');
      }

      const results = await repository.find({
        order: { createdAt: 'DESC' },
        ...(limit && { take: limit }),
        ...(offset && { skip: offset }),
      });

      return results.map((result) => this.mapDiaryEntityToEntry(result));
    } catch (error) {
      console.error('获取日记列表失败:', error);
      return [];
    }
  }

  /**
   * 根据日期范围获取日记
   */
  async getDiariesByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<DiaryEntry[]> {
    try {
      const repository = await this.typeormManager.getDiaryRepository();
      if (!repository) {
        throw new Error('Diary仓库不可用');
      }

      const results = await repository
        .createQueryBuilder('diary')
        .where(
          'diary.createdAt >= :startDate AND diary.createdAt <= :endDate',
          {
            startDate,
            endDate,
          }
        )
        .orderBy('diary.createdAt', 'DESC')
        .getMany();

      return results.map((result) => this.mapDiaryEntityToEntry(result));
    } catch (error) {
      console.error('根据日期范围获取日记失败:', error);
      return [];
    }
  }

  /**
   * 搜索日记
   */
  async searchDiaries(query: string): Promise<DiaryEntry[]> {
    try {
      const repository = await this.typeormManager.getDiaryRepository();
      if (!repository) {
        throw new Error('Diary仓库不可用');
      }

      const results = await repository
        .createQueryBuilder('diary')
        .where('diary.title LIKE :query OR diary.content LIKE :query', {
          query: `%${query}%`,
        })
        .orderBy('diary.createdAt', 'DESC')
        .getMany();

      return results.map((result) => this.mapDiaryEntityToEntry(result));
    } catch (error) {
      console.error('搜索日记失败:', error);
      return [];
    }
  }

  /**
   * 获取日记总数
   */
  async getDiariesCount(): Promise<number> {
    try {
      const repository = await this.typeormManager.getDiaryRepository();
      if (!repository) {
        throw new Error('Diary仓库不可用');
      }

      return await repository.count();
    } catch (error) {
      console.error('获取日记总数失败:', error);
      return 0;
    }
  }

  /**
   * 将 Diary 实体映射为 DiaryEntry
   */
  private mapDiaryEntityToEntry(diary: Diary): DiaryEntry {
    return {
      id: diary.id,
      title: diary.title,
      content: diary.content,
      mood: diary.mood || undefined,
      tags: diary.tags ? JSON.parse(diary.tags) : undefined,
      createdAt: diary.createdAt,
      updatedAt: diary.updatedAt,
    };
  }
}
