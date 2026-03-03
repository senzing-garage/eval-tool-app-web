import { test, expect } from '@playwright/test';

test.describe.serial('Search By Attribute', () => {

  /** Helper: navigate to search page and wait for form */
  async function setupSearch(page) {
    await page.goto('/search/by-attribute');
    await page.waitForLoadState('networkidle');
    const form = page.locator('sz-search-grpc');
    await expect(form).toBeVisible({ timeout: 10000 });
    return form;
  }

  // 1) Name-only search: "Robert Smith" → 3 Possible Matches
  test('Search by name "Robert Smith" returns possible matches', async ({ page }) => {
    const form = await setupSearch(page);

    await form.locator('#entity-name').fill('Robert Smith');
    await form.locator('button.button__search-go').first().click();
    await page.waitForLoadState('networkidle');

    // Result cards appear
    const results = page.locator('sz-search-result-card-grpc');
    await expect(results.first()).toBeVisible({ timeout: 10000 });

    // All results are Possible Matches (name-only search isn't strong enough for Match)
    const possibleMatches = page.locator('sz-search-result-card-grpc.possible-match');
    await expect(possibleMatches).toHaveCount(3, { timeout: 5000 });

    // Robert Smith entities appear in results
    const allText = await possibleMatches.allInnerTexts();
    const robertCount = allText.filter(t => /robert.*smith/i.test(t)).length;
    expect(robertCount, 'Expected Robert Smith entities in possible matches').toBeGreaterThanOrEqual(2);
  });

  // 2) Email search: "Kusha123@hmail.com" → 4 Matches (Eddie, Marie, Mark, Marsha Kusha)
  test('Search by email "Kusha123@hmail.com" returns Kusha family matches', async ({ page }) => {
    const form = await setupSearch(page);

    await form.locator('#entity-email').fill('Kusha123@hmail.com');
    await form.locator('button.button__search-go').first().click();
    await page.waitForLoadState('networkidle');

    const matches = page.locator('sz-search-result-card-grpc.matches');
    await expect(matches).toHaveCount(4, { timeout: 10000 });

    // All four Kusha family members found
    const allText = await matches.allInnerTexts();
    for (const name of ['Eddie Kusha', 'Marie Kusha', 'Mark Kusha', 'Marsha Kusha']) {
      const found = allText.some(t => new RegExp(name, 'i').test(t));
      expect(found, `Expected "${name}" in matches`).toBe(true);
    }
  });

  // 3) Name + address: "Edward Kusha" + "1304 Poppy Hills Dr" → narrows to specific entity
  test('Search by name + address finds specific entity', async ({ page }) => {
    const form = await setupSearch(page);

    await form.locator('#entity-name').fill('Edward Kusha');
    await form.locator('#entity-address').fill('1304 Poppy Hills Dr');
    await form.locator('button.button__search-go').first().click();
    await page.waitForLoadState('networkidle');

    const results = page.locator('sz-search-result-card-grpc');
    await expect(results.first()).toBeVisible({ timeout: 10000 });

    // Should find Eddie Kusha as a match
    const allText = await results.allInnerTexts();
    const hasEddie = allText.some(t => /eddie\s+kusha|edward\s+kusha/i.test(t));
    expect(hasEddie, `Expected Eddie/Edward Kusha in results`).toBe(true);
  });

  // 4) Name + DOB: "Patrick Smith" + "10/10/1970" → 1 Match + 2 Possible Matches
  test('Search by name + DOB returns match and possible matches', async ({ page }) => {
    const form = await setupSearch(page);

    await form.locator('#entity-name').fill('Patrick Smith');
    await form.locator('#entity-dob').fill('10/10/1970');
    await form.locator('button.button__search-go').first().click();
    await page.waitForLoadState('networkidle');

    // Patrick Smith is an exact Match
    const matches = page.locator('sz-search-result-card-grpc.matches');
    await expect(matches).toHaveCount(1, { timeout: 10000 });
    await expect(matches.first()).toContainText(/Patrick Smith/i);

    // Pat Smith and Patricia Smith appear as Possible Matches
    const possibleMatches = page.locator('sz-search-result-card-grpc.possible-match');
    await expect(possibleMatches).toHaveCount(2, { timeout: 5000 });
    const possibleText = await possibleMatches.allInnerTexts();
    const hasPat = possibleText.some(t => /pat smith/i.test(t));
    const hasPatricia = possibleText.some(t => /patricia smith/i.test(t));
    expect(hasPat, 'Expected Pat Smith in possible matches').toBe(true);
    expect(hasPatricia, 'Expected Patricia Smith in possible matches').toBe(true);
  });

  // 5) Phone search: "800-111-1234" → 1 Discovered Relationship (Universal Exports)
  test('Search by phone "800-111-1234" finds related organization', async ({ page }) => {
    const form = await setupSearch(page);

    await form.locator('#entity-phone').fill('800-111-1234');
    await form.locator('button.button__search-go').first().click();
    await page.waitForLoadState('networkidle');

    // Universal Exports appears as a Discovered Relationship
    const related = page.locator('sz-search-result-card-grpc.possibly-related');
    await expect(related).toHaveCount(1, { timeout: 10000 });
    await expect(related.first()).toContainText(/Universal Exports/i);
  });
});
