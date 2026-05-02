# 🚀 FinVeda Application Startup Guide

## Prerequisites

### Backend Requirements
- .NET 8.0 SDK or later
- PostgreSQL database
- Redis (optional, for caching)

### Frontend Requirements
- Node.js 18+ 
- npm or yarn package manager

## 🔧 Backend Setup

### 1. Navigate to Backend Directory
```bash
cd "D:\Finance\Backend\Fintech\Fintech\Fintech"
```

### 2. Restore Dependencies
```bash
dotnet restore
```

### 3. Update Database Connection (if needed)
Edit `appsettings.json` or `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=FinVedaDb;Username=postgres;Password=your_password"
  }
}
```

### 4. Run Database Migrations (if needed)
```bash
dotnet ef database update
```

### 5. Start Backend Server
```bash
dotnet run
```

**Backend will be available at:** `http://localhost:5177`
**Swagger Documentation:** `http://localhost:5177/swagger`

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd "D:\Finance\Frontend\microfinance-app"
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Verify Environment Configuration
Check `.env.local` file contains:
```
NEXT_PUBLIC_API_URL=http://localhost:5177
```

### 4. Start Frontend Development Server
```bash
npm run dev
# or
yarn dev
```

**Frontend will be available at:** `http://localhost:3000`

## 🧪 Testing the Integration

### 1. Access the Application
Open your browser and go to: `http://localhost:3000`

### 2. Test API Connectivity
Visit: `http://localhost:3000/test-api` to run comprehensive API tests

### 3. Login with Test Credentials
- **Email:** `super_admin@finveda.com`
- **Password:** `Admin@123`

### 4. Test Core Features
1. **Dashboard** - View live statistics
2. **Loan Applications** - Create and manage loans
3. **Collection Sheet** - Record payments
4. **Branch Management** - Manage branches
5. **Reports** - View financial reports

## 🔍 Troubleshooting

### Backend Issues

**Port Already in Use:**
```bash
# Kill process on port 5177
netstat -ano | findstr :5177
taskkill /PID <process_id> /F
```

**Database Connection Issues:**
- Ensure PostgreSQL is running
- Verify connection string in appsettings.json
- Check database exists and user has permissions

**CORS Issues:**
- Backend is configured to allow all origins for development
- If issues persist, check the CORS policy in Program.cs

### Frontend Issues

**API Connection Failed:**
- Verify backend is running on port 5177
- Check `.env.local` has correct API URL
- Test backend directly: `http://localhost:5177/swagger`

**Authentication Issues:**
- Ensure user exists in database
- Check credentials: `super_admin@finveda.com` / `Admin@123`
- Verify JWT configuration matches between frontend/backend

**Build Issues:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📊 Integration Status

### ✅ Completed Features
- **Authentication** - JWT-based login/logout
- **Loan Management** - Full CRUD operations
- **Customer Management** - Create, view, update customers
- **Collection Operations** - Real-time payment recording
- **Branch Management** - Multi-tenant branch operations
- **Dashboard Analytics** - Live KPIs and reporting
- **Financial Reports** - P&L, trial balance, journal entries
- **Audit Trail** - Complete change tracking

### 🔗 API Endpoints Integrated
- `/api/v1/Auth/*` - Authentication
- `/api/v1/LoanCases/*` - Loan management
- `/api/v1/Customers/*` - Customer operations
- `/api/v1/Branch/*` - Branch management
- `/api/v1/Report/*` - Analytics and reporting
- `/api/v1/Installments/*` - Payment collections
- `/api/v1/Partners/*` - Partner management
- `/api/v1/Ledger/*` - Accounting operations

## 🎯 Quick Start Commands

### Start Both Services (Windows)
```batch
# Terminal 1 - Backend
cd "D:\Finance\Backend\Fintech\Fintech\Fintech"
dotnet run

# Terminal 2 - Frontend  
cd "D:\Finance\Frontend\microfinance-app"
npm run dev
```

### Verify Everything is Working
1. Backend: `http://localhost:5177/swagger`
2. Frontend: `http://localhost:3000`
3. API Tests: `http://localhost:3000/test-api`
4. Integration Status: `http://localhost:3000/integration-status`

## 📞 Support

If you encounter any issues:

1. **Check Backend Logs** - Look at the console output from `dotnet run`
2. **Check Frontend Console** - Open browser dev tools (F12)
3. **Test API Directly** - Use Swagger UI at `http://localhost:5177/swagger`
4. **Run API Tests** - Visit `http://localhost:3000/test-api`

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Backend shows "Now listening on: http://localhost:5177"
- ✅ Frontend shows "Ready - started server on 0.0.0.0:3000"
- ✅ Login page accepts credentials and redirects to dashboard
- ✅ Dashboard shows live data from backend
- ✅ API test page shows all tests passing

---

**Integration Status:** ✅ **COMPLETE**  
**Last Updated:** April 12, 2026  
**Backend Port:** 5177  
**Frontend Port:** 3000