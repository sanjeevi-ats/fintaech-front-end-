# Collection Entry Page - Quick Reference

## 🚀 Quick Start

```bash
# Start backend
cd D:\Finance\Backend\Fintech\Fintech\Fintech
dotnet run

# Start frontend
cd D:\Finance\Frontend\microfinance-app
npm run dev

# Access
http://localhost:3000/collection-entry
```

---

## 🔍 Search

| Search Type | Example | Result |
|------------|---------|--------|
| Customer Name | "Jane Smith" | Find customer's loans |
| Customer ID | "cust-123" | Find customer's loans |
| Loan ID | "LN-2024-001" | Find loan directly |

---

## 💰 Payment Summary

| Field | Color | Meaning |
|-------|-------|---------|
| Total Paid | Green | Already collected |
| Remaining Due | Red | Still to collect |
| This Month Due | Orange | Current month obligation |
| Overdue | Dark Red | Past due amount |

---

## 🎯 Quick Amount Buttons

| Button | Action |
|--------|--------|
| This Month | Fill current month due |
| Overdue | Fill overdue amount |
| Next Due | Fill next installment |
| Full Payment | Fill total remaining |

---

## ✅ Validation Rules

- ✅ Amount must be > 0
- ✅ Date must be today or past
- ✅ All required fields must be filled
- ✅ User must have proper role

---

## 🐛 Troubleshooting

### Search Returns No Results
- Check if customer/loan exists in database
- Try different search criteria
- Verify backend is running

### Collection Submission Fails
- Check browser console (F12)
- Verify backend API is running
- Check if endpoints exist
- Look for specific error message

### Data Doesn't Refresh
- Check console for errors
- Try manual refresh
- Verify backend updated data
- Check network tab for API calls

---

## 📊 Console Logs

### Successful Search
```
🔍 Starting search for: Jane Smith
📊 Data loaded - Customers: 20 Loans: 22
✅ Valid data - Customers: 20 Loans: 22
✅ Search completed successfully
```

### Successful Collection
```
📝 Submitting collection entry: {...}
📡 Trying primary endpoint: POST /api/v1/Collection/collect
✅ Payment recorded successfully
✅ Collection recorded successfully!
🔄 Refreshing loan data...
✅ Loan data refreshed
```

### API Fallback
```
📡 Trying primary endpoint: POST /api/v1/Collection/collect
⚠️ Primary endpoint failed, trying alternatives
📡 Trying alternative endpoint: POST /api/v1/Installments/collect
✅ Payment recorded successfully
```

---

## 🔗 API Endpoints

### GET Endpoints
```
GET /api/v1/Customers
GET /api/v1/LoanCases
GET /api/v1/Installments/loan/{loanId}
GET /api/v1/Installments/due?loanId={loanId}
```

### POST Endpoints (with fallback)
```
POST /api/v1/Collection/collect (Primary)
POST /api/v1/Installments/collect (Fallback 1)
PUT /api/v1/Installments/{id} (Fallback 2)
```

---

## 📱 UI Elements

### Search Section
- Input field for search term
- Search button
- Help text with search options

### Loan Details
- Customer name
- Loan ID
- Total loan amount
- Total receivable

### Payment Summary
- Total paid (green)
- Remaining due (red)
- This month due (orange)
- Overdue amount (dark red)

### Installment Summary
- Total count
- Completed count
- Pending count
- Last paid details

### Collection Form
- Customer name (readonly)
- Loan ID (readonly)
- Collection date picker
- Amount input with quick buttons
- Remarks textarea
- Submit button

---

## 🎨 Colors

| Color | Usage |
|-------|-------|
| Green (#10b981) | Paid amounts, success |
| Red (#ef4444) | Remaining due, errors |
| Orange (#f59e0b) | This month due, warnings |
| Blue (#6366f1) | Loan amounts, primary |
| Dark Red (#dc2626) | Overdue, critical |

---

## 📋 Workflow

```
1. Search
   ↓
2. View Details
   ↓
3. Select Amount (quick button or manual)
   ↓
4. Enter Date & Remarks
   ↓
5. Submit
   ↓
6. Success Message
   ↓
7. Auto-Refresh Data
```

---

## 🔐 Access Control

**Allowed Roles**:
- super_admin
- collection_officer
- agent

**Restricted Roles**:
- All others see "Access Denied"

---

## 📊 Example Data

### Loan with Partial Payments
```
Customer: Jane Smith
Loan ID: LN-2024-001
Total Loan: ₹1,00,000
Total Receivable: ₹1,20,000

Payment Summary:
├─ Total Paid: ₹60,000 (6 installments)
├─ Remaining Due: ₹60,000 (6 installments)
├─ This Month Due: ₹10,000
└─ Overdue: ₹0

Installments: 12 Total | 6 Completed | 6 Pending
Last Paid: #6 on 10-Apr-2026 (₹10,000)
```

---

## ✨ Features

- ✅ Advanced search (Name/ID/Loan ID)
- ✅ Payment summary display
- ✅ Quick amount buttons
- ✅ Date validation
- ✅ Role-based access
- ✅ Auto-refresh
- ✅ Error handling
- ✅ Comprehensive logging

---

## 🚨 Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "No loan found" | Loan doesn't exist | Check Loan ID |
| "No customer found" | Customer doesn't exist | Check customer name |
| "Backend API endpoint not found" | API endpoint missing | Check backend |
| "Future dates not allowed" | Date is in future | Select today or past |
| "Amount must be > 0" | Invalid amount | Enter valid amount |

---

## 📞 Quick Help

**Q: How do I search?**
A: Enter customer name, customer ID, or loan ID and click Search

**Q: How do I fill the amount?**
A: Click a quick button or type manually

**Q: What if search fails?**
A: Check console (F12) for error details

**Q: What if collection fails?**
A: Check if backend is running and API endpoints exist

**Q: How do I know if it worked?**
A: Look for success message and check if data refreshes

---

**Status**: ✅ READY TO USE