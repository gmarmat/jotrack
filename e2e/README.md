# JoTrack E2E Test Suite

This directory contains comprehensive end-to-end tests for JoTrack using Playwright.

## Overview

The test suite covers 8 critical user scenarios across 3 priority levels:

- **P0 Critical Tests (MUST PASS)**: Core functionality that blocks users
- **P1 High Priority Tests (SHOULD PASS)**: Important features and edge cases  
- **P2 Nice-to-Have Tests (NICE TO PASS)**: Advanced features and optimizations

## Test Scenarios

### P0 Critical Tests (MUST PASS)

1. **Scenario 1: New User Onboarding - Complete Flow**
   - Tests the complete user journey from job creation to interview preparation
   - Validates data pipeline, Match Score, Skills Match, and Interview Coach
   - Ensures 4 synthesized questions (not 27 web questions) in Practice tab

2. **Scenario 4: Status Progression & Interview Coach Unlock**
   - Tests status dropdown functionality and Interview Coach unlock logic
   - Validates that Interview Coach is accessible when prerequisites are met
   - Ensures all 8 status options are visible (not clipped)

3. **Scenario 7: Settings Modal - Dark Mode & Positioning**
   - Tests modal positioning and dark mode functionality
   - Validates theme consistency across components
   - Ensures modal is centered and not clipped

### P1 High Priority Tests (SHOULD PASS)

4. **Scenario 2: Okay Match - Resume Improvement Flow**
   - Tests Resume Coach functionality with moderate match scores
   - Validates score improvement after resume optimization
   - Tests discovery questions and auto-save functionality

5. **Scenario 3: Bad Match - Early Warning**
   - Tests early warning system for poor job matches
   - Validates red gradient display for low match scores
   - Ensures appropriate messaging for major changes needed

6. **Scenario 5: Data Pipeline - Multiple File Formats**
   - Tests file upload and processing for PDF, DOCX, TXT formats
   - Validates variant generation (Raw, AI-Optimized)
   - Tests file streaming and preview functionality

7. **Scenario 8: Error Handling & Edge Cases**
   - Tests corrupted file handling and error messages
   - Validates Interview Coach lock states
   - Tests button debouncing and data persistence

### P2 Nice-to-Have Tests (NICE TO PASS)

8. **Scenario 6: Interview Coach - Question Management**
   - Tests question selection/deselection functionality
   - Tests custom question addition
   - Tests drag-and-drop reordering

## Test Data Strategy

### Reusing Existing Data

The test suite is designed to leverage existing database data whenever possible:

1. **Data Discovery**: Queries `/api/jobs/search?limit=3&has=["resume","jd"]` to find jobs with attachments
2. **Job Selection**: Automatically selects the best job for testing based on match score and completeness
3. **Attachment Verification**: Tests existing attachments and variants without modification
4. **Read-Only Mode**: Never modifies or deletes existing user data

### Fallback Strategy

When no existing data is available:

1. **Test Fixtures**: Uses files in `e2e/fixtures/` directory
2. **Temporary Jobs**: Creates test jobs with "(E2E-TEMP)" suffix
3. **Cleanup**: Automatically removes temporary test data after tests

## Running Tests

### Prerequisites

1. **Development Server**: Ensure Next.js dev server is running (`npm run dev`)
2. **Playwright Installation**: Run `npm run e2e:install` to install browsers
3. **Test Data**: Ensure database has some jobs with attachments (optional)

### Basic Commands

```bash
# Run all tests
npm run e2e

# Run with UI (interactive mode)
npm run e2e:ui

# Run in headed mode (visible browser)
npm run e2e:headed

# Run in debug mode
npm run e2e:debug

# Show test report
npm run e2e:report
```

### Advanced Usage

```bash
# Run specific scenario
tsx e2e/run-tests.ts --scenario 1

# Run by priority level
tsx e2e/run-tests.ts --priority P0

# Run on specific browser
tsx e2e/run-tests.ts --browser chromium

# Run with custom options
tsx e2e/run-tests.ts --scenario 1 --headed --debug
```

### Test Configuration

Tests are configured in `playwright.config.ts`:

- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Timeouts**: 30s for actions, 10s for expectations
- **Retries**: 2 retries on CI, 0 locally
- **Parallel**: Tests run in parallel by default
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry

## Test Structure

### File Organization

