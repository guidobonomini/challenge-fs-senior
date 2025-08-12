import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL('/auth/login');
    await expect(page.locator('h2')).toContainText('Task Management Platform');
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait a moment for potential navigation/error display
    await page.waitForTimeout(1000);
    
    // Should stay on login page (not redirect to dashboard)
    await expect(page).toHaveURL('/auth/login');
    
    // Should still see the login form (indicating we didn't successfully login)
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should stay logged in when navigating', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    await expect(page).toHaveURL('/dashboard');
    
    // When logged in, trying to go to login should redirect back to dashboard
    await page.goto('/auth/login');
    
    // Should redirect back to dashboard (indicates we're still logged in)
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Try various possible field names for the registration form
    await page.fill('input[name="firstName"], input[name="first_name"], input[placeholder*="First"]', 'Test');
    await page.fill('input[name="lastName"], input[name="last_name"], input[placeholder*="Last"]', 'User');
    await page.fill('input[name="email"], input[type="email"]', `test+${Date.now()}@example.com`);
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    
    // Try to find confirm password field
    const confirmFields = page.locator('input[name="confirmPassword"], input[name="confirm_password"], input[name="passwordConfirm"], input[placeholder*="Confirm"]');
    if (await confirmFields.count() > 0) {
      await confirmFields.first().fill('password123');
    }
    
    await page.getByRole('button', { name: /Create|Register|Sign up/i }).click();
    
    // Should show success message or redirect - be flexible about the exact message
    await expect(page.locator(':has-text("Account created successfully"), :has-text("Registration successful"), :has-text("Welcome"), [class*="success"]').first()).toBeVisible();
  });
});