import { test as base, expect as baseExpect } from "@playwright/test";

/**
 * Extended test setup with localStorage/sessionStorage cleanup
 * This prevents test data bleed between runs
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    // Clear storage before each test
    await context.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await use(context);
  },
});

export const expect = baseExpect;

