#!/usr/bin/env node

/**
 * Integration Verification Script
 * Checks if all key files and configurations are properly set up
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Frontend-Backend Integration...\n');

const checks = [
  {
    name: 'API Client Configuration',
    check: () => {
      const apiClientPath = './src/services/apiClient.ts';
      if (!fs.existsSync(apiClientPath)) return { success: false, message: 'apiClient.ts not found' };
      
      const content = fs.readFileSync(apiClientPath, 'utf8');
      if (content.includes('localhost:5177')) {
        return { success: true, message: 'Configured for port 5177 ✓' };
      }
      return { success: false, message: 'Wrong port configuration' };
    }
  },
  {
    name: 'Environment Configuration',
    check: () => {
      const envPath = './.env.local';
      if (!fs.existsSync(envPath)) return { success: false, message: '.env.local not found' };
      
      const content = fs.readFileSync(envPath, 'utf8');
      if (content.includes('5177')) {
        return { success: true, message: 'Environment configured for port 5177 ✓' };
      }
      return { success: false, message: 'Wrong environment configuration' };
    }
  },
  {
    name: 'Authentication Service',
    check: () => {
      const authPath = './src/services/authService.ts';
      if (!fs.existsSync(authPath)) return { success: false, message: 'authService.ts not found' };
      
      const content = fs.readFileSync(authPath, 'utf8');
      if (content.includes('/api/v1/Auth/login')) {
        return { success: true, message: 'Auth endpoints configured ✓' };
      }
      return { success: false, message: 'Auth endpoints not configured' };
    }
  },
  {
    name: 'Loan Service',
    check: () => {
      const loanPath = './src/services/loanService.ts';
      if (!fs.existsSync(loanPath)) return { success: false, message: 'loanService.ts not found' };
      
      const content = fs.readFileSync(loanPath, 'utf8');
      if (content.includes('/api/v1/LoanCases')) {
        return { success: true, message: 'Loan endpoints configured ✓' };
      }
      return { success: false, message: 'Loan endpoints not configured' };
    }
  },
  {
    name: 'Customer Service',
    check: () => {
      const customerPath = './src/services/customerService.ts';
      if (!fs.existsSync(customerPath)) return { success: false, message: 'customerService.ts not found' };
      
      const content = fs.readFileSync(customerPath, 'utf8');
      if (content.includes('/api/v1/Customers')) {
        return { success: true, message: 'Customer endpoints configured ✓' };
      }
      return { success: false, message: 'Customer endpoints not configured' };
    }
  },
  {
    name: 'Branch Service',
    check: () => {
      const branchPath = './src/services/branchService.ts';
      if (!fs.existsSync(branchPath)) return { success: false, message: 'branchService.ts not found' };
      
      const content = fs.readFileSync(branchPath, 'utf8');
      if (content.includes('/api/v1/Branch')) {
        return { success: true, message: 'Branch endpoints configured ✓' };
      }
      return { success: false, message: 'Branch endpoints not configured' };
    }
  },
  {
    name: 'Report Service',
    check: () => {
      const reportPath = './src/services/reportService.ts';
      if (!fs.existsSync(reportPath)) return { success: false, message: 'reportService.ts not found' };
      
      const content = fs.readFileSync(reportPath, 'utf8');
      if (content.includes('/api/v1/Report')) {
        return { success: true, message: 'Report endpoints configured ✓' };
      }
      return { success: false, message: 'Report endpoints not configured' };
    }
  },
  {
    name: 'Accounting Service',
    check: () => {
      const accountingPath = './src/services/accountingService.ts';
      if (!fs.existsSync(accountingPath)) return { success: false, message: 'accountingService.ts not found' };
      
      const content = fs.readFileSync(accountingPath, 'utf8');
      if (content.includes('/api/v1/Journal') && content.includes('/api/v1/Ledger')) {
        return { success: true, message: 'Accounting endpoints configured ✓' };
      }
      return { success: false, message: 'Accounting endpoints not configured' };
    }
  },
  {
    name: 'Package Dependencies',
    check: () => {
      const packagePath = './package.json';
      if (!fs.existsSync(packagePath)) return { success: false, message: 'package.json not found' };
      
      const content = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const requiredDeps = ['next', 'react', 'lucide-react', 'recharts'];
      const missing = requiredDeps.filter(dep => !content.dependencies[dep]);
      
      if (missing.length === 0) {
        return { success: true, message: 'All required dependencies present ✓' };
      }
      return { success: false, message: `Missing dependencies: ${missing.join(', ')}` };
    }
  },
  {
    name: 'Integration Pages',
    check: () => {
      const testApiPath = './src/app/test-api/page.tsx';
      const statusPath = './src/app/integration-status/page.tsx';
      
      if (!fs.existsSync(testApiPath)) return { success: false, message: 'test-api page not found' };
      if (!fs.existsSync(statusPath)) return { success: false, message: 'integration-status page not found' };
      
      return { success: true, message: 'Integration pages available ✓' };
    }
  }
];

let passedChecks = 0;
let totalChecks = checks.length;

checks.forEach((check, index) => {
  const result = check.check();
  const status = result.success ? '✅' : '❌';
  const number = (index + 1).toString().padStart(2, '0');
  
  console.log(`${status} ${number}. ${check.name}`);
  console.log(`    ${result.message}\n`);
  
  if (result.success) passedChecks++;
});

console.log('📊 Integration Verification Summary');
console.log('═'.repeat(40));
console.log(`✅ Passed: ${passedChecks}/${totalChecks}`);
console.log(`❌ Failed: ${totalChecks - passedChecks}/${totalChecks}`);
console.log(`📈 Success Rate: ${Math.round((passedChecks / totalChecks) * 100)}%\n`);

if (passedChecks === totalChecks) {
  console.log('🎉 All integration checks passed!');
  console.log('🚀 Ready to start the application:');
  console.log('   1. Start backend: cd "D:\\Finance\\Backend\\Fintech\\Fintech\\Fintech" && dotnet run');
  console.log('   2. Start frontend: npm run dev');
  console.log('   3. Open: http://localhost:3000');
} else {
  console.log('⚠️  Some integration checks failed.');
  console.log('📖 Please review the failed items above and fix them before starting.');
}

console.log('\n📚 Additional Resources:');
console.log('   • Startup Guide: ./STARTUP_GUIDE.md');
console.log('   • Integration Guide: ./INTEGRATION_GUIDE.md');
console.log('   • API Tests: http://localhost:3000/test-api (after starting)');
console.log('   • Integration Status: http://localhost:3000/integration-status (after starting)');