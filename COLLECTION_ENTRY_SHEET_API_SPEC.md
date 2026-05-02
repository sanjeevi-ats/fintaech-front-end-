# Collection Entry Sheet - Backend API Specification

## Overview
This document specifies the backend API endpoints required for the Collection Entry Sheet functionality. The Collection Entry Sheet allows authorized users (Admin and Collection Officers) to search for customers/loans and record collection payments.

## Required API Endpoints

### 1. Search Loan by Customer/ID
**Endpoint:** `GET /api/v1/Collection/search`
**Parameters:** 
- `search` (query parameter): Customer name, phone number, customer ID, or loan ID

**Response:**
```json
[
  {
    "loanId": "string",
    "customerId": "string", 
    "customerName": "string",
    "totalLoanAmount": 0,
    "totalReceivable": 0,
    "totalInstallments": 0,
    "paidInstallments": 0,
    "pendingInstallments": 0,
    "lastPaidDate": "2024-01-15T00:00:00Z",
    "nextDueAmount": 0,
    "nextDueDate": "2024-02-15T00:00:00Z",
    "installments": [
      {
        "id": "string",
        "loanCaseId": "string",
        "branchId": "string",
        "no": 1,
        "dueDate": "2024-02-15T00:00:00Z",
        "amount": 0,
        "status": "pending",
        "collectedAmount": 0,
        "collectedDate": "2024-01-15T00:00:00Z",
        "collectedBy": "string"
      }
    ]
  }
]
```

### 2. Get Loan Installment Summary
**Endpoint:** `GET /api/v1/Collection/loan/{loanId}/summary`
**Parameters:**
- `loanId` (path parameter): The loan ID

**Response:**
```json
{
  "loanId": "string",
  "customerId": "string",
  "customerName": "string", 
  "totalLoanAmount": 0,
  "totalReceivable": 0,
  "totalInstallments": 0,
  "paidInstallments": 0,
  "pendingInstallments": 0,
  "lastPaidDate": "2024-01-15T00:00:00Z",
  "nextDueAmount": 0,
  "nextDueDate": "2024-02-15T00:00:00Z",
  "installments": []
}
```

### 3. Submit Collection Entry
**Endpoint:** `POST /api/v1/Collection/entry`
**Request Body:**
```json
{
  "loanId": "string",
  "customerId": "string",
  "amount": 0,
  "remarks": "string",
  "collectionDate": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Collection recorded successfully",
  "receiptId": "RCP-20240115-001"
}
```

## Implementation Notes

### Database Schema Requirements

#### Collections Table
```sql
CREATE TABLE Collections (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    LoanId UNIQUEIDENTIFIER NOT NULL,
    CustomerId UNIQUEIDENTIFIER NOT NULL,
    Amount BIGINT NOT NULL, -- Amount in paise
    CollectionDate DATE NOT NULL,
    Remarks NVARCHAR(500),
    CollectedBy NVARCHAR(100),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (LoanId) REFERENCES LoanCases(Id),
    FOREIGN KEY (CustomerId) REFERENCES Customers(Id)
);
```

#### Installments Table Updates
```sql
-- Add collection tracking columns if not exists
ALTER TABLE Installments ADD CollectedAmount BIGINT DEFAULT 0;
ALTER TABLE Installments ADD CollectedDate DATETIME2 NULL;
ALTER TABLE Installments ADD CollectedBy NVARCHAR(100) NULL;
ALTER TABLE Installments ADD Status NVARCHAR(20) DEFAULT 'pending';
```

### Controller Implementation

#### CollectionController.cs
```csharp
[ApiController]
[Route("api/v1/[controller]")]
public class CollectionController : ControllerBase
{
    private readonly ICollectionService _collectionService;
    
    public CollectionController(ICollectionService collectionService)
    {
        _collectionService = collectionService;
    }
    
    [HttpGet("search")]
    public async Task<ActionResult<List<LoanInstallmentSummary>>> SearchLoanByCustomer([FromQuery] string search)
    {
        try
        {
            var results = await _collectionService.SearchLoanByCustomerAsync(search);
            return Ok(results);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    
    [HttpGet("loan/{loanId}/summary")]
    public async Task<ActionResult<LoanInstallmentSummary>> GetLoanSummary(Guid loanId)
    {
        try
        {
            var summary = await _collectionService.GetLoanInstallmentSummaryAsync(loanId);
            if (summary == null)
                return NotFound(new { message = "Loan not found" });
                
            return Ok(summary);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    
    [HttpPost("entry")]
    public async Task<ActionResult<CollectionEntryResponse>> SubmitCollectionEntry([FromBody] CollectionEntryRequest request)
    {
        try
        {
            // Validate request
            if (request.Amount <= 0)
                return BadRequest(new { message = "Amount must be greater than 0" });
                
            if (request.CollectionDate > DateTime.Today)
                return BadRequest(new { message = "Future dates are not allowed" });
            
            var result = await _collectionService.SubmitCollectionEntryAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
```

