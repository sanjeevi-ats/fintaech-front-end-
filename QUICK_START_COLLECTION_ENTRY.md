# Collection Entry Sheet - Quick Start Guide

## 🚀 5-Minute Quick Start

### **Step 1: Start Backend** (30 seconds)
```bash
cd D:\Finance\Backend\Fintech\Fintech\Fintech
dotnet run
```
Wait for: `Now listening on: http://localhost:5177`

---

### **Step 2: Start Frontend** (30 seconds)
```bash
cd D:\Finance\Frontend\microfinance-app
npm run dev
```
Wait for: `Ready on http://localhost:3000`

---

### **Step 3: Login** (30 seconds)
1. Open browser: `http://localhost:3000/login`
2. Enter credentials:
   - **Email**: `super_admin@finveda.com`
   - **Password**: `Admin@123`
3. Click "Login"

---

### **Step 4: Navigate to Collection Entry** (10 seconds)
1. Click "Collections" in sidebar
2. Click "Collection Entry Sheet" or go to: `http://localhost:3000/collection-entry`

---

### **Step 5: Test Loan ID Search** (2 minutes)

#### **Test 1: Direct Loan ID**
1. Enter a Loan ID in search box (e.g., `LN-2024-001`)
2. Click "Search" or press Enter
3. **Expected**: 
   - ✅ Loan details appear
   - ✅ Customer name displayed
   - ✅ Installment summary shows (Total, Paid, Pending)
   - ✅ Last paid installment details (if any)
   - ✅ Collection form pre-filled

#### **Test 2: Customer Name**
1. Enter customer name (e.g., `Amit Sharma`)
2. Click "Search"
3. **Expected**:
   - ✅ Customer's loans displayed
   - ✅ Can select from multiple loans
   - ✅ Installment data loads

#### **Test 3: Invalid Search**
1. Enter invalid ID (e.g., `INVALID-123`)
2. Click "Search"
3. **Expected**:
   - ✅ Error message: "No loan found with ID..."
   - ✅ No crash

---

### **Step 6: Record Collection** (1 minute)
1. After successful search, verify form shows:
   - Customer Name (readonly)
   - Loan ID (readonly)
   - Collection Date (default: today)
   - Collection Amount (editable)
   - Remarks (optional)
2. Enter amount (or use pre-filled)
3. Click "Submit Record Collection"
4. **Expected**:
   - ✅ Success message appears
   - ✅ Installment data refreshes
   - ✅ Paid count increases

---

## 🔍 Quick Debug Check

### **Open Browser Console** (F12)
Look for these logs when searching:

```
✅ Good Logs:
🔍 Starting search for: LN-2024-001
📊 Data loaded - Customers: X, Loans: Y
🎯 Direct Loan ID match found: 1
✅ Primary endpoint success - Installments found: 12
✅ Search completed successfully

❌ Bad Logs:
❌ Search error: Backend server is not running
❌ Both endpoints failed for loan
❌ Failed to fetch installments
```

---

## 🎯 Quick Test Checklist

| Test | Status | Time |
|------|--------|------|
| Backend running on 5177 | ⬜ | 30s |
| Frontend running on 3000 | ⬜ | 30s |
| Login successful | ⬜ | 30s |
| Navigate to Collection Entry | ⬜ | 10s |
| Loan ID search works | ⬜ | 1m |
| Installments load | ⬜ | 30s |
| Customer search works | ⬜ | 1m |
| Collection submission works | ⬜ | 1m |

**Total Time**: ~5 minutes

---

## 🐛 Quick Troubleshooting

### **Issue**: Backend not starting
**Fix**: 
```bash
# Check if port 5177 is in use
netstat -ano | findstr :5177
# Kill process if needed
taskkill /PID <PID> /F
```

### **Issue**: Frontend not starting
**Fix**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### **Issue**: Login fails
**Fix**: 
- Verify credentials: `super_admin@finveda.com` / `Admin@123`
- Check backend logs for errors
- Verify database is accessible

### **Issue**: Search returns no results
**Fix**:
- Check if database has loan data
- Verify Loan ID exists
- Check console logs for API errors
- Verify backend is running

### **Issue**: Installments not loading
**Fix**:
- Open browser console (F12)
- Check for API errors
- Verify loan has installments in database
- Check Network tab for failed requests

---

## 📊 Sample Test Data

### **If you need to create test data:**

```sql
-- Check existing loans
SELECT TOP 5 Id, CustomerId, Principal, Status 
FROM LoanCases 
WHERE Status = 'active';

-- Check existing customers
SELECT TOP 5 Id, Name, Phone 
FROM Customers;

-- Check installments for a loan
SELECT * FROM Installments 
WHERE LoanCaseId = 'YOUR_LOAN_ID'
ORDER BY No;
```

---

## ✅ Success Indicators

### **Search Working**
- ✅ Loan details appear within 2 seconds
- ✅ No console errors
- ✅ Installment counts displayed
- ✅ Customer name shown

### **Installments Loading**
- ✅ Total installments count > 0
- ✅ Paid + Pending = Total
- ✅ Last paid details shown (if applicable)
- ✅ Next due amount displayed

### **Collection Submission**
- ✅ Success message appears
- ✅ Data refreshes automatically
- ✅ Paid count increases
- ✅ No errors in console

---

## 🎉 You're Done!

If all tests pass, the Collection Entry Sheet is working correctly!

### **What's Fixed**
- ✅ Direct Loan ID search now works
- ✅ Installment data loads properly
- ✅ API fallback mechanisms in place
- ✅ Clear error messages
- ✅ Comprehensive debugging

### **Next Steps**
1. Test with real production data
2. Train collection officers on the feature
3. Monitor for any issues
4. Collect user feedback

---

## 📞 Need Help?

### **Check Documentation**
- `COLLECTION_ENTRY_COMPLETE_SOLUTION.md` - Full solution details
- `COLLECTION_ENTRY_TESTING_GUIDE.md` - Comprehensive testing
- `COLLECTION_ENTRY_API_REFERENCE.md` - API details

### **Debug Steps**
1. Check browser console (F12)
2. Check Network tab for API calls
3. Check backend logs
4. Verify database data
5. Review error messages

---

**Total Setup Time**: ~5 minutes
**Status**: ✅ Ready to use!