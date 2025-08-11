import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../utils/logger';
import { Notification } from '../types';
import SocketManager from '../socket/socketManager';

export class NotificationService {
  private socketManager: SocketManager;

  constructor(socketManager: SocketManager) {
    this.socketManager = socketManager;
  }

  async createNotification(notificationData: {
    user_id: string;
    type: Notification['type'];
    title: string;
    message: string;
    data?: any;
    related_task_id?: string;
    related_project_id?: string;
    triggered_by?: string;
  }): Promise<Notification> {
    const notification = await db('notifications')
      .insert({
        id: uuidv4(),
        ...notificationData,
        is_read: false,
        is_email_sent: false,
        created_at: new Date(),
      })
      .returning('*')
      .then(rows => rows[0]);

    this.socketManager.emitToUser(notificationData.user_id, 'new_notification', notification);

    logger.info('Notification created:', {
      notificationId: notification.id,
      userId: notificationData.user_id,
      type: notificationData.type,
    });

    return notification;
  }

  async notifyTaskAssigned(taskId: string, assigneeId: string, assignedBy: string): Promise<void> {
    const task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .where('t.id', taskId)
      .select('t.title', 'p.name as project_name', 'p.id as project_id')
      .first();

    const assignedByUser = await db('users')
      .where('id', assignedBy)
      .select('first_name', 'last_name')
      .first();

    if (task && assignedByUser) {
      await this.createNotification({
        user_id: assigneeId,
        type: 'task_assigned',
        title: 'New Task Assignment',
        message: `${assignedByUser.first_name} ${assignedByUser.last_name} assigned you to "${task.title}" in ${task.project_name}`,
        data: { task_id: taskId, project_id: task.project_id },
        related_task_id: taskId,
        related_project_id: task.project_id,
        triggered_by: assignedBy,
      });
    }
  }

  async notifyTaskStatusChanged(taskId: string, newStatus: string, changedBy: string): Promise<void> {
    const taskData = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .leftJoin('users as assignee', 't.assignee_id', 'assignee.id')
      .where('t.id', taskId)
      .select(
        't.title',
        't.assignee_id',
        't.reporter_id',
        'p.name as project_name',
        'p.id as project_id'
      )
      .first();

    const changedByUser = await db('users')
      .where('id', changedBy)
      .select('first_name', 'last_name')
      .first();

    if (!taskData || !changedByUser) return;

    const statusMessages = {
      'todo': 'moved to To Do',
      'in_progress': 'started working on',
      'in_review': 'submitted for review',
      'done': 'completed',
      'cancelled': 'cancelled',
    };

    const message = `${changedByUser.first_name} ${changedByUser.last_name} ${statusMessages[newStatus as keyof typeof statusMessages]} "${taskData.title}"`;

    const notifyUserIds = new Set([taskData.assignee_id, taskData.reporter_id].filter(id => id && id !== changedBy));

    for (const userId of notifyUserIds) {
      await this.createNotification({
        user_id: userId,
        type: 'task_updated',
        title: 'Task Status Updated',
        message,
        data: { task_id: taskId, project_id: taskData.project_id, new_status: newStatus },
        related_task_id: taskId,
        related_project_id: taskData.project_id,
        triggered_by: changedBy,
      });
    }

    this.socketManager.emitToTask(taskId, 'task_status_changed', {
      task_id: taskId,
      new_status: newStatus,
      changed_by: {
        id: changedBy,
        name: `${changedByUser.first_name} ${changedByUser.last_name}`,
      },
    });
  }

  async notifyTaskCommented(taskId: string, commentId: string, commentedBy: string): Promise<void> {
    const taskData = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .where('t.id', taskId)
      .select(
        't.title',
        't.assignee_id',
        't.reporter_id',
        'p.name as project_name',
        'p.id as project_id'
      )
      .first();

    const commentedByUser = await db('users')
      .where('id', commentedBy)
      .select('first_name', 'last_name')
      .first();

    if (!taskData || !commentedByUser) return;

    const message = `${commentedByUser.first_name} ${commentedByUser.last_name} commented on "${taskData.title}"`;

    const notifyUserIds = new Set([taskData.assignee_id, taskData.reporter_id].filter(id => id && id !== commentedBy));

    for (const userId of notifyUserIds) {
      await this.createNotification({
        user_id: userId,
        type: 'task_commented',
        title: 'New Comment',
        message,
        data: { task_id: taskId, comment_id: commentId, project_id: taskData.project_id },
        related_task_id: taskId,
        related_project_id: taskData.project_id,
        triggered_by: commentedBy,
      });
    }

    this.socketManager.emitToTask(taskId, 'task_commented', {
      task_id: taskId,
      comment_id: commentId,
      commented_by: {
        id: commentedBy,
        name: `${commentedByUser.first_name} ${commentedByUser.last_name}`,
      },
    });
  }

  async notifyProjectUpdated(projectId: string, updatedBy: string): Promise<void> {
    const projectData = await db('projects as p')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('p.id', projectId)
      .select('p.name', 'tm.user_id')
      .then(results => ({
        name: results[0]?.name,
        memberIds: results.map(r => r.user_id).filter(id => id !== updatedBy),
      }));

    const updatedByUser = await db('users')
      .where('id', updatedBy)
      .select('first_name', 'last_name')
      .first();

    if (!projectData.name || !updatedByUser) return;

    const message = `${updatedByUser.first_name} ${updatedByUser.last_name} updated project "${projectData.name}"`;

    for (const userId of projectData.memberIds) {
      await this.createNotification({
        user_id: userId,
        type: 'project_updated',
        title: 'Project Updated',
        message,
        data: { project_id: projectId },
        related_project_id: projectId,
        triggered_by: updatedBy,
      });
    }

    this.socketManager.emitToProject(projectId, 'project_updated', {
      project_id: projectId,
      updated_by: {
        id: updatedBy,
        name: `${updatedByUser.first_name} ${updatedByUser.last_name}`,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const updated = await db('notifications')
      .where({ id: notificationId, user_id: userId })
      .update({ is_read: true })
      .returning('id');

    return updated.length > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const updated = await db('notifications')
      .where({ user_id: userId, is_read: false })
      .update({ is_read: true });

    return updated;
  }

  async getUserNotifications(userId: string, page = 1, limit = 20, unreadOnly = false): Promise<{
    notifications: Notification[];
    unreadCount: number;
    pagination: any;
  }> {
    const offset = (page - 1) * limit;
    
    let query = db('notifications').where('user_id', userId);
    
    if (unreadOnly) {
      query = query.where('is_read', false);
    }

    const notifications = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await query.count('* as count');
    const [{ count: unreadCount }] = await db('notifications')
      .where({ user_id: userId, is_read: false })
      .count('* as count');

    return {
      notifications,
      unreadCount: Number(unreadCount),
      pagination: {
        page,
        limit,
        total: Number(count),
        pages: Math.ceil(Number(count) / limit),
      },
    };
  }
}

export default NotificationService;