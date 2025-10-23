#!/usr/bin/env node

const { spawn } = require('child_process');

class QuickTestRunner {
  constructor() {
    this.timeout = 30000; // 30 seconds max per test suite
    this.results = [];
  }

  async runQuickTests() {
    console.log('⚡ Running Quick JoTrack Tests (30s timeout)');
    console.log('=' .repeat(50));
    
    const startTime = Date.now();
    
    try {
      // Run fast smoke tests
      const result = await this.runTestCommand([
        'npx', 'playwright', 'test', 
        'e2e/fast-smoke-test.spec.ts',
        '--project', 'chromium',
        '--timeout', '30000',
        '--workers', '1'  // Single worker to avoid conflicts
      ]);
      
      const duration = Date.now() - startTime;
      console.log(`\n⚡ Quick tests completed in ${duration}ms`);
      
      if (result.success) {
        console.log('✅ All quick tests passed!');
        return true;
      } else {
        console.log('❌ Some quick tests failed');
        return false;
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`\n💥 Quick tests crashed after ${duration}ms:`, error.message);
      return false;
    }
  }

  async runTestCommand(command) {
    return new Promise((resolve) => {
      const testProcess = spawn(command[0], command.slice(1), {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      testProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        // Only show key messages
        if (text.includes('✅') || text.includes('❌') || text.includes('⚠️')) {
          console.log(text.trim());
        }
      });

      testProcess.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        // Only show critical errors
        if (text.includes('Error') || text.includes('Failed')) {
          console.log('STDERR:', text.trim());
        }
      });

      testProcess.on('close', (code) => {
        resolve({
          success: code === 0,
          exitCode: code,
          output,
          errorOutput
        });
      });

      // Hard timeout after 30 seconds
      setTimeout(() => {
        testProcess.kill();
        resolve({
          success: false,
          error: 'Test timeout (30s)',
          output,
          errorOutput
        });
      }, this.timeout);
    });
  }
}

// Run the tests
if (require.main === module) {
  const runner = new QuickTestRunner();
  runner.runQuickTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = QuickTestRunner;
