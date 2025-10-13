'use client';

import { Building2, TrendingUp } from 'lucide-react';

interface CompanyReference {
  name: string;
  relevanceScore: number; // 0-100
  reason: string;
  category: 'direct' | 'adjacent';
}

interface CompanyEcosystemMatrixProps {
  companies: CompanyReference[];
  isAiPowered: boolean;
}

export default function CompanyEcosystemMatrix({ companies, isAiPowered }: CompanyEcosystemMatrixProps) {
  const directCompetitors = companies.filter(c => c.category === 'direct').slice(0, 20);
  const adjacentCompanies = companies.filter(c => c.category === 'adjacent').slice(0, 20);

  // Default sample data
  const sampleDirect: CompanyReference[] = [
    { name: 'CompetitorA', relevanceScore: 95, reason: 'Direct competitor, similar product', category: 'direct' },
    { name: 'CompetitorB', relevanceScore: 88, reason: 'Same market segment', category: 'direct' },
    { name: 'CompetitorC', relevanceScore: 82, reason: 'Overlapping features', category: 'direct' },
  ];

  const sampleAdjacent: CompanyReference[] = [
    { name: 'AdjacentCo1', relevanceScore: 75, reason: 'Complementary product, similar tech stack', category: 'adjacent' },
    { name: 'AdjacentCo2', relevanceScore: 68, reason: 'Adjacent market, transferable skills', category: 'adjacent' },
  ];

  const displayDirect = directCompetitors.length > 0 ? directCompetitors : sampleDirect;
  const displayAdjacent = adjacentCompanies.length > 0 ? adjacentCompanies : sampleAdjacent;

  const renderCompanyRow = (company: CompanyReference) => (
    <tr key={company.name} className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-2 px-3 text-sm font-medium text-gray-900">{company.name}</td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              style={{ width: `${company.relevanceScore}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-10 text-right">
            {company.relevanceScore}%
          </span>
        </div>
      </td>
      <td className="py-2 px-3 text-xs text-gray-600">{company.reason}</td>
    </tr>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="company-ecosystem-matrix">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-indigo-600" />
        Company Ecosystem Matrix
      </h3>

      {!isAiPowered && (
        <div className="mb-4 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
          Sample data shown. Enable AI for real company analysis.
        </div>
      )}

      {/* Direct Competitors */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
          <Building2 size={14} className="text-red-600" />
          Direct Competitors (Top 20)
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="py-2 px-3 text-xs font-semibold text-gray-700">Company</th>
                <th className="py-2 px-3 text-xs font-semibold text-gray-700">Relevance</th>
                <th className="py-2 px-3 text-xs font-semibold text-gray-700">Reason</th>
              </tr>
            </thead>
            <tbody>
              {displayDirect.map(renderCompanyRow)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjacent Companies */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
          <Building2 size={14} className="text-blue-600" />
          Adjacent Companies (Top 20)
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="py-2 px-3 text-xs font-semibold text-gray-700">Company</th>
                <th className="py-2 px-3 text-xs font-semibold text-gray-700">Fit Score</th>
                <th className="py-2 px-3 text-xs font-semibold text-gray-700">Reason</th>
              </tr>
            </thead>
            <tbody>
              {displayAdjacent.map(renderCompanyRow)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Why This Matters (always expanded) */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-1">Why this matters:</p>
        <p className="text-xs text-gray-600">
          Knowing the competitive landscape helps you speak intelligently about the market, 
          identify transferable experience from similar companies, and broaden your job search 
          to adjacent opportunities.
        </p>
      </div>
    </div>
  );
}

