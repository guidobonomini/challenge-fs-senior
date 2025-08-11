import db from '../config/database';
import { logger } from '../utils/logger';
import Anthropic from '@anthropic-ai/sdk';

export interface TaskCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_system: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface AISuggestion {
  category_id: string;
  category_name: string;
  confidence: number;
  reasoning: string;
}

export interface AIAnalysisResult {
  suggestions: AISuggestion[];
  primary_suggestion: AISuggestion | null;
  keywords_detected: string[];
  analysis_timestamp: string;
  model_version: string;
}

/**
 * AI-powered categorization service using Anthropic Claude
 */
class AICategorizationService {
  private readonly MODEL_VERSION = 'claude-3-5-sonnet-20240620';
  private readonly anthropic: Anthropic;
  
  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.warn('ANTHROPIC_API_KEY not found, falling back to mock AI categorization');
      this.anthropic = null as any;
    } else {
      this.anthropic = new Anthropic({
        apiKey,
      });
    }
  }

  /**
   * Get all available task categories
   */
  async getCategories(): Promise<TaskCategory[]> {
    try {
      return await db('task_categories')
        .where('is_active', true)
        .orderBy('sort_order', 'asc')
        .orderBy('name', 'asc');
    } catch (error) {
      logger.error('Failed to fetch task categories:', error);
      throw error;
    }
  }

  /**
   * Create a new task category
   */
  async createCategory(categoryData: Omit<TaskCategory, 'id'>): Promise<TaskCategory> {
    try {
      const [category] = await db('task_categories')
        .insert({
          id: db.raw('gen_random_uuid()'),
          ...categoryData,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');
      
      logger.info('Task category created:', { categoryId: category.id, name: category.name });
      return category;
    } catch (error) {
      logger.error('Failed to create task category:', error);
      throw error;
    }
  }

  /**
   * Update a task category
   */
  async updateCategory(categoryId: string, updates: Partial<TaskCategory>): Promise<TaskCategory> {
    try {
      const [category] = await db('task_categories')
        .where('id', categoryId)
        .update({
          ...updates,
          updated_at: new Date(),
        })
        .returning('*');
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      logger.info('Task category updated:', { categoryId, updates: Object.keys(updates) });
      return category;
    } catch (error) {
      logger.error('Failed to update task category:', error);
      throw error;
    }
  }

  /**
   * Analyze task content using Anthropic Claude AI
   */
  async analyzeTaskContent(
    taskTitle: string, 
    taskDescription?: string,
    taskType?: string
  ): Promise<AIAnalysisResult> {
    try {
      const categories = await this.getCategories();

      // If no API key, use fallback mock analysis
      if (!this.anthropic) {
        return await this.mockAnalyzeTaskContent(taskTitle, taskDescription, taskType, categories);
      }

      // Prepare category information for Claude
      const categoryInfo = categories.map(cat => 
        `- ${cat.name}: ${cat.description || 'No description available'}`
      ).join('\n');

      const prompt = `You are an expert project manager who categorizes software development tasks. 

Available categories:
${categoryInfo}

Task to categorize:
Title: "${taskTitle}"
Description: "${taskDescription || 'No description provided'}"
Type: "${taskType || 'Unknown'}"

Please analyze this task and provide categorization suggestions. Consider:
1. The task title and description content
2. Keywords that indicate specific categories
3. The context and type of work described
4. Common patterns in software development tasks

For each relevant category, provide:
- Category name (exactly as listed above)
- Confidence score (0.0 to 1.0)
- Brief reasoning explaining why this category fits

Respond in JSON format:
{
  "suggestions": [
    {
      "category_name": "Category Name",
      "confidence": 0.85,
      "reasoning": "Brief explanation of why this category fits"
    }
  ],
  "keywords_detected": ["keyword1", "keyword2"],
  "analysis_notes": "Overall analysis of the task"
}

Only suggest categories where confidence is above 0.2. Sort by confidence (highest first).`;

      const response = await this.anthropic.messages.create({
        model: this.MODEL_VERSION,
        max_tokens: 1000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      
      let aiResponse;
      try {
        aiResponse = JSON.parse(responseText);
      } catch (parseError) {
        logger.error('Failed to parse AI response, falling back to mock analysis:', parseError);
        return await this.mockAnalyzeTaskContent(taskTitle, taskDescription, taskType, categories);
      }

      // Map AI suggestions to our format
      const suggestions: AISuggestion[] = [];
      
      for (const suggestion of aiResponse.suggestions || []) {
        const category = categories.find(cat => cat.name === suggestion.category_name);
        if (category && suggestion.confidence >= 0.2) {
          suggestions.push({
            category_id: category.id,
            category_name: category.name,
            confidence: Math.round(suggestion.confidence * 100) / 100,
            reasoning: suggestion.reasoning || 'AI analysis'
          });
        }
      }

      // Sort by confidence
      suggestions.sort((a, b) => b.confidence - a.confidence);

      const analysisResult: AIAnalysisResult = {
        suggestions,
        primary_suggestion: suggestions.length > 0 ? suggestions[0] : null,
        keywords_detected: aiResponse.keywords_detected || [],
        analysis_timestamp: new Date().toISOString(),
        model_version: this.MODEL_VERSION
      };

      logger.info('Task content analyzed with Anthropic Claude:', {
        title: taskTitle.substring(0, 50),
        suggestionsCount: suggestions.length,
        primaryCategory: suggestions[0]?.category_name,
        confidence: suggestions[0]?.confidence
      });

      return analysisResult;
    } catch (error) {
      logger.error('Failed to analyze task content with Anthropic, falling back to mock:', error);
      
      // Fallback to mock analysis
      const categories = await this.getCategories();
      return await this.mockAnalyzeTaskContent(taskTitle, taskDescription, taskType, categories);
    }
  }

  /**
   * Mock analysis fallback when Anthropic API is not available
   */
  private async mockAnalyzeTaskContent(
    taskTitle: string,
    taskDescription?: string,
    taskType?: string,
    categories?: TaskCategory[]
  ): Promise<AIAnalysisResult> {
    if (!categories) {
      categories = await this.getCategories();
    }

    const content = `${taskTitle} ${taskDescription || ''}`.toLowerCase();
    const suggestions: AISuggestion[] = [];
    const detectedKeywords: string[] = [];

    // Keywords for different categories
    const categoryKeywords: Record<string, string[]> = {
      'Bug Fix': [
        'bug', 'error', 'issue', 'fix', 'broken', 'crash', 'exception',
        'problem', 'incorrect', 'wrong', 'fail', 'failure', 'debug'
      ],
      'Feature Development': [
        'feature', 'implement', 'add', 'create', 'build', 'develop',
        'new', 'functionality', 'enhancement', 'requirement'
      ],
      'Documentation': [
        'document', 'readme', 'guide', 'tutorial', 'documentation',
        'write', 'manual', 'help', 'instructions', 'wiki', 'docs'
      ],
      'Testing': [
        'test', 'testing', 'qa', 'quality', 'unit test', 'integration',
        'e2e', 'automation', 'coverage', 'validation', 'verify'
      ],
      'Research': [
        'research', 'investigate', 'analyze', 'study', 'explore',
        'evaluation', 'assessment', 'feasibility', 'comparison'
      ],
      'Maintenance': [
        'refactor', 'cleanup', 'maintenance', 'optimize', 'improve',
        'restructure', 'legacy', 'technical debt', 'code quality'
      ],
      'UI/UX': [
        'ui', 'ux', 'design', 'interface', 'user experience', 'frontend',
        'styling', 'layout', 'responsive', 'accessibility', 'visual'
      ],
      'Performance': [
        'performance', 'optimization', 'speed', 'slow', 'memory',
        'efficiency', 'scalability', 'bottleneck', 'latency'
      ]
    };

    // Analyze content against each category's keywords
    for (const category of categories) {
      const keywords = categoryKeywords[category.name] || [];
      let matches = 0;
      let matchedKeywords: string[] = [];

      for (const keyword of keywords) {
        if (content.includes(keyword.toLowerCase())) {
          matches++;
          matchedKeywords.push(keyword);
          if (!detectedKeywords.includes(keyword)) {
            detectedKeywords.push(keyword);
          }
        }
      }

      if (matches > 0) {
        let baseConfidence = Math.min(matches / keywords.length, 1.0);
        
        // Boost confidence for exact matches in title
        if (matchedKeywords.some(keyword => taskTitle.toLowerCase().includes(keyword))) {
          baseConfidence *= 1.3;
        }

        // Factor in task type if available
        if (taskType) {
          const typeKeywords = this.getTypeKeywords(taskType);
          if (typeKeywords.some(keyword => matchedKeywords.includes(keyword))) {
            baseConfidence *= 1.2;
          }
        }

        const confidence = Math.min(baseConfidence, 1.0);
        
        if (confidence > 0.1) {
          suggestions.push({
            category_id: category.id,
            category_name: category.name,
            confidence: Math.round(confidence * 100) / 100,
            reasoning: `Detected keywords: ${matchedKeywords.join(', ')}`
          });
        }
      }
    }

    suggestions.sort((a, b) => b.confidence - a.confidence);

    return {
      suggestions,
      primary_suggestion: suggestions.length > 0 ? suggestions[0] : null,
      keywords_detected: detectedKeywords,
      analysis_timestamp: new Date().toISOString(),
      model_version: 'mock-v1.0'
    };
  }

  /**
   * Categorize a task using AI analysis
   */
  async categorizeTask(
    taskId: string,
    userId?: string,
    acceptSuggestion: boolean = true
  ): Promise<{ analysis: AIAnalysisResult; categorized: boolean }> {
    try {
      // Get task details
      const task = await db('tasks')
        .where('id', taskId)
        .select('title', 'description', 'type', 'category_id')
        .first();

      if (!task) {
        throw new Error('Task not found');
      }

      // Skip if already categorized (unless forced)
      if (task.category_id) {
        logger.info('Task already categorized, skipping:', { taskId });
        const analysis: AIAnalysisResult = {
          suggestions: [],
          primary_suggestion: null,
          keywords_detected: [],
          analysis_timestamp: new Date().toISOString(),
          model_version: this.MODEL_VERSION
        };
        return { analysis, categorized: false };
      }

      // Analyze task content
      const analysis = await this.analyzeTaskContent(
        task.title,
        task.description,
        task.type
      );

      let categorized = false;

      // Auto-categorize if we have a high-confidence suggestion
      if (acceptSuggestion && analysis.primary_suggestion && analysis.primary_suggestion.confidence >= 0.7) {
        await db('tasks')
          .where('id', taskId)
          .update({
            category_id: analysis.primary_suggestion.category_id,
            ai_confidence_score: analysis.primary_suggestion.confidence,
            ai_suggested_categories: JSON.stringify(analysis.suggestions),
            ai_categorized: true,
            ai_categorized_at: new Date(),
            updated_at: new Date()
          });

        categorized = true;

        // Record in history
        await this.recordCategorizationHistory(
          taskId,
          analysis.primary_suggestion.category_id,
          analysis.primary_suggestion.confidence,
          analysis,
          'suggested',
          userId
        );

        logger.info('Task auto-categorized:', {
          taskId,
          categoryId: analysis.primary_suggestion.category_id,
          confidence: analysis.primary_suggestion.confidence
        });
      } else if (analysis.suggestions.length > 0) {
        // Store suggestions for manual review
        await db('tasks')
          .where('id', taskId)
          .update({
            ai_suggested_categories: JSON.stringify(analysis.suggestions),
            updated_at: new Date()
          });

        logger.info('Task analyzed with suggestions for manual review:', {
          taskId,
          suggestionsCount: analysis.suggestions.length
        });
      }

      return { analysis, categorized };
    } catch (error) {
      logger.error('Failed to categorize task:', error);
      throw error;
    }
  }

  /**
   * Accept an AI categorization suggestion
   */
  async acceptSuggestion(
    taskId: string,
    categoryId: string,
    userId: string,
    feedback?: string
  ): Promise<void> {
    try {
      const task = await db('tasks')
        .where('id', taskId)
        .select('ai_suggested_categories')
        .first();

      if (!task) {
        throw new Error('Task not found');
      }

      let suggestions = [];
      if (task.ai_suggested_categories) {
        try {
          suggestions = JSON.parse(task.ai_suggested_categories);
        } catch (error) {
          logger.warn('Failed to parse ai_suggested_categories for task:', task.id, error);
          suggestions = [];
        }
      }
        
      const acceptedSuggestion = suggestions.find((s: AISuggestion) => s.category_id === categoryId);
      
      if (!acceptedSuggestion) {
        throw new Error('Suggestion not found');
      }

      await db('tasks')
        .where('id', taskId)
        .update({
          category_id: categoryId,
          ai_confidence_score: acceptedSuggestion.confidence,
          ai_categorized: true,
          ai_categorized_at: new Date(),
          updated_at: new Date()
        });

      // Record in history
      await this.recordCategorizationHistory(
        taskId,
        categoryId,
        acceptedSuggestion.confidence,
        { suggestions } as AIAnalysisResult,
        'accepted',
        userId,
        feedback
      );

      logger.info('AI suggestion accepted:', { taskId, categoryId, userId });
    } catch (error) {
      logger.error('Failed to accept AI suggestion:', error);
      throw error;
    }
  }

  /**
   * Reject an AI categorization suggestion
   */
  async rejectSuggestion(
    taskId: string,
    categoryId: string,
    userId: string,
    feedback?: string
  ): Promise<void> {
    try {
      // Record in history
      await this.recordCategorizationHistory(
        taskId,
        categoryId,
        0,
        null,
        'rejected',
        userId,
        feedback
      );

      logger.info('AI suggestion rejected:', { taskId, categoryId, userId, feedback });
    } catch (error) {
      logger.error('Failed to reject AI suggestion:', error);
      throw error;
    }
  }

  /**
   * Manually categorize a task
   */
  async manualCategorization(
    taskId: string,
    categoryId: string | null,
    userId: string
  ): Promise<void> {
    try {
      await db('tasks')
        .where('id', taskId)
        .update({
          category_id: categoryId,
          ai_confidence_score: null,
          ai_categorized: false,
          updated_at: new Date()
        });

      if (categoryId) {
        // Record in history
        await this.recordCategorizationHistory(
          taskId,
          categoryId,
          null,
          null,
          'manual',
          userId
        );
      }

      logger.info('Task manually categorized:', { taskId, categoryId, userId });
    } catch (error) {
      logger.error('Failed to manually categorize task:', error);
      throw error;
    }
  }

  /**
   * Bulk categorize tasks for a project
   */
  async bulkCategorizeProject(
    projectId: string,
    userId?: string,
    acceptSuggestion: boolean = true
  ): Promise<{ processed: number; categorized: number }> {
    try {
      const tasks = await db('tasks')
        .where('project_id', projectId)
        .where('is_archived', false)
        .whereNull('category_id')
        .select('id', 'title', 'description', 'type');

      let processed = 0;
      let categorized = 0;

      for (const task of tasks) {
        try {
          const result = await this.categorizeTask(task.id, userId, acceptSuggestion);
          processed++;
          if (result.categorized) {
            categorized++;
          }
        } catch (error) {
          logger.error('Failed to categorize task in bulk:', { taskId: task.id, error });
          processed++;
        }
      }

      logger.info('Bulk categorization completed:', { projectId, processed, categorized });
      return { processed, categorized };
    } catch (error) {
      logger.error('Failed to bulk categorize project:', error);
      throw error;
    }
  }

  /**
   * Get categorization statistics
   */
  async getCategorizationStats(projectId?: string): Promise<{
    total_tasks: number;
    categorized_tasks: number;
    ai_categorized_tasks: number;
    manual_categorized_tasks: number;
    pending_suggestions: number;
    category_distribution: Array<{ category_name: string; count: number; percentage: number }>;
  }> {
    try {
      let baseQuery = db('tasks');
      
      if (projectId) {
        baseQuery = baseQuery.where('project_id', projectId);
      }
      
      baseQuery = baseQuery.where('is_archived', false);

      const [
        totalResult,
        categorizedResult,
        aiCategorizedResult,
        pendingSuggestionsResult
      ] = await Promise.all([
        baseQuery.clone().count('* as count').first(),
        baseQuery.clone().whereNotNull('category_id').count('* as count').first(),
        baseQuery.clone().where('ai_categorized', true).count('* as count').first(),
        baseQuery.clone().whereNotNull('ai_suggested_categories').whereNull('category_id').count('* as count').first()
      ]);

      const totalTasks = Number(totalResult?.count || 0);
      const categorizedTasks = Number(categorizedResult?.count || 0);
      const aiCategorizedTasks = Number(aiCategorizedResult?.count || 0);
      const pendingSuggestions = Number(pendingSuggestionsResult?.count || 0);
      const manualCategorizedTasks = categorizedTasks - aiCategorizedTasks;

      // Get category distribution
      const categoryDistribution = await baseQuery.clone()
        .join('task_categories as tc', 'tasks.category_id', 'tc.id')
        .whereNotNull('tasks.category_id')
        .groupBy('tc.id', 'tc.name')
        .select('tc.name as category_name')
        .count('tasks.id as count')
        .orderBy('count', 'desc');

      const distributionWithPercentage = categoryDistribution.map(item => ({
        category_name: item.category_name,
        count: Number(item.count),
        percentage: categorizedTasks > 0 
          ? Math.round((Number(item.count) / categorizedTasks) * 100) 
          : 0
      }));

      return {
        total_tasks: totalTasks,
        categorized_tasks: categorizedTasks,
        ai_categorized_tasks: aiCategorizedTasks,
        manual_categorized_tasks: manualCategorizedTasks,
        pending_suggestions: pendingSuggestions,
        category_distribution: distributionWithPercentage
      };
    } catch (error) {
      logger.error('Failed to get categorization stats:', error);
      throw error;
    }
  }

  /**
   * Record categorization action in history
   */
  private async recordCategorizationHistory(
    taskId: string,
    categoryId: string,
    confidenceScore: number | null,
    aiAnalysis: AIAnalysisResult | null,
    action: 'suggested' | 'accepted' | 'rejected' | 'manual',
    userId?: string,
    feedback?: string
  ): Promise<void> {
    try {
      await db('ai_categorization_history').insert({
        id: db.raw('gen_random_uuid()'),
        task_id: taskId,
        category_id: categoryId,
        suggested_by_user_id: userId || null,
        confidence_score: confidenceScore,
        ai_analysis: aiAnalysis ? JSON.stringify(aiAnalysis) : null,
        action,
        feedback,
        created_at: new Date()
      });
    } catch (error) {
      logger.error('Failed to record categorization history:', error);
      // Don't throw here - history recording should not fail the main operation
    }
  }

  /**
   * Get keywords associated with task types
   */
  private getTypeKeywords(taskType: string): string[] {
    const typeKeywordMap: Record<string, string[]> = {
      'bug': ['bug', 'error', 'fix', 'issue'],
      'feature': ['feature', 'implement', 'add', 'new'],
      'story': ['story', 'feature', 'user'],
      'epic': ['epic', 'large', 'major'],
      'task': ['task', 'work', 'do'],
      'subtask': ['subtask', 'sub', 'part']
    };

    return typeKeywordMap[taskType.toLowerCase()] || [];
  }
}

export const aiCategorizationService = new AICategorizationService();
export default aiCategorizationService;