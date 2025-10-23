#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.testResults = [];
    this.maxRetries = 3;
    this.currentRetry = 0;
    this.startTime = Date.now();
  }

  async runTests() {
    console.log('🚀 Starting JoTrack E2E Tests with Watchdog Recovery');
    console.log('=' .repeat(60));
    
    // Clear Next.js cache first
    await this.clearBuildCache();
    
    // Start development server
    const devServer = await this.startDevServer();
    
    try {
      // Wait for server to be ready
      await this.waitForServer();
      
      // Run tests with recovery
      await this.runTestSuite();
      
    } finally {
      // Cleanup
      if (devServer) {
        devServer.kill();
      }
    }
    
    this.printResults();
  }

  async clearBuildCache() {
    console.log('🧹 Clearing Next.js build cache...');
    try {
      const { execSync } = require('child_process');
      execSync('rm -rf .next', { stdio: 'inherit' });
      console.log('✅ Build cache cleared');
    } catch (error) {
      console.log('⚠️  Could not clear build cache:', error.message);
    }
  }

  async startDevServer() {
    console.log('🔄 Starting development server...');
    
    return new Promise((resolve, reject) => {
      const devServer = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let serverReady = false;
      
      devServer.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output.trim());
        
        if (output.includes('Ready') && output.includes('3000') && !serverReady) {
          serverReady = true;
          console.log('✅ Development server ready');
          resolve(devServer);
        }
      });

      devServer.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('Error') || error.includes('Failed')) {
          console.log('❌ Server error:', error.trim());
        }
      });

      devServer.on('error', (error) => {
        console.log('❌ Failed to start server:', error.message);
        reject(error);
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!serverReady) {
          console.log('⏰ Server startup timeout');
          devServer.kill();
          reject(new Error('Server startup timeout'));
        }
      }, 60000);
    });
  }

  async waitForServer() {
    console.log('⏳ Waiting for server to be fully ready...');
    
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch('http://localhost:3000');
        if (response.ok) {
          console.log('✅ Server is responding');
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Server did not become ready in time');
  }

  async runTestSuite() {
    console.log('🧪 Running E2E test suite...');
    
    const testSuites = [
      {
        name: 'P0 Critical Tests',
        command: ['npx', 'playwright', 'test', 'e2e/comprehensive-flow-watchdog.spec.ts', '--grep', 'P0'],
        priority: 'critical'
      },
      {
        name: 'P1 Feature Tests', 
        command: ['npx', 'playwright', 'test', 'e2e/comprehensive-flow-watchdog.spec.ts', '--grep', 'P1'],
        priority: 'high'
      }
    ];

    for (const suite of testSuites) {
      console.log(`\n📋 Running ${suite.name}...`);
      
      try {
        const result = await this.runTestCommand(suite);
        this.testResults.push(result);
        
        if (result.success) {
          console.log(`✅ ${suite.name} passed`);
        } else {
          console.log(`❌ ${suite.name} failed`);
          
          if (suite.priority === 'critical') {
            console.log('🔄 Attempting recovery for critical test failure...');
            await this.attemptRecovery();
            
            // Retry once
            if (this.currentRetry < this.maxRetries) {
              this.currentRetry++;
              console.log(`🔄 Retrying ${suite.name} (attempt ${this.currentRetry})...`);
              const retryResult = await this.runTestCommand(suite);
              this.testResults.push(retryResult);
            }
          }
        }
        
      } catch (error) {
        console.log(`💥 ${suite.name} crashed:`, error.message);
        this.testResults.push({
          name: suite.name,
          success: false,
          error: error.message,
          duration: Date.now() - this.startTime
        });
      }
    }
  }

  async runTestCommand(suite) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const testProcess = spawn(suite.command[0], suite.command.slice(1), {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      testProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text.trim());
      });

      testProcess.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        console.log('STDERR:', text.trim());
      });

      testProcess.on('close', (code) => {
        const duration = Date.now() - startTime;
        const success = code === 0;
        
        resolve({
          name: suite.name,
          success,
          exitCode: code,
          output,
          errorOutput,
          duration
        });
      });

      // Timeout after 10 minutes
      setTimeout(() => {
        testProcess.kill();
        resolve({
          name: suite.name,
          success: false,
          error: 'Test timeout',
          duration: Date.now() - startTime
        });
      }, 600000);
    });
  }

  async attemptRecovery() {
    console.log('🔧 Attempting automatic recovery...');
    
    try {
      // Kill any stuck processes
      const { execSync } = require('child_process');
      execSync('pkill -f "next dev" || true', { stdio: 'inherit' });
      execSync('pkill -f "playwright" || true', { stdio: 'inherit' });
      
      // Clear cache again
      execSync('rm -rf .next', { stdio: 'inherit' });
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('✅ Recovery completed');
      
    } catch (error) {
      console.log('❌ Recovery failed:', error.message);
    }
  }

  printResults() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = Date.now() - this.startTime;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`  - ${result.name}: ${result.error || 'Exit code ' + result.exitCode}`);
        });
    }
    
    console.log('\n' + '=' .repeat(60));
    
    // Save results to file
    const resultsFile = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.testResults,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        duration: totalDuration,
        successRate: Math.round((passedTests / totalTests) * 100)
      }
    }, null, 2));
    
    console.log(`📁 Results saved to: ${resultsFile}`);
    
    // Exit with appropriate code
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

// Run the tests
if (require.main === module) {
  const runner = new TestRunner();
  runner.runTests().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;
