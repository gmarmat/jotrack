import { Page, BrowserContext } from '@playwright/test';

export interface WatchdogConfig {
  stepTimeout: number; // milliseconds per step
  testTimeout: number; // milliseconds per test
  maxRetries: number; // max retries per test
  recoveryActions: RecoveryAction[];
}

export interface RecoveryAction {
  name: string;
  condition: (page: Page) => Promise<boolean>;
  action: (page: Page) => Promise<void>;
}

export class TestWatchdog {
  private config: WatchdogConfig;
  private startTime: number = 0;
  private stepStartTime: number = 0;
  private retryCount: number = 0;

  constructor(config: WatchdogConfig) {
    this.config = config;
  }

  async startTest(testName: string): Promise<void> {
    this.startTime = Date.now();
    this.retryCount = 0;
    console.log(`🕐 Starting test: ${testName}`);
  }

  async startStep(stepName: string, page: Page): Promise<void> {
    this.stepStartTime = Date.now();
    console.log(`  📋 Step: ${stepName}`);
    
    // Set up step timeout
    setTimeout(async () => {
      if (Date.now() - this.stepStartTime >= this.config.stepTimeout) {
        console.log(`⏰ Step timeout: ${stepName} (${this.config.stepTimeout}ms)`);
        await this.attemptRecovery(page, stepName);
      }
    }, this.config.stepTimeout);
  }

  async checkTestTimeout(): Promise<boolean> {
    const elapsed = Date.now() - this.startTime;
    if (elapsed >= this.config.testTimeout) {
      console.log(`⏰ Test timeout reached (${this.config.testTimeout}ms)`);
      return true;
    }
    return false;
  }

  async attemptRecovery(page: Page, stepName: string): Promise<boolean> {
    console.log(`🔄 Attempting recovery for step: ${stepName}`);
    
    for (const recoveryAction of this.config.recoveryActions) {
      try {
        const shouldRecover = await recoveryAction.condition(page);
        if (shouldRecover) {
          console.log(`  🔧 Running recovery: ${recoveryAction.name}`);
          await recoveryAction.action(page);
          return true;
        }
      } catch (error) {
        console.log(`  ❌ Recovery failed: ${recoveryAction.name}`, error);
      }
    }
    
    return false;
  }

  async handleError(error: any, page: Page, stepName: string): Promise<boolean> {
    console.log(`❌ Error in step ${stepName}:`, error.message);
    
    if (this.retryCount < this.config.maxRetries) {
      this.retryCount++;
      console.log(`🔄 Retrying step (attempt ${this.retryCount}/${this.config.maxRetries})`);
      
      const recovered = await this.attemptRecovery(page, stepName);
      if (recovered) {
        return true; // Continue with retry
      }
    }
    
    console.log(`💥 Step failed after ${this.retryCount} retries: ${stepName}`);
    return false; // Fail the test
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }
}

// Default recovery actions for JoTrack
export const defaultRecoveryActions: RecoveryAction[] = [
  {
    name: 'Refresh Page',
    condition: async (page) => {
      try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        return false;
      } catch {
        return true;
      }
    },
    action: async (page) => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }
  },
  {
    name: 'Clear Build Cache',
    condition: async (page) => {
      // Check for common build errors
      const errors = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[data-testid="error"], .error, [class*="error"]');
        return errorElements.length > 0;
      });
      return errors;
    },
    action: async (page) => {
      console.log('  🔧 Clearing Next.js cache and restarting...');
      // This would trigger a server restart in a real scenario
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(5000);
    }
  },
  {
    name: 'Restart Interview Coach',
    condition: async (page) => {
      const url = page.url();
      return url.includes('/interview-coach/');
    },
    action: async (page) => {
      // Click restart button if available
      try {
        const restartBtn = page.locator('button:has-text("Restart")').first();
        if (await restartBtn.isVisible()) {
          await restartBtn.click();
          await page.waitForTimeout(3000);
        }
      } catch {
        // Navigate back to job page and retry
        await page.goBack();
        await page.waitForTimeout(2000);
      }
    }
  },
  {
    name: 'Clear Form Data',
    condition: async (page) => {
      const hasForm = await page.locator('form, input, textarea').count() > 0;
      return hasForm;
    },
    action: async (page) => {
      await page.evaluate(() => {
        // Clear all form inputs
        document.querySelectorAll('input, textarea, select').forEach(el => {
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            el.value = '';
          }
        });
      });
      await page.waitForTimeout(1000);
    }
  }
];

// Default watchdog configuration
export const defaultWatchdogConfig: WatchdogConfig = {
  stepTimeout: 30000, // 30 seconds per step
  testTimeout: 300000, // 5 minutes per test
  maxRetries: 3,
  recoveryActions: defaultRecoveryActions
};

// Helper function to run tests with watchdog
export async function runWithWatchdog<T>(
  testName: string,
  testFn: (watchdog: TestWatchdog, page: Page) => Promise<T>,
  page: Page,
  config: WatchdogConfig = defaultWatchdogConfig
): Promise<T> {
  const watchdog = new TestWatchdog(config);
  
  try {
    await watchdog.startTest(testName);
    const result = await testFn(watchdog, page);
    console.log(`✅ Test completed: ${testName} (${watchdog.getElapsedTime()}ms)`);
    return result;
  } catch (error) {
    console.log(`❌ Test failed: ${testName}`, error);
    throw error;
  }
}
