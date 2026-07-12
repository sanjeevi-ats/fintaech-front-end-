import { apiClient } from './apiClient';

export interface Installment {
  id: string;
  loanCaseId: string;
  branchId: string;
  no: number;
  dueDate: string;
  amount: number; // In Paise
  status: 'pending' | 'partially_paid' | 'paid';
  collectedAmount?: number; // In Paise
  collectedDate?: string;
  collectedBy?: string;
}

export interface CollectionUpdateRequest {
  installmentId: string;
  loanCaseId: string;
  customerId?: string;
  collectionAmount: number; // In Paise
  collectionDate: string;
  mode: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  utrRef?: string;
  remarks?: string;
  collectedBy?: string;
  userRole?: string;
}

export interface CollectionUpdateResponse {
  success: boolean;
  message: string;
  updatedInstallment?: Installment;
  auditId?: string;
}

export interface CollectionValidationResponse {
  allowed: boolean;
  reason?: string;
}

export interface CollectionEntryRequest {
  loanId: string;
  customerId: string;
  amount: number; // In Paise
  remarks?: string;
  collectionDate: string;
  paymentMode?: string;
  utrRef?: string;
}

export interface LoanInstallmentSummary {
  loanId: string;
  loanCode?: string;
  customerId: string;
  customerCode?: string;
  customerName: string;
  totalLoanAmount: number;
  totalReceivable: number;
  totalInstallments: number;
  paidInstallments: number;
  pendingInstallments: number;
  lastPaidDate?: string;
  nextDueAmount: number;
  nextDueDate?: string;
  installments: Installment[];
  paymentHistory?: PaymentHistoryItem[];
  // New fields for enhanced display
  totalPaidAmount: number;
  totalRemainingAmount: number;
  currentMonthDue: number;
  overdueAmount: number;
  overdueInstallments: number;
}

export interface PaymentHistoryItem {
  installmentNo: number;
  paidDate: string;
  paidAmount: number;
  collectedBy: string;
}

export interface CollectionRequestDto {
  id: string;
  requestNumber: string;
  installmentId: string;
  installmentCode?: string;
  installmentNo: number;
  loanCaseId: string;
  loanCode?: string;
  customerName: string;
  amount: number;
  paymentMode: string;
  utrRef: string;
  remarks: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  requestedById: string;
  requestedByName: string;
  requestedAt: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  previousDueAmount: number;
  newDueAmount: number;
}

