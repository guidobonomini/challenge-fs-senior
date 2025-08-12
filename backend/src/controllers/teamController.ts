import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, Team, TeamMember } from '../types';
import { logger } from '../utils/logger';

export const createTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, description } = req.body;

  const teamId = uuidv4();
  
  await db.transaction(async (trx) => {
    const [team] = await trx('teams')
      .insert({
        id: teamId,
        name,
        description,
        owner_id: userId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id', 'name', 'description', 'owner_id', 'created_at']);

    await trx('team_members').insert({
      id: uuidv4(),
      team_id: teamId,
      user_id: userId,
      role: 'admin',
      joined_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });

    logger.info('Team created:', { teamId, userId, name });

    res.status(201).json({
      message: 'Team created successfully',
      team,
    });
  });
});

export const getTeams = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { page = 1, limit = 20 } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  let teams;
  let total;

  // Global administrators can see all teams
  if (userRole === 'admin') {
    teams = await db('teams as t')
      .leftJoin('team_members as tm', 't.id', 'tm.team_id')
      .leftJoin('projects as p', function() {
        this.on('t.id', '=', 'p.team_id').andOn('p.is_archived', '=', db.raw('false'));
      })
      .where('t.is_active', true)
      .groupBy('t.id', 't.name', 't.description', 't.owner_id', 't.avatar_url', 't.created_at', 't.updated_at')
      .select(
        't.id',
        't.name',
        't.description',
        't.owner_id',
        't.avatar_url',
        't.is_active',
        't.created_at',
        't.updated_at',
        db.raw('\'admin\' as member_role'),
        db.raw('null as joined_at'),
        db.raw('COUNT(DISTINCT tm.id) as member_count'),
        db.raw('COUNT(DISTINCT p.id) as project_count')
      )
      .orderBy('t.created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    total = await db('teams as t')
      .where('t.is_active', true)
      .count('* as count')
      .first();
  } else {
    // Regular users only see teams they're members of
    teams = await db('teams as t')
      .join('team_members as tm', 't.id', 'tm.team_id')
      .leftJoin('team_members as all_tm', 't.id', 'all_tm.team_id')
      .leftJoin('projects as p', function() {
        this.on('t.id', '=', 'p.team_id').andOn('p.is_archived', '=', db.raw('false'));
      })
      .where('tm.user_id', userId)
      .where('t.is_active', true)
      .groupBy('t.id', 't.name', 't.description', 't.owner_id', 't.avatar_url', 't.created_at', 't.updated_at', 'tm.role', 'tm.joined_at')
      .select(
        't.id',
        't.name',
        't.description',
        't.owner_id',
        't.avatar_url',
        't.is_active',
        't.created_at',
        't.updated_at',
        'tm.role as member_role',
        'tm.joined_at',
        db.raw('COUNT(DISTINCT all_tm.id) as member_count'),
        db.raw('COUNT(DISTINCT p.id) as project_count')
      )
      .orderBy('t.created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    total = await db('teams as t')
      .join('team_members as tm', 't.id', 'tm.team_id')
      .where('tm.user_id', userId)
      .where('t.is_active', true)
      .count('* as count')
      .first();
  }

  // Fetch members for each team (limited to first 5 for performance)
  const teamIds = teams.map((team: any) => team.id);
  const allMembers = await db('team_members as tm')
    .join('users as u', 'tm.user_id', 'u.id')
    .whereIn('tm.team_id', teamIds)
    .select(
      'tm.team_id',
      'tm.user_id',
      'u.first_name',
      'u.last_name',
      'u.email',
      'u.avatar_url',
      'tm.role'
    )
    .orderBy('tm.joined_at', 'asc');

  // Group members by team_id
  const membersByTeam = allMembers.reduce((acc: any, member: any) => {
    if (!acc[member.team_id]) {
      acc[member.team_id] = [];
    }
    acc[member.team_id].push({
      user_id: member.user_id,
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      avatar_url: member.avatar_url,
      role: member.role,
    });
    return acc;
  }, {});

  // Add members to each team
  const teamsWithMembers = teams.map((team: any) => ({
    ...team,
    member_count: Number(team.member_count || 0),
    project_count: Number(team.project_count || 0),
    members: membersByTeam[team.id] || [],
  }));

  res.json({
    teams: teamsWithMembers,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total?.count || 0),
      pages: Math.ceil(Number(total?.count || 0) / Number(limit)),
    },
  });
});

