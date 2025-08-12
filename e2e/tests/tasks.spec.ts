import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display tasks page', async ({ page }) => {
    await page.goto('/tasks');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Should be on tasks page - check URL
    await expect(page).toHaveURL('/tasks');
    
    // Should have some content on the page
    await expect(page.locator('body')).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    await page.goto('/tasks');
    
    // Click create task button
    await page.getByRole('button', { name: 'Create Task' }).click();
    
    // Fill out task form
    await page.fill('input[name="title"]', 'E2E Test Task');
    await page.fill('textarea[name="description"]', 'This is a test task created by E2E tests');
    
    // Select a project (assuming there's at least one)
    await page.selectOption('select[name="project_id"]', { index: 1 });
    
    // Set priority and type
    await page.selectOption('select[name="priority"]', 'high');
    await page.selectOption('select[name="type"]', 'task');
    
    // Submit the form
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Should close modal and show success
    await expect(page.locator('.modal')).not.toBeVisible();
    
    // Should see the new task
    await expect(page.locator('text=E2E Test Task')).toBeVisible();
  });

  test('should update task status via drag and drop', async ({ page }) => {
    await page.goto('/tasks');
    
    // Switch to Kanban view if not already
    await page.getByRole('button', { name: 'Kanban' }).click();
    
    // Find a task in "To Do" column
    const taskCard = page.locator('[data-testid="task-card"]').first();
    const inProgressColumn = page.locator('[data-testid="kanban-column"][data-status="in_progress"]');
    
    // Drag task to "In Progress"
    await taskCard.dragTo(inProgressColumn);
    
    // Verify task moved
    await expect(inProgressColumn.locator('[data-testid="task-card"]')).toHaveCount(1);
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.goto('/tasks');
    
    // Use status filter
    await page.selectOption('select[name="status"]', 'in_progress');
    
    // Should show only in-progress tasks
    const taskCards = page.locator('[data-testid="task-card"]');
    await expect(taskCards).toHaveCount(1); // Assuming we have one in-progress task
    
    // Clear filter
    await page.selectOption('select[name="status"]', '');
    
    // Should show all tasks again
    await expect(taskCards).toHaveCount(3); // Assuming total tasks
  });

  test('should search tasks', async ({ page }) => {
    await page.goto('/tasks');
    
    // Search for specific task
    await page.fill('input[name="search"]', 'E2E Test');
    await page.keyboard.press('Enter');
    
    // Should show filtered results
    await expect(page.locator('text=E2E Test Task')).toBeVisible();
    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(1);
    
    // Clear search
    await page.fill('input[name="search"]', '');
    await page.keyboard.press('Enter');
    
    // Should show all tasks
    await expect(page.locator('[data-testid="task-card"]').count()).toBeGreaterThan(1);
  });

  test('should view task details', async ({ page }) => {
    await page.goto('/tasks');
    
    // Click on a task to view details
    await page.locator('[data-testid="task-card"]').first().click();
    
    // Should open task detail modal
    await expect(page.locator('[data-testid="task-detail-modal"]')).toBeVisible();
    
    // Should show task information
    await expect(page.locator('h2')).toBeVisible();
    await expect(page.locator('[data-testid="task-description"]')).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('[data-testid="task-detail-modal"]')).not.toBeVisible();
  });

  test('should add comment to task', async ({ page }) => {
    await page.goto('/tasks');
    
    // Open task details
    await page.locator('[data-testid="task-card"]').first().click();
    
    // Switch to comments tab
    await page.getByRole('tab', { name: 'Comments' }).click();
    
    // Add a comment
    await page.fill('textarea[placeholder*="comment"]', 'This is a test comment from E2E');
    await page.getByRole('button', { name: 'Comment' }).click();
    
    // Should see the comment
    await expect(page.locator('text=This is a test comment from E2E')).toBeVisible();
    
    // Should show user info
    await expect(page.locator('text=System Admin')).toBeVisible();
  });

  test('should edit and delete task', async ({ page }) => {
    await page.goto('/tasks');
    
    // Open task details
    await page.locator('text=E2E Test Task').click();
    
    // Edit task
    await page.getByRole('button', { name: 'Edit' }).click();
    
    // Update title
    await page.fill('input[name="title"]', 'Updated E2E Test Task');
    await page.getByRole('button', { name: 'Update' }).click();
    
    // Should see updated title
    await expect(page.locator('text=Updated E2E Test Task')).toBeVisible();
    
    // Delete task (if delete functionality exists)
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    // Should no longer see the task
    await expect(page.locator('text=Updated E2E Test Task')).not.toBeVisible();
  });
});