# Collection Entry Testing Guide

## Overview
This guide provides step-by-step instructions to test the Collection Entry Sheet functionality after the recent fixes.

## Prerequisites

### 1. Backend Setup
```bash
cd Backend/Fintech/Fintech/Fintech
dotnet run
```
- Backend should be running on `http://localhost:5177`
- Check console for "Application started" message
- Verify no Redis connection errors (it's OK if Redis is not running)

### 2. Frontend Setup
```bash
cd Frontend/microfinance-app
npm run dev
```
- Frontend should be running on `http://localhost:3000`
- Navigate to Collection Entry page

### 3. Database Verification
Ensure test data exists:
```sql
-- Check customers exist
SELECT COUNT(*) FROM customers;

-- Check loans exist
SELECT COUNT(*) FROM loan_cases;

-- Check installments exist
SELECT COUNT(*) FROM installments WHERE status = 'pending';
```

## Test Scenarios

### Test 1: Search by Customer Name
**Objective:** Verify search functionality works with customer names

**Steps:**
1. Navigate to Collection Entry page
2. In search box, enter a customer name (e.g., "Amit Sharma")
3. Click "Search" button
4. **Expected Result:** 
   - Search completes without errors
   - One or more loans appear in results
   - Console shows: "✅ Search completed successfully"

**Verification:**
- Check browser console for logs
- Verify customer name matches search term
- Confirm loan details are displayed

---

### Test 2: Search by Loan ID
**Objective:** Verify direct Loan ID search works

**Steps:**
1. Navigate to Collection Entry page
2. In search box, enter a Loan ID (e.g., "0802b316-b265-4b1e-9189-0c93dca6e6fc")
3. Click "Search" button
4. **Expected Result:**
   - Search completes without errors
   - Exact loan appears in results
   - Console shows: "🎯 Direct Loan ID match found"

**Verification:**
- Check browser console for logs
- Verify loan ID matches search term
- Confirm installment details are loaded

---

### Test 3: Select Loan and View Details
**Objective:** Verify loan details display correctly

**Steps:**
1. Complete Test 1 or Test 2 (search for a loan)
2. Click on a loan in the search results
3. **Expected Result:**
   - Loan details panel appears on the right
   - Payment Summary shows:
     - Total Paid Amount (green)
     - Total Remaining Due (red)
     - This Month Due (orange)
     - Overdue Amount (dark red)
   - Installment details show total, completed, and pending counts
   - Quick amount buttons appear

**Verification:**
- All amounts are displayed correctly
- Colors match the design (green for paid, red for due)
- Quick buttons show correct amounts

---

### Test 4: Submit Collection - This Month Due
**Objective:** Verify collection submission with "This Month Due" amount

**Steps:**
1. Complete Test 3 (select a loan)
2. Click "This Month Due" quick button
3. Verify amount is pre-filled
4. Click "Submit Record Collection" button
5. **Expected Result:**
   - Loading spinner appears
   - Success message shows: "✅ Collection recorded successfully!"
   - Receipt ID is displayed
   - Form clears after 1.5 seconds
   - Loan data refreshes automatically

**Verification:**
- Check browser console for logs
- Verify no error messages appear
- Check database for new receipt:
  ```sql
  SELECT * FROM receipts ORDER BY captured_at DESC LIMIT 1;
  ```
- Verify installment status changed to "paid":
  ```sql
  SELECT id, status FROM installments WHERE id = '<installment_id>';
  ```

---

### Test 5: Submit Collection - Overdue Amount
**Objective:** Verify collection submission with overdue amount

**Steps:**
1. Search for a loan with overdue installments
2. Click "Overdue" quick button
3. Verify overdue amount is pre-filled
4. Click "Submit Record Collection" button
5. **Expected Result:**
   - Success message appears
   - Overdue installments are marked as paid
   - Journal entry is created

**Verification:**
- Check database for updated installments:
  ```sql
  SELECT id, status, collected_date FROM installments 
  WHERE loan_case_id = '<loan_id>' AND status = 'paid'
  ORDER BY collected_date DESC;
  ```

---

### Test 6: Submit Collection - Custom Amount
**Objective:** Verify collection submission with custom amount

**Steps:**
1. Select a loan
2. Manually enter a custom amount (e.g., 25000)
3. Add remarks (optional)
4. Click "Submit Record Collection" button
5. **Expected Result:**
   - Success message appears
   - Custom amount is recorded
   - Remarks are saved

**Verification:**
- Check database for receipt with custom amount:
  ```sql
  SELECT amount_paid FROM receipts ORDER BY captured_at DESC LIMIT 1;
  ```

---

### Test 7: Date Validation
**Objective:** Verify date validation works correctly

**Steps:**
1. Select a loan
2. Try to select a future date in the date picker
3. **Expected Result:**
   - Future dates are disabled (grayed out)
   - Cannot select future date
   - Only today and past dates are selectable

**Verification:**
- Attempt to select tomorrow's date
- Verify it's not selectable
- Confirm today's date is selected by default

---

### Test 8: Error Handling - Backend Down
**Objective:** Verify error handling when backend is unavailable

**Steps:**
1. Stop the backend server
2. Try to search for a customer
3. **Expected Result:**
   - Error message appears: "Search failed: ... Please check if the backend is running on port 5177"
   - No crash or blank page

**Verification:**
- Check browser console for error details
- Restart backend and verify search works again

---

### Test 9: Error Handling - Invalid Amount
**Objective:** Verify validation for invalid amounts

**Steps:**
1. Select a loan
2. Leave amount field empty
3. Try to submit
4. **Expected Result:**
   - Submit button is disabled
   - Error message: "Please enter a valid collection amount"

**Verification:**
- Try entering 0 or negative number
- Verify submit button remains disabled

---

### Test 10: Role-Based Access Control
**Objective:** Verify only authorized users can access collection entry

**Steps:**
1. Login as a user without collection access (e.g., regular user)
2. Navigate to Collection Entry page
3. **Expected Result:**
   - Access denied message appears
   - Form is not displayed
   - Message: "Only Admins and Collection Agents can access the Collection Entry Sheet"

**Verification:**
- Login as admin/collection officer
- Verify access is granted
- Check user role in database

---

## Console Log Verification

### Expected Logs for Successful Collection

```
🔍 Searching for: Amit Sharma
📊 Data loaded - Customers: 50 Loans: 100
✅ Valid data - Customers: 50 Loans: 100
🔍 No direct loan match, searching by customer details...
👥 Found matching customers: 1
🎯 Final matching loans: 2
🔄 Processing loan: 0802b316-b265-4b1e-9189-0c93dca6e6fc
📡 Fetching installments for loan: 0802b316-b265-4b1e-9189-0c93dca6e6fc
📡 Trying primary endpoint: /api/v1/Installments/loan/0802b316-b265-4b1e-9189-0c93dca6e6fc
✅ Primary endpoint success - Installments found: 12
📋 Loan summary created: {...}
🎉 Search completed - Total summaries: 2

📤 Submitting collection request: {...}
📋 Found installments: 12
⏳ Pending installments: 12
💳 Payments to record: 1
🔄 Recording payment for installment: 2ebcdcf2-1a5b-48df-a2e2-2cdbef24637c
💾 Recording payment: {...}
📤 Sending to backend: {InstallmentId: "...", AmountPaid: 458333, Mode: "Cash", UtrRef: ""}
📡 Trying primary endpoint: POST /api/Collection/collect
✅ Payment recorded successfully
```

---

## Database Verification Queries

### After Successful Collection Submission

```sql
-- 1. Verify Receipt was created
SELECT id, public_id, amount_paid, mode, captured_at 
FROM receipts 
ORDER BY captured_at DESC 
LIMIT 1;

-- 2. Verify Installment status updated
SELECT id, no, status, collected_amount, collected_date 
FROM installments 
WHERE id = '<installment_id>';

-- 3. Verify Journal Entry created
SELECT id, public_id, description, date 
FROM journal_entries 
ORDER BY date DESC 
LIMIT 1;

-- 4. Verify Journal Lines created
SELECT account_name, type, amount 
FROM journal_lines 
WHERE journal_entry_id = '<journal_entry_id>';

-- 5. Check all collections for a loan
SELECT r.public_id, r.amount_paid, r.mode, r.captured_at, i.no as installment_no
FROM receipts r
JOIN installments i ON r.installment_id = i.id
WHERE i.loan_case_id = '<loan_id>'
ORDER BY r.captured_at DESC;
```

---

## Troubleshooting

### Issue: "Search failed: 404 Not Found"
**Cause:** Backend API endpoint not found
**Solution:**
1. Verify backend is running on port 5177
2. Check backend logs for errors
3. Verify API endpoints are correctly configured

### Issue: "Redis connection error"
**Cause:** Redis server not running
**Solution:**
1. This is expected if Redis is not running
2. App should continue to work without Redis
3. Check backend console for "Redis not connected, skipping lock" message

### Issue: "Installment not found"
**Cause:** Invalid installment ID or database issue
**Solution:**
1. Verify installment exists in database
2. Check loan ID is correct
3. Ensure database connection is working

### Issue: "This installment is already fully paid"
**Cause:** Trying to collect an already paid installment
**Solution:**
1. Search for another loan with pending installments
2. Check installment status in database
3. Verify collection was recorded correctly

### Issue: "Partial payment rejected"
**Cause:** Amount is less than installment amount
**Solution:**
1. Enter full installment amount
2. Or use "Full Payment" button to pay all remaining
3. Check installment amount in database

---

## Performance Benchmarks

### Expected Response Times
- Search: < 2 seconds
- Loan selection: < 500ms
- Collection submission: < 3 seconds
- Data refresh: < 2 seconds

### If Times Exceed Benchmarks
1. Check database query performance
2. Verify network connectivity
3. Check backend server resources
4. Monitor Redis connection (if applicable)

---

## Sign-Off Checklist

- [ ] All 10 test scenarios pass
- [ ] No console errors appear
- [ ] Database records are created correctly
- [ ] Role-based access control works
- [ ] Error handling is appropriate
- [ ] Performance is acceptable
- [ ] UI displays correctly
- [ ] Amounts are calculated correctly
- [ ] Dates are validated properly
- [ ] Success messages appear

---

## Next Steps

1. **Automated Testing:** Create unit tests for collection service
2. **Integration Testing:** Test with real database
3. **Load Testing:** Test with multiple concurrent submissions
4. **Security Testing:** Verify authorization and data validation
5. **Performance Optimization:** Monitor and optimize slow queries
