import { TypeORMManager } from './TypeORMManager';
import { Todo } from '../../entities/Todo';

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  priority?: string;
  isRecurring: boolean;
  recurringPattern?: string;
  icon?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 待办事项数据仓库
 * 使用 TypeORM 处理待办事项相关的数据库操作
 */
export class TodoRepository {
  private static instance: TodoRepository;
  private typeormManager: TypeORMManager;

  /**
   * 获取单例实例
   */
  public static getInstance(): TodoRepository {
    if (!TodoRepository.instance) {
      TodoRepository.instance = new TodoRepository();
    }
    return TodoRepository.instance;
  }

  /**
   * 私有构造函数，确保单例模式
   */
  private constructor() {
    this.typeormManager = TypeORMManager.getInstance();
  }

  /**
   * 创建待办事项
   */
  async createTodo(
    todo: Omit<TodoItem, 'createdAt' | 'updatedAt'>
  ): Promise<TodoItem | null> {
    try {
      const repository = await this.typeormManager.getTodoRepository();
      if (!repository) {
        throw new Error('Todo仓库不可用');
      }

      const entity = new Todo();
      entity.id = todo.id;
      entity.title = todo.title;
      entity.description = todo.description;
      entity.completed = todo.completed;
      entity.dueDate = todo.dueDate;
      entity.priority = todo.priority;
      entity.isRecurring = todo.isRecurring;
      entity.recurringPattern = todo.recurringPattern;
      entity.icon = todo.icon;
      entity.tags = todo.tags ? JSON.stringify(todo.tags) : undefined;

      const result = await repository.save(entity);
      return this.mapTodoEntityToItem(result);
    } catch (error) {
      console.error('创建待办事项失败:', error);
      return null;
    }
  }