export const getTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { id } = req.params;

  let team;

  // Global administrators can access any team
  if (userRole === 'admin') {
    team = await db('teams as t')
      .where('t.id', id)
      .where('t.is_active', true)
      .select(
        't.id',
        't.name',
        't.description',
        't.owner_id',
        't.avatar_url',
        't.created_at',
        't.updated_at',
        db.raw('null as member_role')
      )
      .first();
  } else {
    // Regular users can only access teams they're members of
    team = await db('teams as t')
      .join('team_members as tm', 't.id', 'tm.team_id')
      .where('t.id', id)
      .where('tm.user_id', userId)
      .where('t.is_active', true)
      .select(
        't.id',
        't.name',
        't.description',
        't.owner_id',
        't.avatar_url',
        't.created_at',
        't.updated_at',
        'tm.role as member_role'
      )
      .first();
  }

  if (!team) {
    throw createError('Team not found or access denied', 404);
  }

  const members = await db('team_members as tm')
    .join('users as u', 'tm.user_id', 'u.id')
    .where('tm.team_id', id)
    .select(
      'tm.id as membership_id',
      'u.id',
      'u.email',
      'u.first_name',
      'u.last_name',
      'u.avatar_url',
      'tm.role',
      'tm.joined_at'
    )
    .orderBy('tm.joined_at', 'asc');

  res.json({
    team: { ...team, members },
  });
});

export const updateTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { id } = req.params;
  const { name, description, avatar_url } = req.body;

  // Global administrators can update any team
  let hasPermission = false;
  let userMemberRole = null;
  
  if (userRole === 'admin') {
    hasPermission = true;
  } else {
    const teamMember = await db('team_members')
      .where({ team_id: id, user_id: userId })
      .whereIn('role', ['admin', 'manager'])
      .first();
    hasPermission = !!teamMember;
    userMemberRole = teamMember?.role || null;
  }

  if (!hasPermission) {
    throw createError('Access denied. Insufficient permissions.', 403);
  }

  // First, get the existing team to ensure it exists and is active
  const existingTeam = await db('teams')
    .where({ id, is_active: true })
    .first();

  if (!existingTeam) {
    throw createError('Team not found or inactive', 404);
  }

  const [updatedTeam] = await db('teams')
    .where({ id, is_active: true })
    .update({
      name,
      description,
      avatar_url,
      updated_at: new Date(),
    })
    .returning(['id', 'name', 'description', 'avatar_url', 'owner_id', 'is_active', 'created_at', 'updated_at']);

  // Include the user's member role in the response for frontend permissions
  const responseTeam = {
    ...updatedTeam,
    member_role: userMemberRole,
  };

  logger.info('Team updated:', { teamId: id, userId });

  res.json({
    message: 'Team updated successfully',
    team: responseTeam,
  });
});

export const deleteTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const team = await db('teams')
    .where({ id, owner_id: userId, is_active: true })
    .first();

  if (!team) {
    throw createError('Team not found or access denied', 404);
  }

  await db('teams')
    .where({ id })
    .update({ is_active: false, updated_at: new Date() });

  logger.info('Team deleted:', { teamId: id, userId });

  res.json({ message: 'Team deleted successfully' });
});

export const addTeamMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { email, user_id, role = 'member' } = req.body;

  const teamMember = await db('team_members')
    .where({ team_id: id, user_id: userId })
    .whereIn('role', ['admin', 'manager'])
    .first();

  if (!teamMember) {
    throw createError('Access denied. Insufficient permissions.', 403);
  }

  let user;
  if (user_id) {
    // If user_id is provided, find user by ID
    user = await db('users')
      .where({ id: user_id, is_active: true })
      .select('id', 'email', 'first_name', 'last_name')
      .first();
  } else if (email) {
    // If email is provided, find user by email
    user = await db('users')
      .where({ email, is_active: true })
      .select('id', 'email', 'first_name', 'last_name')
      .first();
  } else {
    throw createError('Either user_id or email must be provided', 400);
  }

  if (!user) {
    throw createError('User not found', 404);
  }

  const existingMember = await db('team_members')
    .where({ team_id: id, user_id: user.id })
    .first();

  if (existingMember) {
    throw createError('User is already a member of this team', 409);
  }

  const [newMember] = await db('team_members')
    .insert({
      id: uuidv4(),
      team_id: id,
      user_id: user.id,
      role,
      joined_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning(['id', 'role', 'joined_at']);

  logger.info('Team member added:', { teamId: id, newUserId: user.id, addedBy: userId });

  res.status(201).json({
    message: 'Team member added successfully',
    member: {
      ...newMember,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    },
  });
});

