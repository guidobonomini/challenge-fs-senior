import { test, expect } from '@playwright/test';

test.describe('Team Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display teams page', async ({ page }) => {
    await page.goto('/teams');
    await expect(page.locator('h1')).toContainText('Teams');
    
    // Should show team cards
    await expect(page.locator('[data-testid="team-card"]')).toHaveCount(4); // Based on seed data
  });

  test('should create a new team', async ({ page }) => {
    await page.goto('/teams');
    
    // Click create team button
    await page.getByRole('button', { name: 'Create Team' }).click();
    
    // Fill team form
    await page.fill('input[name="name"]', 'E2E Test Team');
    await page.fill('textarea[name="description"]', 'This team was created by E2E tests');
    
    // Submit form
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Should close modal and show success
    await expect(page.locator('.modal')).not.toBeVisible();
    
    // Should see the new team
    await expect(page.locator('text=E2E Test Team')).toBeVisible();
  });

  test('should view team details', async ({ page }) => {
    await page.goto('/teams');
    
    // Click on a team
    await page.locator('[data-testid="team-card"]').first().click();
    
    // Should navigate to team detail page
    await expect(page.url()).toContain('/teams/');
    
    // Should show team information
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="team-description"]')).toBeVisible();
    
    // Should show team members
    await expect(page.locator('[data-testid="team-members"]')).toBeVisible();
  });

  test('should add member to team', async ({ page }) => {
    await page.goto('/teams');
    
    // Go to team details
    await page.locator('text=Development Team').click();
    
    // Add member
    await page.getByRole('button', { name: 'Add Member' }).click();
    
    // Select user to add
    await page.selectOption('select[name="user_id"]', { index: 1 });
    await page.selectOption('select[name="role"]', 'member');
    
    // Submit
    await page.getByRole('button', { name: 'Add' }).click();
    
    // Should see new member in list
    await expect(page.locator('[data-testid="team-member"]')).toHaveCount(2);
  });

  test('should update team member role', async ({ page }) => {
    await page.goto('/teams');
    
    // Go to team details
    await page.locator('text=Development Team').click();
    
    // Find member and update role
    const memberRow = page.locator('[data-testid="team-member"]').first();
    await memberRow.locator('select[name="role"]').selectOption('manager');
    
    // Should show success message
    await expect(page.locator('text=Role updated successfully')).toBeVisible();
  });

  test('should remove team member', async ({ page }) => {
    await page.goto('/teams');
    
    // Go to team details
    await page.locator('text=Development Team').click();
    
    // Remove member (but not the owner)
    const memberRows = page.locator('[data-testid="team-member"]');
    const memberCount = await memberRows.count();
    
    if (memberCount > 1) {
      const nonOwnerMember = memberRows.nth(1); // Second member (not owner)
      await nonOwnerMember.locator('button[title="Remove member"]').click();
      
      // Confirm removal
      await page.getByRole('button', { name: 'Remove' }).click();
      
      // Should have one less member
      await expect(page.locator('[data-testid="team-member"]')).toHaveCount(memberCount - 1);
    }
  });

  test('should edit team details', async ({ page }) => {
    await page.goto('/teams');
    
    // Go to team details
    await page.locator('text=E2E Test Team').click();
    
    // Edit team
    await page.getByRole('button', { name: 'Edit Team' }).click();
    
    // Update information
    await page.fill('input[name="name"]', 'Updated E2E Test Team');
    await page.fill('textarea[name="description"]', 'Updated description for E2E test team');
    
    // Submit changes
    await page.getByRole('button', { name: 'Update' }).click();
    
    // Should see updated information
    await expect(page.locator('h1')).toContainText('Updated E2E Test Team');
    await expect(page.locator('text=Updated description')).toBeVisible();
  });

  test('should search and filter teams', async ({ page }) => {
    await page.goto('/teams');
    
    // Search for specific team
    await page.fill('input[placeholder="Search teams..."]', 'Development');
    
    // Should show filtered results
    await expect(page.locator('text=Development Team')).toBeVisible();
    await expect(page.locator('[data-testid="team-card"]')).toHaveCount(1);
    
    // Clear search
    await page.fill('input[placeholder="Search teams..."]', '');
    await page.keyboard.press('Escape');
    
    // Should show all teams
    await expect(page.locator('[data-testid="team-card"]').count()).toBeGreaterThan(1);
  });

  test('should delete team', async ({ page }) => {
    await page.goto('/teams');
    
    // Go to team details
    await page.locator('text=Updated E2E Test Team').click();
    
    // Delete team
    await page.getByRole('button', { name: 'Delete Team' }).click();
    
    // Confirm deletion
    await page.fill('input[placeholder="Type team name to confirm"]', 'Updated E2E Test Team');
    await page.getByRole('button', { name: 'Delete' }).click();
    
    // Should redirect to teams list
    await expect(page).toHaveURL('/teams');
    
    // Should no longer see the deleted team
    await expect(page.locator('text=Updated E2E Test Team')).not.toBeVisible();
  });
});