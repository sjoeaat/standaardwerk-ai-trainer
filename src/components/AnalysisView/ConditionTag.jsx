
// =====================================================================
// src/components/AnalysisView/ConditionTag.jsx
// =====================================================================
import React from 'react';
import { GitCompare } from 'lucide-react';

const ConditionTag = ({ condition }) => (
  <div className="ml-4 p-3 bg-gray-50 border-l-4 border-blue-200 text-sm rounded-r mb-2">
    <div className="flex items-center gap-2 mb-2">
      {condition?.negated && (<span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">NIET</span>)}
      <span className="flex-1 font-mono text-xs text-gray-700">{condition?.text || 'Onbekende voorwaarde'}</span>
    </div>
    {condition?.hasComparison && (
      <div className="mt-2 flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
        <GitCompare className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <div className="font-mono text-xs text-blue-800">
          <span className="font-semibold">{condition.comparison?.variable}</span>
          <span className="mx-1 font-bold text-blue-500">{condition.comparison?.operator}</span>
          <span className="font-semibold">{condition.comparison?.value}</span>
        </div>
      </div>
    )}
  </div>
);

export default ConditionTag;