export const updateTeamMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id, memberId } = req.params;
  const { role } = req.body;

  const teamMember = await db('team_members')
    .where({ team_id: id, user_id: userId })
    .where('role', 'admin')
    .first();

  if (!teamMember) {
    throw createError('Access denied. Only team admins can update member roles.', 403);
  }

  const [updatedMember] = await db('team_members')
    .where({ id: memberId, team_id: id })
    .update({ role, updated_at: new Date() })
    .returning(['id', 'role', 'updated_at']);

  logger.info('Team member role updated:', { teamId: id, memberId, newRole: role, updatedBy: userId });

  res.json({
    message: 'Team member role updated successfully',
    member: updatedMember,
  });
});

export const removeTeamMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id, memberId } = req.params;

  const teamMember = await db('team_members')
    .where({ team_id: id, user_id: userId })
    .whereIn('role', ['admin', 'manager'])
    .first();

  const targetMember = await db('team_members')
    .where({ id: memberId, team_id: id })
    .first();

  if (!teamMember || !targetMember) {
    throw createError('Access denied or member not found', 403);
  }

  const team = await db('teams').where({ id }).first();
  if (team.owner_id === targetMember.user_id) {
    throw createError('Cannot remove team owner', 400);
  }

  await db('team_members')
    .where({ id: memberId, team_id: id })
    .del();

  logger.info('Team member removed:', { teamId: id, memberId, removedBy: userId });

  res.json({ message: 'Team member removed successfully' });
});

export const removeTeamMemberByUserId = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id, userId: targetUserId } = req.params;

  const teamMember = await db('team_members')
    .where({ team_id: id, user_id: userId })
    .whereIn('role', ['admin', 'manager'])
    .first();

  if (!teamMember) {
    throw createError('Access denied. Insufficient permissions.', 403);
  }

  const targetMember = await db('team_members')
    .where({ team_id: id, user_id: targetUserId })
    .first();

  if (!targetMember) {
    throw createError('Member not found', 404);
  }

  const team = await db('teams').where({ id }).first();
  if (team.owner_id === targetUserId) {
    throw createError('Cannot remove team owner', 400);
  }

  await db('team_members')
    .where({ team_id: id, user_id: targetUserId })
    .del();

  logger.info('Team member removed by user ID:', { teamId: id, targetUserId, removedBy: userId });

  res.json({ message: 'Team member removed successfully' });
});

export const updateTeamMemberByUserId = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id, userId: targetUserId } = req.params;
  const { role } = req.body;

  const teamMember = await db('team_members')
    .where({ team_id: id, user_id: userId })
    .where('role', 'admin')
    .first();

  if (!teamMember) {
    throw createError('Access denied. Only team admins can update member roles.', 403);
  }

  const [updatedMember] = await db('team_members')
    .where({ team_id: id, user_id: targetUserId })
    .update({ role, updated_at: new Date() })
    .returning(['id', 'role', 'updated_at']);

  if (!updatedMember) {
    throw createError('Member not found', 404);
  }

  logger.info('Team member role updated by user ID:', { teamId: id, targetUserId, newRole: role, updatedBy: userId });

  res.json({
    message: 'Team member role updated successfully',
    member: updatedMember,
  });
});

export const getTeamMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { id } = req.params;

  // Global administrators can access any team's members
  let hasAccess = false;
  if (userRole === 'admin') {
    hasAccess = true;
  } else {
    // Check if user is a member of this team
    const teamMember = await db('team_members')
      .where({ team_id: id, user_id: userId })
      .first();
    hasAccess = !!teamMember;
  }

  if (!hasAccess) {
    throw createError('Access denied. You are not a member of this team.', 403);
  }

  const members = await db('team_members as tm')
    .join('users as u', 'tm.user_id', 'u.id')
    .where('tm.team_id', id)
    .select(
      'tm.id',
      'tm.team_id',
      'tm.user_id',
      'tm.role',
      'tm.joined_at',
      'u.first_name',
      'u.last_name',
      'u.email',
      'u.avatar_url'
    )
    .orderBy('tm.joined_at', 'asc');

  res.json({
    members,
  });
});

export const leaveTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const team = await db('teams').where({ id }).first();
  if (team.owner_id === userId) {
    throw createError('Team owner cannot leave the team. Transfer ownership first.', 400);
  }

  const deleted = await db('team_members')
    .where({ team_id: id, user_id: userId })
    .del();

  if (!deleted) {
    throw createError('You are not a member of this team', 404);
  }

  logger.info('User left team:', { teamId: id, userId });

  res.json({ message: 'Successfully left the team' });
});