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
}

export interface LoanInstallmentSummary {
  loanId: string;
  customerId: string;
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

  // Collection Entry Sheet - Search by Customer Name, Customer ID, or Loan ID
  searchLoanByCustomer: async (searchTerm: string): Promise<LoanInstallmentSummary[]> => {
    try {
      console.log('🔍 Searching for:', searchTerm);
      
      const searchQuery = searchTerm.trim().toLowerCase();
      
      // Get all customers and loans first
      const [customers, loans] = await Promise.all([
        apiClient.get<any[]>('/api/v1/Customers'),
        apiClient.get<any[]>('/api/v1/LoanCases')
      ]);

      console.log('📊 Data loaded - Customers:', customers.length, 'Loans:', loans.length);

      // Validate data
      if (!Array.isArray(customers) || !Array.isArray(loans)) {
        throw new Error('Invalid data received from API');
      }

      // Filter out invalid customer/loan objects
      const validCustomers = customers.filter(c => c && c.id);
      const validLoans = loans.filter(l => l && l.id);

      console.log('✅ Valid data - Customers:', validCustomers.length, 'Loans:', validLoans.length);

      // Enhanced search logic to handle direct Loan ID searches properly
      let matchingLoans: any[] = [];

      // STEP 1: Check for direct Loan ID match first (highest priority)
      const directLoanMatches = validLoans.filter(loan => 
        loan.id?.toLowerCase().includes(searchQuery) ||
        loan.id?.toLowerCase() === searchQuery
      );

      if (directLoanMatches.length > 0) {
        console.log('🎯 Direct Loan ID match found:', directLoanMatches.length);
        matchingLoans = directLoanMatches;
      } else {
        // STEP 2: If no direct loan match, search by customer details
        console.log('🔍 No direct loan match, searching by customer details...');
        
        const matchingCustomers = validCustomers.filter(customer => {
          // Safely check each property with null/undefined checks
          const nameMatch = customer.name?.toLowerCase().includes(searchQuery) || false;
          const phoneMatch = customer.phone?.includes(searchQuery) || false;
          const idMatch = customer.id?.toLowerCase().includes(searchQuery) || false;
          const exactIdMatch = customer.id?.toLowerCase() === searchQuery || false;
          
          return nameMatch || phoneMatch || idMatch || exactIdMatch;
        });

        console.log('👥 Found matching customers:', matchingCustomers.length);

        // Find loans belonging to matching customers
        matchingLoans = validLoans.filter(loan => 
          matchingCustomers.some(customer => customer.id === loan.customerId)
        );
      }

      console.log('🎯 Final matching loans:', matchingLoans.length);

      // Build loan summaries with installment data
      const summaries: LoanInstallmentSummary[] = [];
      
      for (const loan of matchingLoans) {
        console.log('🔄 Processing loan:', loan.id);
        
        const customer = validCustomers.find(c => c.id === loan.customerId);
        
        // Get installments for this specific loan using the correct API endpoints
        let installments: Installment[] = [];
        try {
          console.log('📡 Fetching installments for loan:', loan.id);
          
          // Try primary endpoint first: /api/v1/Installments/loan/{loanId}
          console.log('📡 Trying primary endpoint: /api/v1/Installments/loan/' + loan.id);
          installments = await apiClient.get<Installment[]>(`/api/v1/Installments/loan/${loan.id}`);
          console.log('✅ Primary endpoint success - Installments found:', installments.length);
          
          // Validate installments data
          if (!Array.isArray(installments)) {
            console.warn('⚠️ Primary endpoint returned non-array data, converting...');
            installments = [];
          }
        } catch (instErr) {
          console.warn('⚠️ Primary installments endpoint failed, trying due endpoint:', instErr);
          try {
            // Fallback to due installments with loan filter: /api/v1/Installments/due?loanId={loanId}
            console.log('📡 Trying fallback endpoint: /api/v1/Installments/due?loanId=' + loan.id);
            const params = new URLSearchParams();
            params.append('loanId', loan.id);
            installments = await apiClient.get<Installment[]>(`/api/v1/Installments/due?${params.toString()}`);
            console.log('✅ Fallback endpoint success - Installments found:', installments.length);
            
            // Validate installments data
            if (!Array.isArray(installments)) {
              console.warn('⚠️ Fallback endpoint returned non-array data, converting...');
              installments = [];
            }
          } catch (dueErr) {
            console.error('❌ Both installment endpoints failed for loan:', loan.id);
            console.error('Primary error:', instErr);
            console.error('Fallback error:', dueErr);
            installments = [];
          }
        }

        // Calculate installment statistics with proper validation
        const validInstallments = Array.isArray(installments) ? installments : [];
        const paidInstallments = validInstallments.filter(inst => inst.status === 'paid').length;
        const pendingInstallments = validInstallments.filter(inst => inst.status !== 'paid').length;
        const nextDueInstallment = validInstallments.find(inst => inst.status === 'pending');
        const lastPaidInstallment = validInstallments
          .filter(inst => inst.status === 'paid')
          .sort((a, b) => new Date(b.collectedDate || '').getTime() - new Date(a.collectedDate || '').getTime())[0];

        // Calculate financial details
        const totalPaidAmount = validInstallments
          .filter(inst => inst.status === 'paid')
          .reduce((sum, inst) => sum + (inst.collectedAmount || inst.amount), 0);
        
        const totalRemainingAmount = validInstallments
          .filter(inst => inst.status !== 'paid')
          .reduce((sum, inst) => sum + inst.amount, 0);

        // Calculate current month due (installments due this month)
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const currentMonthDue = validInstallments
          .filter(inst => {
            const dueDate = new Date(inst.dueDate);
            return dueDate.getMonth() === currentMonth && 
                   dueDate.getFullYear() === currentYear &&
                   inst.status !== 'paid';
          })
          .reduce((sum, inst) => sum + inst.amount, 0);

        // Calculate overdue amount (past due date and not paid)
        const overdueInstallments = validInstallments.filter(inst => {
          if (inst.status === 'paid') return false;
          const dueDate = new Date(inst.dueDate);
          return dueDate < currentDate;
        });
        
        const overdueAmount = overdueInstallments.reduce((sum, inst) => sum + inst.amount, 0);

        const summary = {
          loanId: loan.id,
          customerId: loan.customerId,
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
          // New enhanced fields
          totalPaidAmount,
          totalRemainingAmount,
          currentMonthDue,
          overdueAmount,
          overdueInstallments: overdueInstallments.length
        };

        console.log('📋 Loan summary created:', {
          loanId: summary.loanId,
          customerName: summary.customerName,
          totalInstallments: summary.totalInstallments,
          paidInstallments: summary.paidInstallments,
          pendingInstallments: summary.pendingInstallments
        });

        summaries.push(summary);
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
          mode: 'Cash',
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


};
