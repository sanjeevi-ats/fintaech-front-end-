# Frontend-Backend Integration Guide

## Overview
This document outlines the complete integration between the FinVeda microfinance frontend (Next.js) and backend (ASP.NET Core) APIs.

## Integration Status ✅ COMPLETE

### ✅ Completed Integrations

1. **Authentication System**
   - Login with real backend authentication
   - JWT token management
   - Role-based access control
   - Session persistence

2. **API Services Layer**
   - Complete service layer for all backend endpoints
   - Proper error handling and loading states
   - TypeScript interfaces matching backend DTOs

3. **Core Features**
   - Loan Applications (CRUD operations)
   - Customer Management
   - Collection Sheet with real-time payment recording
   - Dashboard with live statistics
   - Branch Management
   - Partner Management
   - Reporting & Analytics

4. **Data Models**
   - All interfaces updated to match backend DTOs
   - Proper handling of currency (paise conversion)
   - Date formatting and validation

## API Configuration

### Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend Configuration
- **Base URL**: `http://localhost:5000`
- **API Version**: `v1`
- **Authentication**: JWT Bearer tokens
- **Content Type**: `application/json`

## Service Layer Architecture

### Core Services
```typescript
// Authentication
authService.login(credentials)
authService.register(userData)
authService.refreshToken(token)

// Loan Management
loanService.getAll()
loanService.create(loanData)
loanService.approve(id)
loanService.disburse(id)

// Customer Management
customerService.getAll()
customerService.create(customerData)
customerService.update(id, data)

// Collections
installmentService.getDueInstallments()
installmentService.recordPayment(paymentData)

// Reporting
reportService.getDashboardStats()
reportService.getParReport()
reportService.getCollectionEfficiency()
```

## Key Integration Points

### 1. Authentication Flow
```typescript
// Login Process
const response = await authService.login({ email, password });
localStorage.setItem('token', response.token);
// Token automatically included in all subsequent API calls
```

### 2. Error Handling
```typescript
// Centralized error handling in apiClient
if (response.status === 401) {
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

### 3. Data Transformation
```typescript
// Currency conversion (backend uses paise)
const principalInPaise = principalInRupees * 100;
const displayAmount = amountInPaise / 100;
```

### 4. Real-time Updates
```typescript
// Refresh data after operations
await loanService.approve(id);
await loadData(); // Refresh the list
```

## Updated Components

### 1. Loan Applications (`/loans/applications`)
- ✅ Real API integration for loan CRUD
- ✅ Customer creation workflow
- ✅ Loan approval and disbursement
- ✅ Loading states and error handling

### 2. Collection Sheet (`/mobile/collection-sheet`)
- ✅ Real-time installment data
- ✅ Payment recording functionality
- ✅ Progress tracking
- ✅ Offline mode simulation

### 3. Dashboard (`/admin/war-room`)
- ✅ Live statistics from backend
- ✅ Real-time data refresh
- ✅ Error fallback to cached data

### 4. Authentication (`/login`)
- ✅ Real backend authentication
- ✅ JWT token management
- ✅ Role-based redirects

## API Endpoint Mapping

### Authentication
- `POST /api/v1/Auth/login` → Login
- `POST /api/v1/Auth/register` → User registration
- `POST /api/v1/Auth/refresh-token` → Token refresh

### Loan Management
- `GET /api/v1/LoanCases` → Get all loans
- `POST /api/v1/LoanCases` → Create loan
- `POST /api/v1/LoanCases/{id}/approve` → Approve loan
- `POST /api/v1/LoanCases/{id}/disburse` → Disburse loan

### Customer Management
- `GET /api/v1/Customers` → Get all customers
- `POST /api/v1/Customers` → Create customer
- `PUT /api/v1/Customers/{id}` → Update customer

### Collections
- `GET /api/v1/Installments/due` → Get due installments
- `POST /api/v1/Collection/collect` → Record payment

### Reporting
- `GET /api/v1/Report/dashboard-stats` → Dashboard statistics
- `GET /api/v1/Report/par` → Portfolio at Risk report
- `GET /api/v1/Report/efficiency` → Collection efficiency

## Testing

### API Integration Test Page
Visit `/test-api` to run comprehensive API connectivity tests:
- Authentication test
- Data fetching tests
- Error handling verification
- Response format validation

### Manual Testing Checklist
- [ ] Login with valid credentials
- [ ] Create new customer
- [ ] Create new loan application
- [ ] Approve and disburse loan
- [ ] Record payment collection
- [ ] View dashboard statistics
- [ ] Test error scenarios

## Error Handling Strategy

### 1. Network Errors
- Automatic retry for transient failures
- Graceful degradation to cached data
- User-friendly error messages

### 2. Authentication Errors
- Automatic logout on 401 responses
- Redirect to login page
- Token refresh on expiry

### 3. Validation Errors
- Form-level error display
- Field-specific validation messages
- Prevent invalid submissions

## Performance Optimizations

### 1. API Calls
- Parallel requests where possible
- Debounced search inputs
- Cached responses for static data

### 2. Loading States
- Skeleton screens for better UX
- Progressive loading for large datasets
- Optimistic updates for quick actions

### 3. Error Recovery
- Retry mechanisms for failed requests
- Offline mode for critical operations
- Data synchronization on reconnect

## Security Considerations

### 1. Token Management
- Secure storage of JWT tokens
- Automatic token refresh
- Logout on token expiry

### 2. Data Validation
- Client-side input validation
- Server response validation
- XSS protection

### 3. API Security
- HTTPS in production
- CORS configuration
- Rate limiting (backend)

## Deployment Notes

### Frontend Deployment
1. Set `NEXT_PUBLIC_API_URL` to production backend URL
2. Build and deploy Next.js application
3. Configure reverse proxy if needed

### Backend Requirements
- Backend must be running on configured URL
- CORS must allow frontend domain
- Database must be accessible
- JWT configuration must match

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS policy includes frontend URL
   - Check for proper headers in requests

2. **Authentication Failures**
   - Verify JWT secret key configuration
   - Check token expiry settings
   - Ensure proper role assignments

3. **API Connection Issues**
   - Verify `NEXT_PUBLIC_API_URL` environment variable
   - Check backend server status
   - Validate network connectivity

### Debug Tools
- Browser Network tab for API calls
- Console logs for error details
- `/test-api` page for connectivity verification

## Future Enhancements

### Planned Features
- [ ] Real-time notifications via WebSocket
- [ ] Offline-first architecture with sync
- [ ] Advanced caching strategies
- [ ] Performance monitoring
- [ ] Automated testing suite

### API Improvements
- [ ] Pagination for large datasets
- [ ] Advanced filtering and search
- [ ] Bulk operations support
- [ ] File upload capabilities
- [ ] Audit trail integration

## Support

For integration issues or questions:
1. Check this documentation
2. Review API test results at `/test-api`
3. Check browser console for errors
4. Verify backend API documentation
5. Test individual API endpoints

---

**Integration Status**: ✅ Complete - All core features integrated with backend APIs
**Last Updated**: April 12, 2026
**Version**: 1.0.0