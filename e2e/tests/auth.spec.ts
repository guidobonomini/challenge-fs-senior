import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h2')).toContainText('Sign in to your account');
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    await expect(page).toHaveURL('/dashboard');
    
    // Logout
    await page.getByRole('button', { name: 'User menu' }).click();
    await page.getByText('Sign out').click();
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', `test+${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Should show success message or redirect
    await expect(page.locator('text=Account created successfully')).toBeVisible();
  });
});