### Service Implementation

#### ICollectionService.cs
```csharp
public interface ICollectionService
{
    Task<List<LoanInstallmentSummary>> SearchLoanByCustomerAsync(string searchTerm);
    Task<LoanInstallmentSummary> GetLoanInstallmentSummaryAsync(Guid loanId);
    Task<CollectionEntryResponse> SubmitCollectionEntryAsync(CollectionEntryRequest request);
}
```

#### CollectionService.cs
```csharp
public class CollectionService : ICollectionService
{
    private readonly ApplicationDbContext _context;
    
    public CollectionService(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<List<LoanInstallmentSummary>> SearchLoanByCustomerAsync(string searchTerm)
    {
        var query = from loan in _context.LoanCases
                   join customer in _context.Customers on loan.CustomerId equals customer.Id
                   where customer.Name.Contains(searchTerm) ||
                         customer.Phone.Contains(searchTerm) ||
                         customer.Id.ToString().Contains(searchTerm) ||
                         loan.Id.ToString().Contains(searchTerm)
                   select new { loan, customer };
        
        var results = await query.ToListAsync();
        var summaries = new List<LoanInstallmentSummary>();
        
        foreach (var item in results)
        {
            var installments = await _context.Installments
                .Where(i => i.LoanCaseId == item.loan.Id)
                .OrderBy(i => i.No)
                .ToListAsync();
            
            var paidCount = installments.Count(i => i.Status == "paid");
            var pendingCount = installments.Count(i => i.Status != "paid");
            var nextDue = installments.FirstOrDefault(i => i.Status == "pending");
            var lastPaid = installments
                .Where(i => i.Status == "paid")
                .OrderByDescending(i => i.CollectedDate)
                .FirstOrDefault();
            
            summaries.Add(new LoanInstallmentSummary
            {
                LoanId = item.loan.Id.ToString(),
                CustomerId = item.customer.Id.ToString(),
                CustomerName = item.customer.Name,
                TotalLoanAmount = item.loan.Principal,
                TotalReceivable = item.loan.TotalReceivable,
                TotalInstallments = installments.Count,
                PaidInstallments = paidCount,
                PendingInstallments = pendingCount,
                LastPaidDate = lastPaid?.CollectedDate,
                NextDueAmount = nextDue?.Amount ?? 0,
                NextDueDate = nextDue?.DueDate,
                Installments = installments.Select(MapInstallment).ToList()
            });
        }
        
        return summaries;
    }
    
    public async Task<CollectionEntryResponse> SubmitCollectionEntryAsync(CollectionEntryRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            // Create collection record
            var collection = new Collection
            {
                Id = Guid.NewGuid(),
                LoanId = Guid.Parse(request.LoanId),
                CustomerId = Guid.Parse(request.CustomerId),
                Amount = request.Amount,
                CollectionDate = DateTime.Parse(request.CollectionDate),
                Remarks = request.Remarks,
                CollectedBy = GetCurrentUser(), // Implement this method
                CreatedAt = DateTime.UtcNow
            };
            
            _context.Collections.Add(collection);
            
            // Update installment status
            var pendingInstallments = await _context.Installments
                .Where(i => i.LoanCaseId == collection.LoanId && i.Status == "pending")
                .OrderBy(i => i.No)
                .ToListAsync();
            
            long remainingAmount = request.Amount;
            
            foreach (var installment in pendingInstallments)
            {
                if (remainingAmount <= 0) break;
                
                long installmentDue = installment.Amount - (installment.CollectedAmount ?? 0);
                long paymentForThis = Math.Min(remainingAmount, installmentDue);
                
                installment.CollectedAmount = (installment.CollectedAmount ?? 0) + paymentForThis;
                installment.CollectedDate = collection.CollectionDate;
                installment.CollectedBy = collection.CollectedBy;
                
                if (installment.CollectedAmount >= installment.Amount)
                {
                    installment.Status = "paid";
                }
                else if (installment.CollectedAmount > 0)
                {
                    installment.Status = "partially_paid";
                }
                
                remainingAmount -= paymentForThis;
            }
            
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            return new CollectionEntryResponse
            {
                Success = true,
                Message = "Collection recorded successfully",
                ReceiptId = $"RCP-{DateTime.Now:yyyyMMdd}-{collection.Id.ToString()[..8]}"
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            throw new Exception($"Failed to record collection: {ex.Message}");
        }
    }
    
    private string GetCurrentUser()
    {
        // Implement user context retrieval
        return "System"; // Placeholder
    }
    
    private Installment MapInstallment(Installments dbInstallment)
    {
        return new Installment
        {
            Id = dbInstallment.Id.ToString(),
            LoanCaseId = dbInstallment.LoanCaseId.ToString(),
            BranchId = dbInstallment.BranchId?.ToString(),
            No = dbInstallment.No,
            DueDate = dbInstallment.DueDate.ToString("yyyy-MM-dd"),
            Amount = dbInstallment.Amount,
            Status = dbInstallment.Status,
            CollectedAmount = dbInstallment.CollectedAmount,
            CollectedDate = dbInstallment.CollectedDate?.ToString("yyyy-MM-dd"),
            CollectedBy = dbInstallment.CollectedBy
        };
    }
}
```