  /**
   * 更新待办事项
   */
  async updateTodo(
    id: string,
    updates: Partial<Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<TodoItem | null> {
    try {
      const repository = await this.typeormManager.getTodoRepository();
      if (!repository) {
        throw new Error('Todo仓库不可用');
      }

      const updateData: Partial<Todo> = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined)
        updateData.description = updates.description;
      if (updates.completed !== undefined)
        updateData.completed = updates.completed;
      if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate;
      if (updates.priority !== undefined)
        updateData.priority = updates.priority;
      if (updates.isRecurring !== undefined)
        updateData.isRecurring = updates.isRecurring;
      if (updates.recurringPattern !== undefined)
        updateData.recurringPattern = updates.recurringPattern;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.tags !== undefined) {
        updateData.tags = updates.tags
          ? JSON.stringify(updates.tags)
          : undefined;
      }

      await repository.update(id, updateData);

      const result = await repository.findOne({ where: { id } });
      return result ? this.mapTodoEntityToItem(result) : null;
    } catch (error) {
      console.error('更新待办事项失败:', error);
      return null;
    }
  }

  /**
   * 删除待办事项
   */
  async deleteTodo(id: string): Promise<boolean> {
    try {
      const repository = await this.typeormManager.getTodoRepository();
      if (!repository) {
        throw new Error('Todo仓库不可用');
      }

      const result = await repository.delete(id);
      return (result.affected || 0) > 0;
    } catch (error) {
      console.error('删除待办事项失败:', error);
      return false;
    }
  }

  /**
   * 根据ID获取待办事项
   */
  async getTodoById(id: string): Promise<TodoItem | null> {
    try {
      const repository = await this.typeormManager.getTodoRepository();
      if (!repository) {
        throw new Error('Todo仓库不可用');
      }

      const result = await repository.findOne({ where: { id } });
      return result ? this.mapTodoEntityToItem(result) : null;
    } catch (error) {
      console.error('获取待办事项失败:', error);
      return null;
    }
  }

  /**
   * 获取所有待办事项
   */
  async getAllTodos(limit?: number, offset?: number): Promise<TodoItem[]> {
    try {
      const repository = await this.typeormManager.getTodoRepository();
      if (!repository) {
        throw new Error('Todo仓库不可用');
      }

      const results = await repository.find({
        order: { completed: 'ASC', createdAt: 'DESC' },
        ...(limit && { take: limit }),
        ...(offset && { skip: offset }),
      });

      return results.map((result) => this.mapTodoEntityToItem(result));
    } catch (error) {
      console.error('获取待办事项列表失败:', error);
      return [];
    }
  }

  /**
   * 获取未完成的待办事项
   */
  async getIncompleteTodos(): Promise<TodoItem[]> {
    try {
      const repository = await this.typeormManager.getTodoRepository();
      if (!repository) {
        throw new Error('Todo仓库不可用');
      }

      const results = await repository.find({
        where: { completed: false },
        order: { createdAt: 'DESC' },
      });

      return results.map((result) => this.mapTodoEntityToItem(result));
    } catch (error) {
      console.error('获取未完成待办事项失败:', error);
      return [];
    }
  }

  /**
   * 获取已完成的待办事项
   */
  async getCompletedTodos(): Promise<TodoItem[]> {
    try {
      const repository = await this.typeormManager.getTodoRepository();
      if (!repository) {
        throw new Error('Todo仓库不可用');
      }

      const results = await repository.find({
        where: { completed: true },
        order: { updatedAt: 'DESC' },
      });

      return results.map((result) => this.mapTodoEntityToItem(result));
    } catch (error) {
      console.error('获取已完成待办事项失败:', error);
      return [];
    }
  }

  /**
   * 根据优先级获取待办事项
   */
  async getTodosByPriority(priority: string): Promise<TodoItem[]> {
    try {
      const repository = await this.typeormManager.getTodoRepository();
      if (!repository) {
        throw new Error('Todo仓库不可用');
      }

      const results = await repository.find({
        where: { priority, completed: false },
        order: { createdAt: 'DESC' },
      });

      return results.map((result) => this.mapTodoEntityToItem(result));
    } catch (error) {
      console.error('根据优先级获取待办事项失败:', error);
      return [];
    }
  }

  /**
   * 根据到期日期获取待办事项
   */
  async getTodosByDueDate(dueDate: string): Promise<TodoItem[]> {
    try {
      const repository = await this.typeormManager.getTodoRepository();
      if (!repository) {
        throw new Error('Todo仓库不可用');
      }

      const results = await repository.find({
        where: { dueDate, completed: false },
        order: { createdAt: 'DESC' },
      });

      return results.map((result) => this.mapTodoEntityToItem(result));
    } catch (error) {
      console.error('根据到期日期获取待办事项失败:', error);
      return [];
    }
  }

  /**
   * 搜索待办事项
   */
  async searchTodos(query: string): Promise<TodoItem[]> {
    try {
      const repository = await this.typeormManager.getTodoRepository();
      if (!repository) {
        throw new Error('Todo仓库不可用');
      }

      const results = await repository
        .createQueryBuilder('todo')
        .where('todo.title LIKE :query OR todo.description LIKE :query', {
          query: `%${query}%`,
        })
        .orderBy('todo.completed', 'ASC')
        .addOrderBy('todo.createdAt', 'DESC')
        .getMany();

      return results.map((result) => this.mapTodoEntityToItem(result));
    } catch (error) {
      console.error('搜索待办事项失败:', error);
      return [];
    }
  }

  /**
   * 标记待办事项为完成
   */
  async markTodoAsCompleted(id: string): Promise<boolean> {
    try {
      const repository = await this.typeormManager.getTodoRepository();
      if (!repository) {
        throw new Error('Todo仓库不可用');
      }

      const result = await repository.update(id, { completed: true });
      return (result.affected || 0) > 0;
    } catch (error) {
      console.error('标记待办事项为完成失败:', error);
      return false;
    }
  }

  /**
   * 标记待办事项为未完成
   */
  async markTodoAsIncomplete(id: string): Promise<boolean> {
    try {
      const repository = await this.typeormManager.getTodoRepository();
      if (!repository) {
        throw new Error('Todo仓库不可用');
      }

      const result = await repository.update(id, { completed: false });
      return (result.affected || 0) > 0;
    } catch (error) {
      console.error('标记待办事项为未完成失败:', error);
      return false;
    }
  }

  /**
   * 获取待办事项统计信息
   */
  async getTodoStats(): Promise<{
    total: number;
    completed: number;
    incomplete: number;
    overdue: number;
  }> {
    try {
      const repository = await this.typeormManager.getTodoRepository();
      if (!repository) {
        throw new Error('Todo仓库不可用');
      }

      const total = await repository.count();
      const completed = await repository.count({ where: { completed: true } });
      const incomplete = await repository.count({
        where: { completed: false },
      });

      // 计算过期的待办事项
      const today = new Date().toISOString().split('T')[0];
      const overdue = await repository
        .createQueryBuilder('todo')
        .where('todo.completed = :completed AND todo.dueDate < :today', {
          completed: false,
          today,
        })
        .getCount();

      return {
        total,
        completed,
        incomplete,
        overdue,
      };
    } catch (error) {
      console.error('获取待办事项统计失败:', error);
      return {
        total: 0,
        completed: 0,
        incomplete: 0,
        overdue: 0,
      };
    }
  }

  /**
   * 将 Todo 实体映射为 TodoItem
   */
  private mapTodoEntityToItem(todo: Todo): TodoItem {
    return {
      id: todo.id,
      title: todo.title,
      description: todo.description || undefined,
      completed: todo.completed,
      dueDate: todo.dueDate || undefined,
      priority: todo.priority || undefined,
      isRecurring: todo.isRecurring,
      recurringPattern: todo.recurringPattern || undefined,
      icon: todo.icon || undefined,
      tags: todo.tags ? JSON.parse(todo.tags) : undefined,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };
  }
}