```
e2e/
├── comprehensive-flow.spec.ts    # Main test suite
├── utils/
│   └── jobData.ts              # Test utilities and data discovery
├── fixtures/                   # Test data files
│   ├── resume-good.pdf
│   ├── jd-good.docx
│   ├── resume-bad.pdf
│   └── jd-bad.docx
├── setup-test-data.ts          # Test data setup
├── run-tests.ts                # Test runner script
└── README.md                   # This file
```

### Test Utilities

The `e2e/utils/jobData.ts` file provides utilities for:

- **Data Discovery**: Finding existing jobs with attachments
- **Job Selection**: Selecting the best job for testing
- **Attachment Handling**: Getting variants and testing file streaming
- **Test Job Management**: Creating and cleaning up temporary jobs
- **Validation**: Ensuring jobs are ready for testing

### Test Data Files

The `e2e/fixtures/` directory contains:

- **resume-good.pdf**: High-quality resume for good match scenarios
- **jd-good.docx**: Well-structured job description
- **resume-bad.pdf**: Marketing-focused resume for bad match scenarios  
- **jd-bad.docx**: Software engineering job description for mismatch

## Success Criteria

### P0 Tests (Critical)
- **Must Pass**: 100% success rate
- **Blockers**: Any P0 failure blocks deployment
- **Coverage**: Core user flows and critical bugs

### P1 Tests (High Priority)
- **Should Pass**: ≥90% success rate
- **Important**: Feature coverage and edge cases
- **Quality**: Manual verification required for AI output

### P2 Tests (Nice-to-Have)
- **Nice to Pass**: ≥70% success rate
- **Optional**: Advanced features and optimizations
- **Deferrable**: Can be addressed in future releases

## Debugging Tests

### Common Issues

1. **Timeout Errors**: Increase timeout in `playwright.config.ts`
2. **Element Not Found**: Check `data-testid` attributes in components
3. **API Errors**: Verify server is running and database is accessible
4. **File Upload Issues**: Check file paths in fixtures directory

### Debug Mode

```bash
# Run in debug mode
npm run e2e:debug

# Run specific test in debug mode
npx playwright test --debug --grep "Scenario 1"
```

### Test Reports

```bash
# Generate HTML report
npm run e2e:report

# View test results
open playwright-report/index.html
```

## Continuous Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run e2e:install
      - run: npm run build
      - run: npm run e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Results

- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results/results.json`
- **JUnit XML**: `test-results/results.xml`
- **Screenshots**: `test-results/` directory
- **Videos**: `test-results/` directory

## Maintenance

### Adding New Tests

1. **Create Test**: Add new test in `comprehensive-flow.spec.ts`
2. **Add Data**: Update `jobData.ts` utilities if needed
3. **Update Docs**: Update this README with new scenario
4. **Test Locally**: Run tests to ensure they pass
5. **Commit**: Include test files in version control

### Updating Test Data

1. **Check Fixtures**: Ensure test files in `e2e/fixtures/` are current
2. **Update Utilities**: Modify `jobData.ts` for new data requirements
3. **Test Discovery**: Verify data discovery works with new schema
4. **Cleanup**: Remove outdated test data

### Performance Optimization

1. **Parallel Execution**: Tests run in parallel by default
2. **Data Reuse**: Leverage existing database data
3. **Smart Selection**: Choose best jobs for testing automatically
4. **Cleanup**: Remove temporary data after tests

## Troubleshooting

### Common Problems

1. **Server Not Running**: Start with `npm run dev`
2. **Browser Issues**: Run `npm run e2e:install`
3. **Database Issues**: Check database connection and schema
4. **File Issues**: Verify test fixtures exist and are accessible

### Getting Help

1. **Check Logs**: Review test output for error messages
2. **Debug Mode**: Use `--debug` flag for step-by-step execution
3. **Test Reports**: Check HTML report for detailed failure information
4. **Documentation**: Refer to Playwright docs for advanced usage

## Contributing

### Adding New Scenarios

1. **Follow Pattern**: Use existing test structure and naming
2. **Add Documentation**: Update this README with new scenario
3. **Test Locally**: Ensure new tests pass before committing
4. **Update Utilities**: Add any new utilities to `jobData.ts`

### Code Standards

1. **TypeScript**: Use proper typing for all test code
2. **Async/Await**: Use modern async patterns
3. **Error Handling**: Include proper error handling and logging
4. **Documentation**: Comment complex test logic
5. **Naming**: Use descriptive test names and data-testid attributes
