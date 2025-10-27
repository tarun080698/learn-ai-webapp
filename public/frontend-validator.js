/**
 * Browser Console Testing Script for Learn AI Questionnaire System
 * 
 * Copy and paste this into your browser's developer console
 * while on http://localhost:3000 to run frontend validation tests
 */

class FrontendValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      tests: []
    };
  }

  log(message, type = 'info') {
    const styles = {
      info: 'color: #2196F3; font-weight: bold;',
      success: 'color: #4CAF50; font-weight: bold;',
      error: 'color: #F44336; font-weight: bold;',
      warning: 'color: #FF9800; font-weight: bold;'
    };
    
    console.log(`%c${message}`, styles[type]);
  }

  async test(name, testFn) {
    this.log(`🧪 Testing: ${name}`);
    try {
      const result = await testFn();
      if (result.success) {
        this.log(`✅ PASS: ${name} - ${result.message}`, 'success');
        this.results.passed++;
      } else {
        this.log(`❌ FAIL: ${name} - ${result.message}`, 'error');
        this.results.failed++;
        this.results.errors.push({ test: name, error: result.message });
      }
      this.results.tests.push({ name, status: result.success ? 'PASS' : 'FAIL', message: result.message });
    } catch (error) {
      this.log(`💥 ERROR: ${name} - ${error.message}`, 'error');
      this.results.failed++;
      this.results.errors.push({ test: name, error: error.message });
      this.results.tests.push({ name, status: 'ERROR', message: error.message });
    }
  }

  // Test if we're on the right domain
  async testCurrentPage() {
    return this.test('Current Page Check', async () => {
      const isLocalhost = window.location.hostname === 'localhost';
      const isCorrectPort = window.location.port === '3000';
      
      return {
        success: isLocalhost && isCorrectPort,
        message: isLocalhost && isCorrectPort 
          ? 'Running on correct localhost:3000'
          : `Running on ${window.location.host} - should be localhost:3000`
      };
    });
  }

  // Test console errors
  async testConsoleErrors() {
    return this.test('Console Error Check', async () => {
      // Store original console.error
      const originalError = console.error;
      const errors = [];
      
      // Intercept console.error for 3 seconds
      console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Restore original console.error
      console.error = originalError;
      
      const criticalErrors = errors.filter(error => 
        !error.includes('source map') && 
        !error.includes('FAILED_PRECONDITION') &&
        !error.includes('index')
      );
      
      return {
        success: criticalErrors.length === 0,
        message: criticalErrors.length === 0 
          ? `No critical errors (${errors.length} total, mostly index warnings)`
          : `${criticalErrors.length} critical errors found`
      };
    });
  }

  // Test API endpoints
  async testApiEndpoints() {
    const endpoints = [
      { path: '/api/admin/questionnaires', method: 'GET' },
      { path: '/api/admin/assignments', method: 'GET' },
      { path: '/api/questionnaires/context', method: 'POST', data: {} }
    ];

    for (const endpoint of endpoints) {
      await this.test(`API ${endpoint.method} ${endpoint.path}`, async () => {
        try {
          const response = await fetch(endpoint.path, {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json'
            },
            body: endpoint.data ? JSON.stringify(endpoint.data) : undefined
          });
          
          return {
            success: response.status !== 404 && response.status !== 500,
            message: `Status: ${response.status} (${response.status === 401 ? 'Auth required - expected' : response.status === 200 ? 'Working' : 'Check server logs'})`
          };
        } catch (error) {
          return {
            success: false,
            message: `Network error: ${error.message}`
          };
        }
      });
    }
  }

  // Test page navigation
  async testPageNavigation() {
    const pages = [
      { path: '/admin', name: 'Admin Page' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/questionnaires', name: 'Questionnaires' },
      { path: '/catalog', name: 'Catalog' }
    ];

    for (const page of pages) {
      await this.test(`Page Navigation - ${page.name}`, async () => {
        try {
          const response = await fetch(page.path);
          return {
            success: response.status === 200 || response.status === 307 || response.status === 302,
            message: response.status === 200 
              ? 'Page accessible'
              : response.status === 307 || response.status === 302
              ? 'Redirects (auth required - expected)'
              : `Status: ${response.status}`
          };
        } catch (error) {
          return {
            success: false,
            message: `Navigation error: ${error.message}`
          };
        }
      });
    }
  }

  // Test DOM elements for admin page
  async testAdminPageElements() {
    if (!window.location.pathname.includes('/admin')) {
      return this.test('Admin Page Elements', async () => ({
        success: true,
        message: 'Skipped - not on admin page'
      }));
    }

    return this.test('Admin Page Elements', async () => {
      const elements = [
        'button', // Should have buttons
        'h1, h2, h3', // Should have headings
        '[data-testid], .admin-section, .questionnaire-section' // Should have sections
      ];

      const foundElements = elements.filter(selector => 
        document.querySelector(selector) !== null
      );

      return {
        success: foundElements.length >= 2,
        message: `Found ${foundElements.length}/${elements.length} expected element types`
      };
    });
  }

  // Test questionnaires page elements
  async testQuestionnairesPageElements() {
    if (!window.location.pathname.includes('/questionnaires')) {
      return this.test('Questionnaires Page Elements', async () => ({
        success: true,
        message: 'Skipped - not on questionnaires page'
      }));
    }

    return this.test('Questionnaires Page Elements', async () => {
      const elements = [
        'h1, h2', // Should have headings
        'button, input', // Should have interactive elements
        '.questionnaire-container, .question, .answer-option' // Should have questionnaire elements
      ];

      const foundElements = elements.filter(selector => 
        document.querySelector(selector) !== null
      );

      return {
        success: foundElements.length >= 1,
        message: `Found ${foundElements.length}/${elements.length} expected element types`
      };
    });
  }

  // Test for JavaScript errors
  async testJavaScriptErrors() {
    return this.test('JavaScript Error Check', async () => {
      const originalOnError = window.onerror;
      const errors = [];
      
      window.onerror = (message, source, lineno, colno, error) => {
        errors.push({ message, source, lineno, colno, error });
        if (originalOnError) originalOnError(message, source, lineno, colno, error);
      };
      
      // Wait 2 seconds to catch any errors
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      window.onerror = originalOnError;
      
      return {
        success: errors.length === 0,
        message: errors.length === 0 
          ? 'No JavaScript errors detected'
          : `${errors.length} JavaScript errors found`
      };
    });
  }

  // Test network requests
  async testNetworkRequests() {
    return this.test('Network Request Monitoring', async () => {
      const originalFetch = window.fetch;
      const requests = [];
      let failedRequests = 0;
      
      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        requests.push({
          url: args[0],
          status: response.status,
          ok: response.ok
        });
        
        if (!response.ok && response.status >= 500) {
          failedRequests++;
        }
        
        return response;
      };
      
      // Trigger some network activity by refreshing or clicking
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      window.fetch = originalFetch;
      
      return {
        success: failedRequests === 0,
        message: failedRequests === 0 
          ? `All ${requests.length} requests successful`
          : `${failedRequests} failed requests out of ${requests.length}`
      };
    });
  }

  // Generate report
  generateReport() {
    this.log('', 'info');
    this.log('='.repeat(60), 'info');
    this.log('📊 FRONTEND VALIDATION REPORT', 'info');
    this.log('='.repeat(60), 'info');
    
    this.log(`✅ Tests Passed: ${this.results.passed}`, 'success');
    this.log(`❌ Tests Failed: ${this.results.failed}`, 'error');
    this.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`, 'info');

    if (this.results.errors.length > 0) {
      this.log('🚨 ERRORS FOUND:', 'error');
      this.results.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.test}: ${error.error}`, 'error');
      });
    }

    this.log('📋 DETAILED RESULTS:', 'info');
    this.results.tests.forEach(test => {
      const type = test.status === 'PASS' ? 'success' : 'error';
      this.log(`${test.status === 'PASS' ? '✅' : '❌'} ${test.name}: ${test.message}`, type);
    });

    if (this.results.failed === 0) {
      this.log('🎉 Frontend validation passed! System is working correctly.', 'success');
    } else if (this.results.failed <= 2) {
      this.log('⚠️ Minor issues detected. System mostly functional.', 'warning');
    } else {
      this.log('🚨 Multiple issues detected. Check errors above.', 'error');
    }

    this.log('='.repeat(60), 'info');
    
    return this.results;
  }

  // Run all tests
  async runAllTests() {
    this.log('🚀 Starting frontend validation tests...', 'info');
    this.log('Testing Learn AI Questionnaire System Frontend', 'info');
    this.log('='.repeat(60), 'info');

    await this.testCurrentPage();
    await this.testJavaScriptErrors();
    await this.testConsoleErrors();
    await this.testApiEndpoints();
    await this.testPageNavigation();
    await this.testAdminPageElements();
    await this.testQuestionnairesPageElements();
    await this.testNetworkRequests();
    
    return this.generateReport();
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('%c🚀 Learn AI Frontend Validator Loaded!', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
  console.log('%cRun: validator.runAllTests() to start validation', 'color: #2196F3; font-weight: bold;');
  
  window.validator = new FrontendValidator();
  
  // Auto-run after 2 seconds
  setTimeout(() => {
    console.log('%c🏁 Auto-starting validation in 2 seconds...', 'color: #FF9800; font-weight: bold;');
    window.validator.runAllTests();
  }, 2000);
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrontendValidator;
}