import { apiClient } from './apiClient';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(endpoint, options);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Types for Multi-Currency Support
export interface ExchangeRateSnapshot {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  source: string;
  effective_date: string;
  created_at: string;
  is_active: boolean;
}

export interface RateCalculationHistory {
  id: string;
  conversion_date: string;
  from_currency: string;
  to_currency: string;
  source_amount: number;
  target_amount: number;
  rate_used: number;
  source: string;
  loan_id?: string;
  receipt_id?: string;
}

export interface CurrencyLoanBreakdown {
  currency: string;
  principal: number;
  outstanding: number;
  total_interest: number;
  interest_rate: number;
  exchange_rate: number;
}

export interface CurrencyEquivalentReport {
  loan_id: string;
  loan_code: string;
  report_date: string;
  base_currency: string;
  base_principal: number;
  equivalents_in_currencies: CurrencyAmountPair[];
  rates_used: ExchangeRateUsed[];
}

export interface CurrencyAmountPair {
  currency: string;
  amount: number;
  rate: number;
}

export interface ExchangeRateUsed {
  from_currency: string;
  to_currency: string;
  rate: number;
  rate_date: string;
}

export interface PortfolioMultiCurrencySummary {
  branch_id: string;
  branch_code: string;
  summary_date: string;
  total_loans: number;
  total_principal_by_currency: Record<string, number>;
  total_outstanding_by_currency: Record<string, number>;
  loan_count_by_currency: Record<string, number>;
  primary_currency: string;
  total_portfolio_value: number;
  concentration_by_currency: Record<string, number>;
}

export interface ExchangeRateImpactAnalysis {
  loan_id: string;
  loan_code: string;
  currency: string;
  current_rate: number;
  proposed_rate: number;
  rate_change: number;
  current_outstanding: number;
  outstanding_after_rate_change: number;
  impact_amount: number;
  impact_percentage: number;
  impact_direction: string;
  recommendations: string[];
}

export interface MultiCurrencyLoan {
  id: string;
  loan_id: string;
  base_currency: string;
  base_principal: number;
  conversion_date: string;
  principal_in_currencies: Record<string, number>;
  outstanding_in_currencies: Record<string, number>;
}

// Multi-Currency Service
export const multiCurrencyService = {
  // Exchange Rate Operations
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<ExchangeRateSnapshot> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return request(
      `${API_URL}/api/multicurrency/exchange-rate/${fromCurrency}/${toCurrency}`,
      { method: 'GET' }
    );
  },

  async getHistoricalRates(
    fromCurrency: string,
    toCurrency: string,
    startDate: Date,
    endDate: Date
  ): Promise<ExchangeRateSnapshot[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    const params = new URLSearchParams({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
    return request(
      `${API_URL}/api/multicurrency/exchange-rate-history/${fromCurrency}/${toCurrency}?${params}`,
      { method: 'GET' }
    );
  },

  async updateExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    rate: number,
    source: string = 'Manual'
  ): Promise<ExchangeRateSnapshot> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return request(`${API_URL}/api/multicurrency/exchange-rate/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_currency: fromCurrency,
        to_currency: toCurrency,
        rate,
        source,
      }),
    });
  },

  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ original_amount: number; original_currency: string; converted_amount: number; converted_currency: string; conversion_date: string }> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return request(`${API_URL}/api/multicurrency/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        from_currency: fromCurrency,
        to_currency: toCurrency,
      }),
    });
  },

  async getSupportedCurrencies(): Promise<string[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return request(`${API_URL}/api/multicurrency/supported-currencies`, {
      method: 'GET',
    });
  },

  // Multi-Currency Loan Operations
  async createMultiCurrencyLoan(
    loanId: string,
    baseCurrency: string = 'INR'
  ): Promise<MultiCurrencyLoan> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return request(`${API_URL}/api/multicurrency/loan/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loan_id: loanId,
        base_currency: baseCurrency,
      }),
    });
  },

  async getLoanInCurrency(
    loanId: string,
    targetCurrency: string
  ): Promise<MultiCurrencyLoan> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return request(
      `${API_URL}/api/multicurrency/loan/${loanId}/currency/${targetCurrency}`,
      { method: 'GET' }
    );
  },

  async getLoanBreakdown(loanId: string): Promise<CurrencyLoanBreakdown[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return request(`${API_URL}/api/multicurrency/loan/${loanId}/breakdown`, {
      method: 'GET',
    });
  },

  async generateLoanEquivalentReport(
    loanId: string,
    currencies: string[] = ['USD', 'EUR', 'GBP']
  ): Promise<CurrencyEquivalentReport> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return request(
      `${API_URL}/api/multicurrency/loan/${loanId}/equivalent-report`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currencies }),
      }
    );
  },

  async getPortfolioMultiCurrencySummary(
    branchId: string,
    currencies: string[] = ['USD', 'EUR']
  ): Promise<PortfolioMultiCurrencySummary> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return request(
      `${API_URL}/api/multicurrency/portfolio/multi-currency-summary`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: branchId,
          currencies,
        }),
      }
    );
  },

  async analyzeExchangeRateImpact(
    loanId: string,
    rateChange: number
  ): Promise<ExchangeRateImpactAnalysis> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5177';
    return request(`${API_URL}/api/multicurrency/loan/${loanId}/rate-impact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rate_change: rateChange }),
    });
  },

  // Helper functions
  formatAmount(amount: number, currency: string): string {
    const currencySymbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      AUD: 'A$',
      CAD: 'C$',
      SGD: 'S$',
      HKD: 'HK$',
      AED: 'د.إ',
    };

    const symbol = currencySymbols[currency] || currency;
    const formatted = (amount / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${symbol} ${formatted}`;
  },

  calculateRateChange(currentRate: number, newRate: number): number {
    if (currentRate === 0) return 0;
    return ((newRate - currentRate) / currentRate) * 100;
  },

  getImpactColor(impactPercentage: number): string {
    if (impactPercentage > 5) return '#ef4444'; // red
    if (impactPercentage > 2) return '#f97316'; // orange
    if (impactPercentage > 0) return '#eab308'; // yellow
    return '#22c55e'; // green
  },
};

export default multiCurrencyService;
