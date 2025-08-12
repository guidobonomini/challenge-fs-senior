import { Response } from 'express';
import db from '../config/database';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

export const getCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 100 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const [categories, totalResult] = await Promise.all([
      db('categories')
        .select('id', 'name', 'description', 'color', 'created_at', 'updated_at')
        .orderBy('name', 'asc')
        .limit(Number(limit))
        .offset(offset),
      
      db('categories')
        .count('id as total')
        .first()
    ]);

    const total = Number(totalResult?.total || 0);
    const pages = Math.ceil(total / Number(limit));

    res.json({
      categories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages,
      },
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    throw createError('Failed to fetch categories', 500);
  }
});

export const getCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const category = await db('categories')
      .where('id', id)
      .select('id', 'name', 'description', 'color', 'created_at', 'updated_at')
      .first();

    if (!category) {
      throw createError('Category not found', 404);
    }

    res.json({
      category,
    });
  } catch (error) {
    logger.error('Get category error:', error);
    throw createError('Failed to fetch category', 500);
  }
});

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, color = '#3B82F6' } = req.body;
  const userId = req.user!.id;

  if (!name) {
    throw createError('Category name is required', 400);
  }

  try {
    const existingCategory = await db('categories')
      .where('name', name)
      .first();

    if (existingCategory) {
      throw createError('Category name already exists', 409);
    }

    const [category] = await db('categories')
      .insert({
        name,
        description,
        color,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id', 'name', 'description', 'color', 'created_at', 'updated_at']);

    logger.info('Category created:', { categoryId: category.id, name, userId });

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error: any) {
    logger.error('Create category error:', error);
    if (error.status) {
      throw error;
    }
    throw createError('Failed to create category', 500);
  }
});

export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, color } = req.body;
  const userId = req.user!.id;

  try {
    const existingCategory = await db('categories')
      .where('id', id)
      .first();

    if (!existingCategory) {
      throw createError('Category not found', 404);
    }

    if (name && name !== existingCategory.name) {
      const nameExists = await db('categories')
        .where('name', name)
        .where('id', '!=', id)
        .first();

      if (nameExists) {
        throw createError('Category name already exists', 409);
      }
    }

    const [category] = await db('categories')
      .where('id', id)
      .update({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
        updated_at: new Date(),
      })
      .returning(['id', 'name', 'description', 'color', 'created_at', 'updated_at']);

    logger.info('Category updated:', { categoryId: id, userId });

    res.json({
      message: 'Category updated successfully',
      category,
    });
  } catch (error: any) {
    logger.error('Update category error:', error);
    if (error.status) {
      throw error;
    }
    throw createError('Failed to update category', 500);
  }
});

export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const category = await db('categories')
      .where('id', id)
      .first();

    if (!category) {
      throw createError('Category not found', 404);
    }

    // Check if category is being used by any tasks
    const tasksUsingCategory = await db('tasks')
      .where('category_id', id)
      .count('* as count')
      .first();

    if (Number(tasksUsingCategory?.count || 0) > 0) {
      throw createError('Cannot delete category that is being used by tasks', 400);
    }

    await db('categories')
      .where('id', id)
      .del();

    logger.info('Category deleted:', { categoryId: id, userId });

    res.json({
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete category error:', error);
    if (error.status) {
      throw error;
    }
    throw createError('Failed to delete category', 500);
  }
});