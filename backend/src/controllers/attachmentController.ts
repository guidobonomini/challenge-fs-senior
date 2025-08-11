import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'attachments');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Define allowed file types
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip', 'application/x-zip-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export const uploadTaskAttachment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { taskId } = req.params;
  
  if (!req.file) {
    throw createError('No file uploaded', 400);
  }

  // Check if user has access to the task
  let task;
  if (userRole === 'admin') {
    task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('teams as team', 'p.team_id', 'team.id')
      .where('t.id', taskId)
      .where('t.is_archived', false)
      .where('team.is_active', true)
      .select('t.*', 'p.name as project_name')
      .first();
  } else {
    task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('t.id', taskId)
      .where('tm.user_id', userId)
      .where('t.is_archived', false)
      .select('t.*', 'p.name as project_name')
      .first();
  }

  if (!task) {
    // Clean up uploaded file if task access denied
    fs.unlinkSync(req.file.path);
    throw createError('Task not found or access denied', 404);
  }

  const attachmentId = uuidv4();
  const fileUrl = `/api/attachments/${attachmentId}/download`;

  const [attachment] = await db('attachments')
    .insert({
      id: attachmentId,
      task_id: taskId,
      user_id: userId,
      filename: req.file.filename,
      original_filename: req.file.originalname,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      file_path: req.file.path,
      file_url: fileUrl,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning([
      'id', 'task_id', 'filename', 'original_filename', 
      'mime_type', 'file_size', 'file_url', 'created_at'
    ]);

  // Get uploader info
  const uploader = await db('users')
    .where('id', userId)
    .select('id', 'first_name', 'last_name', 'email', 'avatar_url')
    .first();

  logger.info('Attachment uploaded:', { 
    attachmentId, 
    taskId, 
    userId, 
    filename: req.file.originalname,
    size: req.file.size 
  });

  // Emit WebSocket event for real-time updates
  const socketManager = (req as any).app.locals.socketManager;
  if (socketManager) {
    // Get all users in the project except the uploader
    const projectMembers = await db('team_members as tm')
      .join('projects as p', 'tm.team_id', 'p.team_id')
      .where('p.id', task.project_id)
      .where('tm.user_id', '!=', userId)
      .select('tm.user_id');

    const eventData = {
      attachment_id: attachmentId,
      task_id: taskId,
      task_title: task.title,
      project_name: task.project_name,
      uploaded_by: uploader,
      attachment: {
        ...attachment,
        uploader,
      },
    };

    // Emit to each project member individually
    projectMembers.forEach(member => {
      if (socketManager.isUserConnected(member.user_id)) {
        socketManager.emitToUser(member.user_id, 'attachment_uploaded', eventData);
      }
    });
  }

  res.status(201).json({
    message: 'File uploaded successfully',
    attachment: {
      ...attachment,
      uploader,
    },
  });
});

export const getTaskAttachments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { taskId } = req.params;

  // Check if user has access to the task
  let hasAccess = false;
  if (userRole === 'admin') {
    const task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('teams as team', 'p.team_id', 'team.id')
      .where('t.id', taskId)
      .where('t.is_archived', false)
      .where('team.is_active', true)
      .first();
    hasAccess = !!task;
  } else {
    const task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('t.id', taskId)
      .where('tm.user_id', userId)
      .where('t.is_archived', false)
      .first();
    hasAccess = !!task;
  }

  if (!hasAccess) {
    throw createError('Task not found or access denied', 404);
  }

  const attachments = await db('attachments as a')
    .join('users as u', 'a.user_id', 'u.id')
    .where('a.task_id', taskId)
    .select(
      'a.id', 'a.task_id', 'a.filename', 'a.original_filename',
      'a.mime_type', 'a.file_size', 'a.file_url', 'a.created_at',
      'u.id as uploader_id', 'u.first_name', 'u.last_name', 'u.email', 'u.avatar_url'
    )
    .orderBy('a.created_at', 'desc');

  const attachmentsWithUploader = attachments.map(attachment => ({
    id: attachment.id,
    task_id: attachment.task_id,
    filename: attachment.filename,
    original_filename: attachment.original_filename,
    mime_type: attachment.mime_type,
    file_size: attachment.file_size,
    file_url: attachment.file_url,
    created_at: attachment.created_at,
    uploader: {
      id: attachment.uploader_id,
      first_name: attachment.first_name,
      last_name: attachment.last_name,
      email: attachment.email,
      avatar_url: attachment.avatar_url,
    },
  }));

  res.json({
    attachments: attachmentsWithUploader,
  });
});

