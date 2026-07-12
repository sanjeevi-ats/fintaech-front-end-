'use client';

import React, { useState, useEffect } from 'react';
import { riskManagementService, RiskProfile, RiskAlert, RiskSummary } from '@/services/riskManagementService';

export default function RiskDashboardPage() {
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAlertFilter, setSelectedAlertFilter] = useState<string>('all');

  const periodId = '00000000-0000-0000-0000-000000000001'; // Example period ID

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const profile = await riskManagementService.generateRiskProfileAsync(periodId);
      setRiskProfile(profile);

      const alertsData = await riskManagementService.getAlertsAsync();
      setAlerts(alertsData);

      const summaryData = await riskManagementService.getRiskSummaryAsync(periodId);
      setSummary(summaryData);
    } catch (err) {
      setError('Failed to load risk data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAlerts = () => {
    if (selectedAlertFilter === 'all') return alerts;
    return alerts.filter((a) => a.severity.toLowerCase() === selectedAlertFilter.toLowerCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading risk data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Risk Management Dashboard</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Overall Risk Score */}
        {riskProfile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div
              className="p-6 rounded-lg shadow-md"
              style={{
                backgroundColor: riskManagementService.getRiskLevelInfo(riskProfile.riskLevel)
                  .bgColor,
                borderLeft: `4px solid ${riskManagementService.getRiskLevelInfo(riskProfile.riskLevel).color}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 font-semibold">Overall Risk Score</p>
                  <p
                    className="text-4xl font-bold mt-2"
                    style={{
                      color: riskManagementService.getRiskLevelInfo(riskProfile.riskLevel).color,
                    }}
                  >
                    {riskManagementService.calculateRiskPercentage(riskProfile)}
                  </p>
                  <p className="text-gray-600 mt-2 font-semibold">
                    {riskProfile.riskLevel.toUpperCase()} RISK
                  </p>
                </div>
                <div className="text-5xl">
                  {riskProfile.riskLevel === 'Critical'
                    ? '🚨'
                    : riskProfile.riskLevel === 'High'
                      ? '⚠️'
                      : riskProfile.riskLevel === 'Medium'
                        ? '⚡'
                        : '✓'}
                </div>
              </div>
            </div>

            {/* Risk Summary Stats */}
            {summary && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Critical Alerts</span>
                    <span className="text-red-600 font-bold text-lg">{summary.criticalAlerts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">High Alerts</span>
                    <span className="text-orange-600 font-bold text-lg">{summary.highAlerts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Medium Alerts</span>
                    <span className="text-yellow-600 font-bold text-lg">{summary.mediumAlerts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Low Alerts</span>
                    <span className="text-green-600 font-bold text-lg">{summary.lowAlerts}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-gray-900 font-semibold">Total Alerts</span>
                    <span className="text-gray-900 font-bold text-lg">{summary.totalAlerts}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Risk Components */}
        {riskProfile && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {riskManagementService.getRiskComponents(riskProfile).map((component) => {
              const percentage = component.value;
              const color =
                percentage > 75 ? '#dc2626' : percentage > 50 ? '#ea8500' : '#16a34a';
              return (
                <div key={component.name} className="bg-white p-4 rounded-lg shadow-md">
                  <p className="text-sm font-semibold text-gray-700 mb-3">{component.name}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
                    ></div>
                  </div>
                  <p className="text-xl font-bold mt-2" style={{ color }}>
                    {component.label}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Key Risks & Recommendations */}
        {riskProfile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Risks</h3>
              <ul className="space-y-2">
                {riskProfile.keyRisks.map((risk, idx) => (
                  <li key={idx} className="flex items-start text-gray-700">
                    <span className="text-red-500 mr-2 mt-1">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
              <ul className="space-y-2">
                {riskProfile.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start text-gray-700">
                    <span className="text-green-500 mr-2 mt-1">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Active Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
            <select
              value={selectedAlertFilter}
              onChange={(e) => setSelectedAlertFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {getFilteredAlerts().length === 0 ? (
            <p className="text-gray-600 py-8 text-center">No alerts to display</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getFilteredAlerts().map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 border rounded-lg"
                  style={{
                    borderLeft: `4px solid ${riskManagementService.getAlertStatusColor(alert.severity)}`,
                    backgroundColor:
                      alert.status === 'Open' ? '#fafafa' : '#f0f0f0',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {riskManagementService.getSeverityIcon(alert.severity)}
                        </span>
                        <p className="font-semibold text-gray-900">{alert.title}</p>
                        <span
                          className="text-xs px-2 py-1 rounded font-semibold"
                          style={{
                            backgroundColor: riskManagementService.getAlertStatusColor(
                              alert.severity
                            ),
                            color: 'white',
                          }}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{alert.message}</p>
                      <p className="text-gray-500 text-xs mt-2">
                        Created: {riskManagementService.formatDate(alert.createdAt)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {alert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


