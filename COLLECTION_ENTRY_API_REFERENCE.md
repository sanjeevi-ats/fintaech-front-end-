# Collection Entry Sheet - API Reference

## 🔗 Backend Base URL
```
http://localhost:5177
```

---

## 📡 API Endpoints Used

### **1. Get All Customers**
```http
GET /api/v1/Customers
```

**Purpose**: Fetch all customers for search matching

**Response Example**:
```json
[
  {
    "id": "customer-uuid-123",
    "name": "Amit Sharma",
    "phone": "9876543210",
    "email": "amit@example.com",
    "address": "123 Main St",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### **2. Get All Loan Cases**
```http
GET /api/v1/LoanCases
```

**Purpose**: Fetch all loans for search matching

**Response Example**:
```json
[
  {
    "id": "loan-uuid-456",
    "customerId": "customer-uuid-123",
    "principal": 10000000,
    "totalReceivable": 12000000,
    "status": "active",
    "disbursedDate": "2024-01-20T00:00:00Z"
  }
]
```

**Note**: Amounts are in **Paise** (1 Rupee = 100 Paise)

---

### **3. Get Installments by Loan ID (Primary)**
```http
GET /api/v1/Installments/loan/{loanId}
```

**Purpose**: Fetch all installments for a specific loan

**Example Request**:
```
GET /api/v1/Installments/loan/loan-uuid-456
```

**Response Example**:
```json
[
  {
    "id": "installment-uuid-789",
    "loanCaseId": "loan-uuid-456",
    "branchId": "branch-uuid-001",
    "no": 1,
    "dueDate": "2024-02-20T00:00:00Z",
    "amount": 100000,
    "status": "paid",
    "collectedAmount": 100000,
    "collectedDate": "2024-02-18T10:30:00Z",
    "collectedBy": "user-uuid-001"
  },
  {
    "id": "installment-uuid-790",
    "loanCaseId": "loan-uuid-456",
    "branchId": "branch-uuid-001",
    "no": 2,
    "dueDate": "2024-03-20T00:00:00Z",
    "amount": 100000,
    "status": "pending",
    "collectedAmount": null,
    "collectedDate": null,
    "collectedBy": null
  }
]
```

**Status Values**:
- `pending`: Not paid yet
- `partially_paid`: Partial payment made
- `paid`: Fully paid

---

### **4. Get Due Installments (Fallback)**
```http
GET /api/v1/Installments/due?loanId={loanId}
```

**Purpose**: Fetch due/pending installments for a specific loan

**Example Request**:
```
GET /api/v1/Installments/due?loanId=loan-uuid-456
```

**Response**: Same format as endpoint #3, but may only return pending installments

---

### **5. Record Collection Payment**
```http
POST /api/v1/Collection/collect
```

**Purpose**: Record a collection payment for an installment

**Request Body**:
```json
{
  "installmentId": "installment-uuid-790",
  "amountPaid": 100000,
  "mode": "Cash",
  "utrRef": null,
  "remarks": "Payment received in cash"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Collection recorded successfully",
  "receiptId": "RCP-1234567890"
}
```

**Payment Modes**:
- `Cash`
- `UPI`
- `Bank Transfer`
- `Cheque`

---

## 🔄 Search Flow Logic

### **Step 1: Load Data**
```javascript
const [customers, loans] = await Promise.all([
  apiClient.get('/api/v1/Customers'),
  apiClient.get('/api/v1/LoanCases')
]);
```

### **Step 2: Check Direct Loan ID Match**
```javascript
const directLoanMatches = loans.filter(loan => 
  loan.id.toLowerCase().includes(searchQuery) ||
  loan.id.toLowerCase() === searchQuery
);