### Model Classes

#### LoanInstallmentSummary.cs
```csharp
public class LoanInstallmentSummary
{
    public string LoanId { get; set; }
    public string CustomerId { get; set; }
    public string CustomerName { get; set; }
    public long TotalLoanAmount { get; set; }
    public long TotalReceivable { get; set; }
    public int TotalInstallments { get; set; }
    public int PaidInstallments { get; set; }
    public int PendingInstallments { get; set; }
    public DateTime? LastPaidDate { get; set; }
    public long NextDueAmount { get; set; }
    public DateTime? NextDueDate { get; set; }
    public List<Installment> Installments { get; set; } = new();
}
```

#### CollectionEntryRequest.cs
```csharp
public class CollectionEntryRequest
{
    public string LoanId { get; set; }
    public string CustomerId { get; set; }
    public long Amount { get; set; } // Amount in paise
    public string Remarks { get; set; }
    public string CollectionDate { get; set; }
}
```

#### CollectionEntryResponse.cs
```csharp
public class CollectionEntryResponse
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public string ReceiptId { get; set; }
}
```

## Security & Validation

### Role-Based Access Control
- Only users with roles `super_admin` and `collection_officer` can access these endpoints
- Implement `[Authorize]` attributes with role checks

### Input Validation
- Amount must be greater than 0
- Collection date cannot be in the future
- Loan ID and Customer ID must be valid GUIDs
- Search term must not be empty

### Error Handling
- Return appropriate HTTP status codes
- Provide clear error messages
- Log all errors for debugging

## Testing Endpoints

### Test Data Setup
```sql
-- Insert test customer
INSERT INTO Customers (Id, Name, Phone, Email) 
VALUES (NEWID(), 'Test Customer', '9876543210', 'test@example.com');

-- Insert test loan
INSERT INTO LoanCases (Id, CustomerId, Principal, TotalReceivable, Status)
VALUES (NEWID(), @CustomerId, 100000, 120000, 'active');

-- Insert test installments
INSERT INTO Installments (Id, LoanCaseId, No, DueDate, Amount, Status)
VALUES 
(NEWID(), @LoanId, 1, '2024-01-15', 10000, 'paid'),
(NEWID(), @LoanId, 2, '2024-02-15', 10000, 'pending'),
(NEWID(), @LoanId, 3, '2024-03-15', 10000, 'pending');
```

### API Testing Commands
```bash
# Search for customer
curl -X GET "http://localhost:5177/api/v1/Collection/search?search=Test Customer" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get loan summary  
curl -X GET "http://localhost:5177/api/v1/Collection/loan/{loanId}/summary" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Submit collection
curl -X POST "http://localhost:5177/api/v1/Collection/entry" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "loanId": "loan-id-here",
    "customerId": "customer-id-here", 
    "amount": 10000,
    "remarks": "Monthly payment",
    "collectionDate": "2024-01-15"
  }'
```

## Redis Connection Fix

If encountering Redis connection errors, update the connection configuration:

```csharp
// In Program.cs or Startup.cs
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = ConfigurationOptions.Parse("localhost:6379");
    configuration.AbortOnConnectFail = false; // This is the key fix
    return ConnectionMultiplexer.Connect(configuration);
});
```

## Deployment Checklist

- [ ] All API endpoints implemented
- [ ] Database schema updated
- [ ] Role-based authorization configured
- [ ] Input validation implemented
- [ ] Error handling added
- [ ] Redis connection fixed
- [ ] API endpoints tested
- [ ] Frontend integration verified
- [ ] Documentation updated

## Frontend Integration Status

✅ **COMPLETED:**
- Collection Entry Sheet page (`/collection-entry`)
- Search functionality with fallback mechanisms
- Loan details display with installment summary
- Collection form with validation
- Role-based access control
- Date validation (no future dates)
- Error handling and success messages
- Sidebar navigation updated

The frontend is fully implemented and ready for backend integration. Once the backend APIs are implemented according to this specification, the Collection Entry Sheet will be fully functional.