export const downloadAttachment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { attachmentId } = req.params;

  // Get attachment with task info
  const attachment = await db('attachments as a')
    .join('tasks as t', 'a.task_id', 't.id')
    .where('a.id', attachmentId)
    .where('t.is_archived', false)
    .select('a.*', 't.project_id')
    .first();

  if (!attachment) {
    throw createError('Attachment not found', 404);
  }

  // Check if user has access to the task
  let hasAccess = false;
  if (userRole === 'admin') {
    hasAccess = true;
  } else {
    const task = await db('tasks as t')
      .join('projects as p', 't.project_id', 'p.id')
      .join('team_members as tm', 'p.team_id', 'tm.team_id')
      .where('t.project_id', attachment.project_id)
      .where('tm.user_id', userId)
      .first();
    hasAccess = !!task;
  }

  if (!hasAccess) {
    throw createError('Access denied', 403);
  }

  // Check if file exists
  if (!fs.existsSync(attachment.file_path)) {
    throw createError('File not found on server', 404);
  }

  // Set appropriate headers
  res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_filename}"`);
  res.setHeader('Content-Type', attachment.mime_type);
  res.setHeader('Content-Length', attachment.file_size);

  // Stream the file
  const fileStream = fs.createReadStream(attachment.file_path);
  fileStream.pipe(res);

  logger.info('Attachment downloaded:', { attachmentId, userId, filename: attachment.original_filename });
});

export const deleteAttachment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { attachmentId } = req.params;

  // Get attachment with task info
  const attachment = await db('attachments as a')
    .join('tasks as t', 'a.task_id', 't.id')
    .where('a.id', attachmentId)
    .where('t.is_archived', false)
    .select('a.*', 't.project_id')
    .first();

  if (!attachment) {
    throw createError('Attachment not found', 404);
  }

  // Check permissions - only uploader, admins, or team managers can delete
  let canDelete = false;
  if (userRole === 'admin' || attachment.user_id === userId) {
    canDelete = true;
  } else {
    // Check if user is team manager
    const teamMember = await db('team_members as tm')
      .join('projects as p', 'tm.team_id', 'p.team_id')
      .where('p.id', attachment.project_id)
      .where('tm.user_id', userId)
      .where('tm.role', 'manager')
      .first();
    canDelete = !!teamMember;
  }

  if (!canDelete) {
    throw createError('Access denied', 403);
  }

  // Delete from database
  await db('attachments').where('id', attachmentId).del();

  // Delete file from filesystem
  if (fs.existsSync(attachment.file_path)) {
    fs.unlinkSync(attachment.file_path);
  }

  logger.info('Attachment deleted:', { attachmentId, userId, filename: attachment.original_filename });

  // Emit WebSocket event for real-time updates
  const socketManager = (req as any).app.locals.socketManager;
  if (socketManager) {
    const projectMembers = await db('team_members as tm')
      .join('projects as p', 'tm.team_id', 'p.team_id')
      .where('p.id', attachment.project_id)
      .where('tm.user_id', '!=', userId)
      .select('tm.user_id');

    const eventData = {
      attachment_id: attachmentId,
      task_id: attachment.task_id,
      deleted_by: userId,
    };

    projectMembers.forEach(member => {
      if (socketManager.isUserConnected(member.user_id)) {
        socketManager.emitToUser(member.user_id, 'attachment_deleted', eventData);
      }
    });
  }

  res.json({
    message: 'Attachment deleted successfully',
  });
});