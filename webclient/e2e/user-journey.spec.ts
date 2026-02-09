import { test, expect, type Page } from '@playwright/test';
import { generateTestEmail, generateTestUsername, verifyUserEmail } from './helpers';
import path from 'path';

// Test data
let testEmail: string;
let testUsername: string;
let testPassword: string;
let testEventSlug: string;
let testEventName: string;
let postalEventId: string | null = null;
let postalEventName: string | null = null;
let loggedInUserId: string;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.dev';
const adminPassword = process.env.ADMIN_PASSWORD || 'changeMe';

test.describe('Full User Journey E2E Test', () => {
  test.beforeAll(() => {
    testEmail = generateTestEmail();
    testUsername = generateTestUsername();
    testPassword = 'TestPass123!';
    console.log(`Test User: ${testEmail} / ${testUsername}`);
  });

  test('Complete user journey: Register → Verify → Create Event → Edit Event → Password Reset', async ({ page, browser }) => {
    // ============================================
    // STEP 1: User Registration
    // ============================================
    await test.step('Register new user', async () => {
      await page.goto('/register');
      await expect(page).toHaveURL(/\/register/);

      // Fill registration form
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="nick"]', testUsername);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="confirmPassword"]', testPassword);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for success message
      await expect(page.locator('text=Registrierung erfolgreich')).toBeVisible({ timeout: 10000 });
      console.log('✓ User registered successfully');
    });

    // ============================================
    // STEP 2: Email Verification (via Backend API)
    // ============================================
    await test.step('Verify user email via backend', async () => {
      const result = await verifyUserEmail(testEmail);

      if (!result.ok) {
        console.error('Failed to verify user:', result);
        throw new Error(`Verification failed with status ${result.status}`);
      }

      console.log('✓ User email verified via backend');
    });

    // ============================================
    // STEP 3: Login
    // ============================================
    await test.step('Login with verified user', async () => {
      // Navigate to login page explicitly
      await page.goto('/login', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/login/);

      // Wait for form to be ready
      await page.waitForSelector('input#email', { state: 'visible' });
      
      // Fill login form
      await page.fill('input#email', testEmail);
      await page.fill('input#password', testPassword);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to home page
      await page.waitForURL('/', { timeout: 10000 });
      const meResult = await page.evaluate(async () => {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        let data = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }
        return { ok: res.ok, status: res.status, data };
      });
      if (!meResult.ok) {
        throw new Error(`Auth check failed after login: ${meResult.status}`);
      }
      if (!meResult.data?.id) {
        throw new Error('Auth check returned no user id');
      }
      loggedInUserId = meResult.data.id as string;
      const refreshTokenCookie = (await page.context().cookies()).find(
        (cookie) => cookie.name === 'refresh_token'
      );
      if (!refreshTokenCookie?.value) {
        throw new Error('Missing refresh_token cookie after login');
      }
      console.log('✓ User logged in successfully');
    });

    // ============================================
    // STEP 3.5: Postal Code Location Search (34454)
    // ============================================
    await test.step('Postal code search should update listing (34454, 50km)', async () => {
      postalEventName = `PLZ Event ${Date.now()}`;
      const slug = `plz-event-${Date.now()}`;
      const start = new Date();
      start.setDate(start.getDate() + 2);
      start.setHours(12, 0, 0, 0);

      const end = new Date(start.getTime()); // same-day event should be allowed

      // Create an event near PLZ 34454 (Bad Arolsen area)
      const createRes = await page.request.post('/api/events', {
        data: {
          name: postalEventName,
          slug,
          dateStart: start.toISOString(),
          dateEnd: end.toISOString(),
          description: 'Event fuer PLZ Standortsuche (E2E).',
          latitude: 51.38,
          longitude: 9.02,
        },
      });
      if (!createRes.ok()) {
        throw new Error(`Failed to create postal event: ${createRes.status()} ${await createRes.text()}`);
      }
      const created = await createRes.json();
      postalEventId = created?.id ?? null;
      if (!postalEventId) {
        throw new Error('Postal event creation returned no id');
      }

      await page.goto('/', { waitUntil: 'networkidle' });

      // Wait for the client-side filter card to mount (it's rendered only after hydration),
      // then switch to PLZ search.
      await page.locator('text=Kommende Events').scrollIntoViewIfNeeded();
      const plzToggle = page.getByRole('button', { name: 'Suche per Postleitzahl' });
      await plzToggle.waitFor({ state: 'visible', timeout: 15000 });
      await plzToggle.click();

      const locationResponse = page.waitForResponse((r) => {
        return r.url().includes('/api/events?') && r.request().method() === 'GET' && r.url().includes('postalCode=34454');
      });

      await page.fill('input#postal-code', '34454');
      await locationResponse;

      await expect(page.locator(`text=${postalEventName}`)).toBeVisible({ timeout: 15000 });

      // Cleanup: don't leave extra unpublished events behind (important for prod runs).
      if (postalEventId) {
        const del = await page.request.delete(`/api/events/${postalEventId}`);
        if (!del.ok()) {
          throw new Error(
            `Failed to cleanup postal event ${postalEventId}: ${del.status()} ${await del.text()}`,
          );
        }
        postalEventId = null;
      }
    });

    // ============================================
    // STEP 4: Create Event with Banner Upload
    // ============================================
    await test.step('Create new event with banner', async () => {
      await page.goto('/events/create', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/events\/create/);

      if (/\/login/.test(page.url())) {
        const cookies = await page.context().cookies();
        throw new Error(
          `User lost session and was redirected to /login before event creation. Cookies: ${JSON.stringify(
            cookies
          )}`
        );
      }

      // Wait for form to be ready
      await page.waitForSelector('input#name', { state: 'visible' });

      // Fill event form
      testEventName = `E2E Test Event ${Date.now()}`;
      await page.fill('input#name', testEventName);

      // Dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T12:00`;
      };

      await page.fill('input#dateStart', formatDateTime(tomorrow));
      await page.fill('input#dateEnd', formatDateTime(nextWeek));

      // Description
      await page.fill('textarea#description', 'This is an automated E2E test event with all fields filled out.');

      // Organisator info
      await page.fill('input#orgaName', 'E2E Test Organization');
      await page.fill('input#orgaWebsite', 'https://example.com');

      // Event details
      await page.fill('input#eventWebsite', 'https://event.example.com');
      await page.fill('input#eventAddress', 'Test Street 123, 12345 Test City');
      await page.fill('input#registrationLink', 'https://register.example.com');
      await page.fill('input#tags', 'e2e, test, automation');

      // Upload banner image
      const testImagePath = path.join(__dirname, 'test-banner.png');
      
      // Check if file input exists
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        const uploadResponsePromise = page.waitForResponse((response) => {
          return (
            response.url().includes('/api/files/event-banner') &&
            response.request().method() === 'POST'
          );
        });

        await fileInput.setInputFiles(testImagePath);

        const uploadResponse = await uploadResponsePromise;
        if (!uploadResponse.ok()) {
          const uploadErrorText = await uploadResponse.text();
          throw new Error(
            `Banner upload failed: ${uploadResponse.status()} ${uploadErrorText}`,
          );
        }

        console.log('✓ Banner image uploaded');
      }

      // Submit form and capture API response
      const createResponsePromise = page.waitForResponse((response) => {
        return (
          response.url().includes('/api/events') &&
          response.request().method() === 'POST'
        );
      });

      await page.click('button[type="submit"]:has-text("Event erstellen")');

      // Prefer API response for slug (more reliable than redirects)
      const createResponse = await createResponsePromise;
      if (!createResponse.ok()) {
        const errorText = await createResponse.text();
        throw new Error(`Event creation API failed: ${createResponse.status()} ${errorText}`);
      }

      const createdEvent = await createResponse.json();
      if (createdEvent?.slug) {
        testEventSlug = createdEvent.slug;
      } else {
        // Wait for redirect - typically to the event view/edit page
        try {
          await page.waitForURL(/\/events\/[^\/]+/, { timeout: 15000 });
        } catch {
          // Still on create page - collect error messages if present
          const currentUrl = page.url();
          if (currentUrl.includes('/create')) {
            await page.screenshot({ path: 'test-results/event-create-error.png' });
            const errorMessages = await page
              .locator('.status-error, [role="alert"]')
              .allTextContents();

            if (errorMessages.length > 0) {
              console.error('❌ Validation errors:', errorMessages);
              throw new Error(
                `Event creation failed with errors: ${errorMessages.join(', ')}`
              );
            }
          }
          throw new Error('Event creation did not redirect to event detail page');
        }

        // Fallback: Extract event slug from URL
        const url = page.url();
        const extractSlugFromUrl = (detailUrl: string): string => {
          const slugSegment = detailUrl.split('/events/')[1];

          if (!slugSegment) {
            throw new Error('Event detail URL did not contain a slug segment');
          }

          const normalizedSlug = slugSegment.replace('/edit', '').split('?')[0];

          if (!normalizedSlug) {
            throw new Error('Event detail URL slug segment was empty');
          }

          return normalizedSlug;
        };

        testEventSlug = extractSlugFromUrl(url);
      }

      if (!page.url().includes(`/events/${testEventSlug}`)) {
        await page.goto(`/events/${testEventSlug}`, { waitUntil: 'networkidle' });
      }

      // Make sure we got a real slug, not "create"
      if (testEventSlug === 'create' || !testEventSlug) {
        throw new Error('Event was not created successfully - still on create page');
      }
      
      console.log(`✓ Event created successfully: ${testEventSlug}`);
    });

    // ============================================
    // STEP 5: View Event (after creation)
    // ============================================
    await test.step('View created event', async () => {
      // Wait for page to stabilize
      await page.waitForLoadState('networkidle');
      
      // Verify we're on the event page
      await expect(page).toHaveURL(new RegExp(`/events/${testEventSlug}`));
      
      // Verify heading contains event name
      await expect(page.locator('h1')).toContainText('E2E Test Event');

      // Owner should also see the event in the listing (same read rules as detail page)
      const ownerListingResponse = await page.request.get(
        `/api/events?search=${encodeURIComponent(testEventName)}&page=1&limit=50`
      );
      if (!ownerListingResponse.ok()) {
        throw new Error(
          `Owner listing fetch failed. Got status ${ownerListingResponse.status()}`,
        );
      }
      const ownerListingData = await ownerListingResponse.json();
      const ownerList = Array.isArray(ownerListingData?.data) ? ownerListingData.data : [];
      if (!ownerList.some((e: any) => e?.slug === testEventSlug)) {
        throw new Error('Owner listing did not include the newly created unpublished event');
      }

      const ownerVisibilityResponse = await page.request.get(`/api/events/slug/${testEventSlug}`);
      if (!ownerVisibilityResponse.ok()) {
        throw new Error(
          `Owner should see own unpublished event. Got status ${ownerVisibilityResponse.status()}`,
        );
      }
      const ownerEventData = await ownerVisibilityResponse.json();
      if (ownerEventData.userId !== loggedInUserId) {
        throw new Error(
          `Owner mismatch. event.userId=${ownerEventData.userId} loggedInUserId=${loggedInUserId}`,
        );
      }
      if (ownerEventData.published !== false) {
        throw new Error(`Expected event to be unpublished by default, got published=${ownerEventData.published}`);
      }

      const publicContext = await browser.newContext({
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:3001',
      });
      const publicResponse = await publicContext.request.get(`/api/events/slug/${testEventSlug}`);
      const publicListingResponse = await publicContext.request.get(
        `/api/events?search=${encodeURIComponent(testEventName)}&page=1&limit=50`
      );
      if (publicResponse.status() !== 404) {
        throw new Error(
          `Public user must not see unpublished event. Got status ${publicResponse.status()}`,
        );
      }
      if (!publicListingResponse.ok()) {
        throw new Error(
          `Public listing fetch failed. Got status ${publicListingResponse.status()}`,
        );
      }
      const publicListingData = await publicListingResponse.json();
      const publicList = Array.isArray(publicListingData?.data) ? publicListingData.data : [];
      if (publicList.some((e: any) => e?.slug === testEventSlug)) {
        throw new Error('Public listing included an unpublished event (must not happen)');
      }
      await publicContext.close();

      await expect(page.locator('text=Unveröffentlicht')).toHaveCount(0);
      
      console.log('✓ Event details displayed correctly');
    });

    // ============================================
    // STEP 6: Edit Event via inline edit button
    // ============================================
    await test.step('Edit event', async () => {
      const editButton = page.locator('button:has-text("Event bearbeiten")');
      await expect(editButton).toBeVisible({ timeout: 10000 });

      await editButton.click();
      
      // Wait for form to appear
      await page.waitForSelector('input#name', { state: 'visible', timeout: 5000 });

      // Update event name
      const currentName = await page.inputValue('input#name');
      const updatedName = `${currentName} (Updated)`;
      await page.fill('input#name', updatedName);

      // Update description
      await page.fill('textarea#description', 'Updated description for E2E test.');

      // Submit form
      await page.click('button[type="submit"]:has-text("speichern")');

      // Wait for form to close and return to read-only mode
      await page.waitForTimeout(3000);

      // Reload page to see updated content
      await page.reload({ waitUntil: 'networkidle' });

      // Verify updated content in h1
      const h1Text = await page.locator('h1').textContent();
      if (!h1Text?.includes('(Updated)')) {
        throw new Error(`Expected updated event title in h1, got: ${h1Text}`);
      }
      console.log('✓ Event updated successfully');
    });

    // ============================================
    // STEP 7: Admin/Mod publish controls in UI
    // ============================================
    await test.step('Admin can see unpublished marker and publish dropdown', async () => {
      await page.request.post('/api/auth/logout');
      await page.context().clearCookies();

      await page.goto('/login', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/login/);
      await page.fill('input#email', adminEmail);
      await page.fill('input#password', adminPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('/', { timeout: 10000 });

      await page.goto(`/events/${testEventSlug}`, { waitUntil: 'networkidle' });

      // Ensure event is in unpublished state for the badge/dropdown checks
      const eventForAdminCheck = await page.request.get(
        `/api/events/slug/${testEventSlug}`
      );
      if (!eventForAdminCheck.ok()) {
        throw new Error(
          `Admin failed to load event before publish checks: ${eventForAdminCheck.status()}`,
        );
      }
      const eventForAdminCheckData = await eventForAdminCheck.json();
      const eventId = eventForAdminCheckData?.id as string | undefined;
      if (!eventId) {
        throw new Error('Admin publish checks: missing event id');
      }

      const unpublishResponse = await page.request.patch(
        `/api/events/${eventId}/publish`,
        { data: { published: false } }
      );
      if (!unpublishResponse.ok()) {
        const body = await unpublishResponse.text();
        throw new Error(
          `Failed to set event to unpublished for badge checks: ${unpublishResponse.status()} ${body}`,
        );
      }

      await expect(page.locator('text=Unveröffentlicht')).toBeVisible({ timeout: 10000 });

      const editButton = page.locator('button:has-text("Event bearbeiten")');
      await expect(editButton).toBeVisible({ timeout: 10000 });
      await editButton.click();

      const publishSelect = page.locator('select#publishedStatus');
      await expect(publishSelect).toBeVisible({ timeout: 10000 });
      await publishSelect.selectOption('published');

      await page.click('button[type="submit"]:has-text("speichern")');
      await page.waitForTimeout(2000);

      const publishedCheck = await page.request.get(`/api/events/slug/${testEventSlug}`);
      if (!publishedCheck.ok()) {
        throw new Error(
          `Expected event to be readable after publishing. Got ${publishedCheck.status()}`,
        );
      }
      const publishedEvent = await publishedCheck.json();
      if (publishedEvent.published !== true) {
        throw new Error('Expected event to be published after admin update');
      }

      const publicContext = await browser.newContext({
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:3001',
      });
      const publicPublishedResponse = await publicContext.request.get(`/api/events/slug/${testEventSlug}`);
      await publicContext.close();
      if (publicPublishedResponse.status() !== 200) {
        throw new Error(
          `Public should see published event. Got status ${publicPublishedResponse.status()}`,
        );
      }
    });

    // ============================================
    // STEP 8: Delete Event
    // ============================================
    await test.step('Delete event', async () => {
      const deleteButton = page.locator('button:has-text("Event löschen")');
      await expect(deleteButton).toBeVisible({ timeout: 10000 });
      await deleteButton.click();
      await page.locator('button:has-text("Löschen")').last().click();
      await page.waitForURL('/', { timeout: 10000 });

      const deletedCheck = await page.request.get(`/api/events/slug/${testEventSlug}`);
      if (deletedCheck.status() !== 404) {
        const body = await deletedCheck.text();
        throw new Error(
          `Deleted event is still accessible. Status: ${deletedCheck.status()} Body: ${body}`,
        );
      }

      console.log('✓ Event deleted successfully');
    });

    // Cleanup postal event (if created)
    await test.step('Cleanup postal location test event', async () => {
      if (!postalEventId) return;
      const res = await page.request.delete(`/api/events/${postalEventId}`);
      // Ignore failure, but surface it in logs
      if (!res.ok && res.status() !== 404) {
        console.warn(`Postal event cleanup failed: ${res.status()} ${await res.text()}`);
      }
    });

    // ============================================
    // STEP 9: Logout (preparation for password reset test)
    // ============================================
    await test.step('Logout', async () => {
      // Perform proper logout (clears httpOnly cookie)
      await page.request.post('/api/auth/logout');

      // Ensure browser session is clean
      await page.context().clearCookies();

      // Navigate to home; networkidle can hang in production due to long-lived requests
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      console.log('✓ User logged out (cookies cleared)');
    });

    // ============================================
    // STEP 10: Password Reset Flow
    // ============================================
    await test.step('Request password reset', async () => {
      await page.goto('/forgot-password', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/forgot-password/);
      await page.waitForSelector('input#email', { state: 'visible' });

      // Fill email
      await page.fill('input#email', testEmail);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for success message
      await expect(page.locator('text=/Link.*gesendet|erfolgreich/i')).toBeVisible({ timeout: 10000 });
      console.log('✓ Password reset requested successfully');
      
      // Note: Actually resetting the password would require accessing the email
      // or having a backend endpoint to get the reset token
      // For this test, we just verify the request was successful
    });

    console.log('\n✅ All E2E tests completed successfully!');
  });
});