if (directLoanMatches.length > 0) {
  matchingLoans = directLoanMatches;
}
```

### **Step 3: Fallback to Customer Search**
```javascript
else {
  const matchingCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery) ||
    customer.phone.includes(searchQuery) ||
    customer.id.toLowerCase().includes(searchQuery)
  );

  matchingLoans = loans.filter(loan => 
    matchingCustomers.some(customer => customer.id === loan.customerId)
  );
}
```

### **Step 4: Fetch Installments**
```javascript
// Try primary endpoint
try {
  installments = await apiClient.get(`/api/v1/Installments/loan/${loanId}`);
} catch (error) {
  // Fallback to due endpoint
  installments = await apiClient.get(`/api/v1/Installments/due?loanId=${loanId}`);
}
```

---

## 💰 Amount Conversion

**Important**: All amounts in the API are in **Paise** (1 Rupee = 100 Paise)

### **Display Conversion (API → UI)**
```javascript
const displayAmount = apiAmount / 100;
// Example: 10000000 paise → ₹100,000
```

### **Submission Conversion (UI → API)**
```javascript
const apiAmount = Math.round(displayAmount * 100);
// Example: ₹100,000 → 10000000 paise
```

---

## 🧮 Installment Calculations

### **Total Installments**
```javascript
const totalInstallments = installments.length;
```

### **Paid Installments**
```javascript
const paidInstallments = installments.filter(
  inst => inst.status === 'paid'
).length;
```

### **Pending Installments**
```javascript
const pendingInstallments = installments.filter(
  inst => inst.status !== 'paid'
).length;
```

### **Next Due Installment**
```javascript
const nextDueInstallment = installments.find(
  inst => inst.status === 'pending'
);
```

### **Last Paid Installment**
```javascript
const lastPaidInstallment = installments
  .filter(inst => inst.status === 'paid')
  .sort((a, b) => 
    new Date(b.collectedDate).getTime() - 
    new Date(a.collectedDate).getTime()
  )[0];
```

---

## 🔐 Authentication

### **Login Endpoint**
```http
POST /api/v1/Auth/login
```

**Request Body**:
```json
{
  "email": "super_admin@finveda.com",
  "password": "Admin@123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid-001",
    "email": "super_admin@finveda.com",
    "role": "super_admin",
    "name": "Super Admin"
  }
}
```

### **Authorization Header**
```http
Authorization: Bearer {token}
```

---

## 🎯 Role-Based Access

### **Allowed Roles for Collection Entry**
- `super_admin` - Full access
- `collection_officer` - Full access
- `agent` - Full access (if configured)

### **Restricted Roles**
- `viewer` - Read-only access
- `branch_manager` - May have limited access
- Other roles - No access

---

## 🐛 Error Handling

### **404 Not Found**
```json
{
  "message": "Loan not found",
  "statusCode": 404
}
```

### **401 Unauthorized**
```json
{
  "message": "Unauthorized access",
  "statusCode": 401
}
```

### **400 Bad Request**
```json
{
  "message": "Invalid request data",
  "errors": {
    "amount": "Amount must be greater than 0"
  },
  "statusCode": 400
}
```

### **500 Internal Server Error**
```json
{
  "message": "Redis connection error",
  "statusCode": 500
}
```

**Fix for Redis Error**: Add `abortConnect=false` to Redis connection string

---

## 🧪 Testing with Swagger

### **Access Swagger UI**
```
http://localhost:5177/swagger
```

### **Test Endpoints**
1. Click on endpoint to expand
2. Click "Try it out"
3. Enter parameters
4. Click "Execute"
5. View response

---

## 📊 Sample Test Data

### **Test Loan IDs**
```
LN-2024-001
LN-2024-002
LN-2024-003
```

### **Test Customer Names**
```
Amit Sharma
Priya Patel
Rajesh Kumar
```

### **Test Customer IDs**
```
Use actual UUIDs from database
```

---

## 🔍 Debugging Tips

### **Check API Response in Browser Console**
```javascript
// Open browser console (F12)
// Look for these logs:
📡 Trying primary endpoint: /api/v1/Installments/loan/{loanId}
✅ Primary endpoint success - Installments found: 12
```

### **Check Network Tab**
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look for API calls
5. Check request/response details

### **Common Issues**
- **CORS Error**: Backend not configured for frontend origin
- **401 Error**: Token expired or invalid
- **404 Error**: Wrong endpoint or resource not found
- **500 Error**: Backend server error (check backend logs)

---

## ✅ Validation Rules

### **Collection Amount**
- Must be greater than 0
- Must be a valid number
- Converted to paise before submission

### **Collection Date**
- Must be today or past date
- Future dates not allowed
- Format: YYYY-MM-DD

### **Loan Selection**
- Must select a loan before submission
- Loan must have pending installments

### **User Role**
- Must be Admin or Collection Officer
- Other roles cannot submit collections

---

## 🚀 Quick API Test Script

```bash
# Test Get Customers
curl -X GET "http://localhost:5177/api/v1/Customers" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test Get Loans
curl -X GET "http://localhost:5177/api/v1/LoanCases" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test Get Installments
curl -X GET "http://localhost:5177/api/v1/Installments/loan/LOAN_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test Record Collection
curl -X POST "http://localhost:5177/api/v1/Collection/collect" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "installmentId": "INSTALLMENT_ID",
    "amountPaid": 100000,
    "mode": "Cash",
    "remarks": "Test payment"
  }'
```

---

This API reference provides all the information needed to understand and test the Collection Entry Sheet functionality.