export const collectionService = {
  getDue: (from: string, to: string) => {
    const params = new URLSearchParams();
    params.append('from', from);
    params.append('to', to);
    return apiClient.get<Installment[]>(`/api/v1/Installments/due?${params.toString()}`);
  },
  
  recordPayment: async (data: { installmentId: string; amountPaid: number; mode: string; utrRef?: string; remarks?: string }) => {
    console.log('💾 Recording payment:', data);
    
    // Convert to backend format (PascalCase)
    const backendData = {
      InstallmentId: data.installmentId,
      AmountPaid: data.amountPaid,
      Mode: data.mode,
      UtrRef: data.utrRef || ''
    };
    
    console.log('📤 Sending to backend:', backendData);
    
    try {
      // Try primary endpoint first (correct endpoint without /v1/)
      console.log('📡 Trying primary endpoint: POST /api/Collection/collect');
      return await apiClient.post<void>('/api/Collection/collect', backendData);
    } catch (primaryError: any) {
      console.warn('⚠️ Primary endpoint failed, trying sync endpoint:', primaryError.message);
      
      try {
        // Try sync endpoint - expects array of OfflineCollection objects
        const syncData = [{
          LocalId: `local-${Date.now()}`,
          InstallmentId: data.installmentId,
          AmountPaid: data.amountPaid,
          Mode: data.mode,
          UTRRef: data.utrRef || ''
        }];
        console.log('📡 Trying sync endpoint: POST /api/Collection/sync');
        console.log('📤 Sync data:', syncData);
        return await apiClient.post<void>('/api/Collection/sync', syncData);
      } catch (syncError: any) {
        console.error('❌ Both endpoints failed');
        console.error('Primary error:', primaryError);
        console.error('Sync error:', syncError);
        throw new Error('Failed to record payment. Please check backend API endpoints.');
      }
    }
  },
    
  getOverdue: () => apiClient.get<any[]>('/api/v1/Recovery/overdue'),
  
  // Alternative endpoint for daily collection if the above fails
  getDailyCollection: (date: string) => 
    apiClient.get<Installment[]>(`/api/v1/DailyCollection/${date}`),

  // Daily Collection Update API endpoints
  validateCollectionUpdate: (date: string, userRole: string) =>
    apiClient.post<CollectionValidationResponse>('/api/v1/Collection/validate-update', {
      date,
      userRole
    }),

  updateDailyCollection: (request: CollectionUpdateRequest) =>
    apiClient.post<CollectionUpdateResponse>('/api/v1/Collection/update-daily', request),

  getCollectionsByDate: (date: string, branchId?: string) => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Installment[]>(`/api/v1/Collection/by-date/${date}${query}`);
  },

  getCollectionHistory: (installmentId: string) =>
    apiClient.get<any[]>(`/api/v1/Collection/history/${installmentId}`),

  // Collection Entry Sheet - Search by Customer Code, Customer Name, Phone, or Loan Code
  searchLoanByCustomer: async (searchTerm: string): Promise<LoanInstallmentSummary[]> => {
    try {
      console.log('🔍 Searching for:', searchTerm);
      
      const searchQuery = searchTerm.trim();
      
      // STEP 1: Check if it's a Loan Code search first (e.g. LN-2024-001)
      // by fetching all loans and checking loanCode
      const [customerResults, loans] = await Promise.all([
        apiClient.get<any[]>(`/api/v1/Customers/search?q=${encodeURIComponent(searchQuery)}`),
        apiClient.get<any[]>('/api/v1/LoanCases')
      ]);

      console.log('📊 Data loaded - Matched Customers:', customerResults.length, 'Loans:', loans.length);

      const validLoans = loans.filter(l => l && l.id);

      // Enhanced search logic
      let matchingLoans: any[] = [];
      let matchedCustomers = customerResults;

      // STEP 1: Check for direct Loan Code match (e.g. LN-2024-001)
      const loanCodeMatches = validLoans.filter(loan =>
        loan.loanCode?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (loanCodeMatches.length > 0) {
        console.log('🎯 Direct Loan Code match found:', loanCodeMatches.length);
        matchingLoans = loanCodeMatches;
      } else if (matchedCustomers.length > 0) {
        // STEP 2: Use server-side matched customers to find their loans
        console.log('👥 Found matching customers from server search:', matchedCustomers.length);
        matchingLoans = validLoans.filter(loan =>
          matchedCustomers.some((c: any) => c.id === loan.customerId)
        );
      }

      console.log('🎯 Final matching loans:', matchingLoans.length);

      // Build loan summaries with installment data
      const summaries: LoanInstallmentSummary[] = [];
      
      for (const loan of matchingLoans) {
        console.log('🔄 Processing loan:', loan.id);
        
        // Find customer - prefer from matchedCustomers (has phone), fallback to validLoans lookup
        const customer = matchedCustomers.find((c: any) => c.id === loan.customerId) ||
          { id: loan.customerId, name: loan.customerName, code: loan.customerCode };
        
        // Get installments for this specific loan
        let installments: Installment[] = [];
        try {
          installments = await apiClient.get<Installment[]>(`/api/v1/Installments/loan/${loan.id}`);
          if (!Array.isArray(installments)) installments = [];
        } catch (instErr) {
          console.warn('⚠️ Installments endpoint failed, trying fallback:', instErr);
          try {
            const params = new URLSearchParams();
            params.append('loanId', loan.id);
            installments = await apiClient.get<Installment[]>(`/api/v1/Installments/due?${params.toString()}`);
            if (!Array.isArray(installments)) installments = [];
          } catch {
            installments = [];
          }
        }

        // Calculate installment statistics
        const validInstallments = installments;
        const paidInstallments = validInstallments.filter(i => i.status === 'paid').length;
        const pendingInstallments = validInstallments.filter(i => i.status !== 'paid').length;
        const nextDueInstallment = validInstallments.find(i => i.status === 'pending');
        const lastPaidInstallment = validInstallments
          .filter(i => i.status === 'paid')
          .sort((a, b) => new Date(b.collectedDate || '').getTime() - new Date(a.collectedDate || '').getTime())[0];

        const totalPaidAmount = validInstallments
          .filter(i => i.status === 'paid')
          .reduce((sum, i) => sum + (i.collectedAmount || i.amount), 0);
        
        const totalRemainingAmount = validInstallments
          .filter(i => i.status !== 'paid')
          .reduce((sum, i) => sum + i.amount, 0);

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const currentMonthDue = validInstallments
          .filter(i => {
            const dueDate = new Date(i.dueDate);
            return dueDate.getMonth() === currentMonth && 
                   dueDate.getFullYear() === currentYear &&
                   i.status !== 'paid';
          })
          .reduce((sum, i) => sum + i.amount, 0);

        const overdueInstallmentList = validInstallments.filter(i => {
          if (i.status === 'paid') return false;
          return new Date(i.dueDate) < currentDate;
        });
        const overdueAmount = overdueInstallmentList.reduce((sum, i) => sum + i.amount, 0);

        summaries.push({
          loanId: loan.id,
          loanCode: loan.loanCode,
          customerId: loan.customerId,
          customerCode: customer?.code || customer?.customerCode || '',
          customerName: customer?.name || 'Unknown Customer',
          totalLoanAmount: loan.principal || 0,
          totalReceivable: loan.totalReceivable || loan.principal || 0,
          totalInstallments: validInstallments.length,
          paidInstallments,
          pendingInstallments,
          lastPaidDate: lastPaidInstallment?.collectedDate || undefined,
          nextDueAmount: nextDueInstallment?.amount || 0,
          nextDueDate: nextDueInstallment?.dueDate,
          installments: validInstallments,
          totalPaidAmount,
          totalRemainingAmount,
          currentMonthDue,
          overdueAmount,
          overdueInstallments: overdueInstallmentList.length
        });
      }

      console.log('🎉 Search completed - Total summaries:', summaries.length);
      return summaries;
    } catch (error) {
      console.error('❌ Search failed:', error);
      throw error;
    }
  },

  // Get installments for a specific loan - Enhanced with better error handling
  getInstallmentsByLoan: async (loanId: string): Promise<Installment[]> => {
    console.log('🔍 Fetching installments for loan ID:', loanId);
    
    if (!loanId || loanId.trim() === '') {
      throw new Error('Loan ID is required');
    }

    try {
      // Try primary endpoint first
      console.log('📡 Trying primary endpoint: /api/v1/Installments/loan/' + loanId);
      const installments = await apiClient.get<Installment[]>(`/api/v1/Installments/loan/${loanId}`);
      console.log('✅ Primary endpoint success - Found installments:', installments.length);
      return installments;
    } catch (primaryError) {
      console.warn('⚠️ Primary endpoint failed:', primaryError);
      
      try {
        // Try fallback endpoint
        console.log('📡 Trying fallback endpoint: /api/v1/Installments/due?loanId=' + loanId);
        const params = new URLSearchParams();
        params.append('loanId', loanId);
        const installments = await apiClient.get<Installment[]>(`/api/v1/Installments/due?${params.toString()}`);
        console.log('✅ Fallback endpoint success - Found installments:', installments.length);
        return installments;
      } catch (fallbackError) {
        console.error('❌ Both endpoints failed for loan:', loanId);
        console.error('Primary error:', primaryError);
        console.error('Fallback error:', fallbackError);
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error occurred';
        throw new Error(`Failed to fetch installments for loan ${loanId}: ${errorMessage}`);
      }
    }
  },

  // Get due installments with loan filter
  getDueInstallmentsByLoan: (loanId: string) => {
    const params = new URLSearchParams();
    params.append('loanId', loanId);
    return apiClient.get<Installment[]>(`/api/v1/Installments/due?${params.toString()}`);
  },



  submitCollectionEntry: async (request: CollectionEntryRequest) => {
    try {
      console.log('📝 Submitting collection entry:', request);
      
      // Get installments for this loan
      const installments = await collectionService.getInstallmentsByLoan(request.loanId);
      console.log('📋 Found installments:', installments.length);
      
      const pendingInstallments = installments
        .filter(inst => inst.status === 'pending')
        .sort((a, b) => a.no - b.no);
      
      if (pendingInstallments.length === 0) {
        throw new Error('No pending installments found for this loan');
      }

      console.log('⏳ Pending installments:', pendingInstallments.length);

      // Apply payment to installments in order
      let remainingAmount = request.amount;
      const paymentsToRecord = [];
      
      for (const installment of pendingInstallments) {
        if (remainingAmount <= 0) break;
        
        const paymentAmount = Math.min(remainingAmount, installment.amount);
        paymentsToRecord.push({
          installmentId: installment.id,
          amountPaid: paymentAmount,
          mode: request.paymentMode || 'Cash',
          utrRef: request.utrRef || '',
          remarks: request.remarks
        });
        
        remainingAmount -= paymentAmount;
      }

      console.log('💳 Payments to record:', paymentsToRecord.length);

      // Record all payments
      let successCount = 0;
      let failureCount = 0;
      
      for (const payment of paymentsToRecord) {
        try {
          console.log('🔄 Recording payment for installment:', payment.installmentId);
          await collectionService.recordPayment(payment);
          successCount++;
          console.log('✅ Payment recorded successfully');
        } catch (paymentError: any) {
          console.error('❌ Failed to record payment:', paymentError);
          failureCount++;
        }
      }

      if (successCount === 0 && failureCount > 0) {
        throw new Error('Failed to record any payments. Please check the backend API.');
      }

      return {
        success: true,
        message: `Collection recorded successfully! (${successCount} payment(s) recorded)`,
        receiptId: `RCP-${Date.now()}`,
        paymentsRecorded: successCount,
        paymentsFailed: failureCount
      };
    } catch (error: any) {
      console.error('❌ Collection submission error:', error);
      throw new Error(error.message || 'Failed to record collection');
    }
  },

  // Collection Request (Approval Workflow) Methods
  submitCollectionRequest: async (data: { installmentId: string; amountPaid: number; mode: string; utrRef?: string; remarks?: string }) => {
    console.log('📝 Submitting collection request for approval:', data);
    
    const backendData = {
      InstallmentId: data.installmentId,
      AmountPaid: data.amountPaid,
      Mode: data.mode || 'cash',
      UtrRef: data.utrRef || '',
      Remarks: data.remarks || ''
    };
    
    return apiClient.post<CollectionRequestDto>('/api/v1/CollectionRequests', backendData);
  },

  getPendingCollectionRequests: async (status?: string) => {
    const url = status 
      ? `/api/v1/CollectionRequests?status=${status}`
      : '/api/v1/CollectionRequests?status=Pending';
    
    console.log('📋 Fetching pending collection requests...');
    return apiClient.get<{ success: boolean; data: CollectionRequestDto[] }>(url);
  },

  getCollectionRequest: async (requestId: string) => {
    console.log('🔍 Fetching collection request:', requestId);
    return apiClient.get<{ success: boolean; data: CollectionRequestDto }>(`/api/v1/CollectionRequests/${requestId}`);
  },

  approveCollectionRequest: async (requestId: string) => {
    console.log('✅ Approving collection request:', requestId);
    return apiClient.post<{ success: boolean; message: string; data: CollectionRequestDto }>(
      `/api/v1/CollectionRequests/${requestId}/approve`,
      {}
    );
  },

  rejectCollectionRequest: async (requestId: string) => {
    console.log('❌ Rejecting collection request:', requestId);
    return apiClient.post<{ success: boolean; message: string; data: CollectionRequestDto }>(
      `/api/v1/CollectionRequests/${requestId}/reject`,
      {}
    );
  },

  cancelCollectionRequest: async (requestId: string) => {
    console.log('⏹️ Cancelling collection request:', requestId);
    return apiClient.post<{ success: boolean; message: string; data: CollectionRequestDto }>(
      `/api/v1/CollectionRequests/${requestId}/cancel`,
      {}
    );
  },

};
