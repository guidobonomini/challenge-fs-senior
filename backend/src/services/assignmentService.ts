import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../utils/logger';

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  assigned_by: string;
  role: 'assignee' | 'reviewer' | 'collaborator';
  notes?: string;
  assigned_at: Date;
  unassigned_at?: Date;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface AssignmentHistory {
  id: string;
  task_id: string;
  user_id: string;
  changed_by: string;
  action: 'assigned' | 'unassigned' | 'role_changed';
  previous_role?: 'assignee' | 'reviewer' | 'collaborator';
  new_role?: 'assignee' | 'reviewer' | 'collaborator';
  notes?: string;
  created_at: Date;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  changed_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface UserWorkload {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  total_tasks: number;
  active_tasks: number;
  high_priority_tasks: number;
  overdue_tasks: number;
  workload_score: number; // Calculated metric for assignment suggestions
}

export class AssignmentService {
  async assignUsersToTask(
    taskId: string,
    assignments: Array<{
      user_id: string;
      role?: 'assignee' | 'reviewer' | 'collaborator';
      notes?: string;
    }>,
    assignedBy: string
  ): Promise<TaskAssignment[]> {
    const trx = await db.transaction();
    
    try {
      const results: TaskAssignment[] = [];
      
      for (const assignment of assignments) {
        const assignmentId = uuidv4();
        const role = assignment.role || 'assignee';
        
        // Check if assignment already exists
        const existingAssignment = await trx('task_assignments')
          .where({ 
            task_id: taskId, 
            user_id: assignment.user_id, 
            role: role 
          })
          .whereNull('unassigned_at')
          .first();
        
        if (existingAssignment) {
          continue; // Skip if already assigned with same role
        }
        
        // Create assignment
        const [newAssignment] = await trx('task_assignments')
          .insert({
            id: assignmentId,
            task_id: taskId,
            user_id: assignment.user_id,
            assigned_by: assignedBy,
            role: role,
            notes: assignment.notes,
            assigned_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning(['*']);
        
        // Log assignment history
        await trx('assignment_history').insert({
          id: uuidv4(),
          task_id: taskId,
          user_id: assignment.user_id,
          changed_by: assignedBy,
          action: 'assigned',
          new_role: role,
          notes: assignment.notes,
          created_at: new Date(),
          updated_at: new Date(),
        });
        
        results.push(newAssignment);
      }
      
      // Update task's assignee_id field with primary assignee
      const primaryAssignee = results.find(a => a.role === 'assignee');
      if (primaryAssignee) {
        await trx('tasks')
          .where('id', taskId)
          .update({
            assignee_id: primaryAssignee.user_id,
            updated_at: new Date(),
          });
      }
      
      await trx.commit();
      
      // Return with user details
      return this.getTaskAssignments(taskId);
    } catch (error) {
      await trx.rollback();
      logger.error('Error assigning users to task:', error);
      throw error;
    }
  }
  
  async unassignUserFromTask(
    taskId: string,
    userId: string,
    role: 'assignee' | 'reviewer' | 'collaborator',
    unassignedBy: string,
    notes?: string
  ): Promise<void> {
    const trx = await db.transaction();
    
    try {
      // Find active assignment
      const assignment = await trx('task_assignments')
        .where({ 
          task_id: taskId, 
          user_id: userId, 
          role: role 
        })
        .whereNull('unassigned_at')
        .first();
      
      if (!assignment) {
        throw new Error('Assignment not found');
      }
      
      // Mark as unassigned
      await trx('task_assignments')
        .where('id', assignment.id)
        .update({
          unassigned_at: new Date(),
          updated_at: new Date(),
        });
      
      // Log history
      await trx('assignment_history').insert({
        id: uuidv4(),
        task_id: taskId,
        user_id: userId,
        changed_by: unassignedBy,
        action: 'unassigned',
        previous_role: role,
        notes: notes,
        created_at: new Date(),
        updated_at: new Date(),
      });
      
      // Update task's assignee_id if removing primary assignee
      if (role === 'assignee') {
        await trx('tasks')
          .where('id', taskId)
          .update({
            assignee_id: null,
            updated_at: new Date(),
          });
      }
      
      await trx.commit();
    } catch (error) {
      await trx.rollback();
      logger.error('Error unassigning user from task:', error);
      throw error;
    }
  }
  
  async getTaskAssignments(taskId: string): Promise<TaskAssignment[]> {
    const assignments = await db('task_assignments as ta')
      .join('users as u', 'ta.user_id', 'u.id')
      .where('ta.task_id', taskId)
      .whereNull('ta.unassigned_at')
      .select(
        'ta.*',
        'u.first_name',
        'u.last_name', 
        'u.email',
        'u.avatar_url'
      )
      .orderBy('ta.assigned_at', 'asc');
    
    return assignments.map(assignment => ({
      ...assignment,
      user: {
        id: assignment.user_id,
        first_name: assignment.first_name,
        last_name: assignment.last_name,
        email: assignment.email,
        avatar_url: assignment.avatar_url,
      }
    }));
  }
  
  async getAssignmentHistory(taskId: string): Promise<AssignmentHistory[]> {
    const history = await db('assignment_history as ah')
      .join('users as u', 'ah.user_id', 'u.id')
      .join('users as cb', 'ah.changed_by', 'cb.id')
      .where('ah.task_id', taskId)
      .select(
        'ah.*',
        'u.first_name as user_first_name',
        'u.last_name as user_last_name',
        'u.email as user_email',
        'cb.first_name as changed_by_first_name',
        'cb.last_name as changed_by_last_name',
        'cb.email as changed_by_email'
      )
      .orderBy('ah.created_at', 'desc');
    
    return history.map(item => ({
      ...item,
      user: {
        id: item.user_id,
        first_name: item.user_first_name,
        last_name: item.user_last_name,
        email: item.user_email,
      },
      changed_by_user: {
        id: item.changed_by,
        first_name: item.changed_by_first_name,
        last_name: item.changed_by_last_name,
        email: item.changed_by_email,
      }
    }));
  }
  
  async getTeamWorkloads(teamId: string): Promise<UserWorkload[]> {
    const workloads = await db('team_members as tm')
      .join('users as u', 'tm.user_id', 'u.id')
      .leftJoin('task_assignments as ta', function() {
        this.on('u.id', 'ta.user_id')
          .andOnNull('ta.unassigned_at');
      })
      .leftJoin('tasks as t', function() {
        this.on('ta.task_id', 't.id')
          .andOn('t.is_archived', '=', db.raw('false'));
      })
      .leftJoin('projects as p', 't.project_id', 'p.id')
      .where('tm.team_id', teamId)
      .where('u.is_active', true)
      .groupBy('u.id', 'u.first_name', 'u.last_name', 'u.email', 'u.avatar_url')
      .select([
        'u.id as user_id',
        'u.first_name',
        'u.last_name',
        'u.email',
        'u.avatar_url',
        db.raw('COUNT(DISTINCT ta.id) as total_tasks'),
        db.raw('COUNT(DISTINCT CASE WHEN t.status IN (\'todo\', \'in_progress\', \'in_review\') THEN ta.id END) as active_tasks'),
        db.raw('COUNT(DISTINCT CASE WHEN t.priority IN (\'high\', \'critical\') AND t.status IN (\'todo\', \'in_progress\', \'in_review\') THEN ta.id END) as high_priority_tasks'),
        db.raw('COUNT(DISTINCT CASE WHEN t.due_date < NOW() AND t.status IN (\'todo\', \'in_progress\', \'in_review\') THEN ta.id END) as overdue_tasks')
      ]);
    
    // Calculate workload scores
    return workloads.map((workload: any) => {
      const activeTasks = parseInt(workload.active_tasks) || 0;
      const highPriorityTasks = parseInt(workload.high_priority_tasks) || 0;
      const overdueTasks = parseInt(workload.overdue_tasks) || 0;
      
      // Workload score calculation (lower is better for assignment suggestions)
      const workloadScore = (activeTasks * 1) + (highPriorityTasks * 2) + (overdueTasks * 3);
      
      return {
        ...workload,
        total_tasks: parseInt(workload.total_tasks) || 0,
        active_tasks: activeTasks,
        high_priority_tasks: highPriorityTasks,
        overdue_tasks: overdueTasks,
        workload_score: workloadScore,
      };
    });
  }
  
  async getAssignmentSuggestions(
    taskId: string, 
    teamId: string,
    limit: number = 5
  ): Promise<UserWorkload[]> {
    const workloads = await this.getTeamWorkloads(teamId);
    
    // Sort by workload score (ascending - lower is better)
    return workloads
      .sort((a, b) => a.workload_score - b.workload_score)
      .slice(0, limit);
  }
  
  async getUserAssignedTasks(userId: string, status?: string[]): Promise<any[]> {
    let query = db('task_assignments as ta')
      .join('tasks as t', 'ta.task_id', 't.id')
      .join('projects as p', 't.project_id', 'p.id')
      .where('ta.user_id', userId)
      .whereNull('ta.unassigned_at')
      .where('t.is_archived', false);
    
    if (status && status.length > 0) {
      query = query.whereIn('t.status', status);
    }
    
    return query.select([
      't.*',
      'p.name as project_name',
      'ta.role as assignment_role',
      'ta.assigned_at'
    ]).orderBy('ta.assigned_at', 'desc');
  }
}

export const assignmentService = new AssignmentService();