// src/components/AnalysisView/StepCard.jsx
import React from 'react';
import ConditionTag from './ConditionTag.jsx';

const safeArray = arr => Array.isArray(arr) ? arr : [];

const StepCard = ({ step }) => {
  const label = step?.type === 'RUST'
    ? 'RUST'
    : step?.number !== undefined
      ? `STAP ${step.number}`
      : step?.name || 'STAP ?';

  const renderConditionGroup = (group, groupIndex) => (
    <div key={groupIndex} className="mb-3">
      {groupIndex > 0 && (
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-dashed border-gray-300" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-2 text-sm font-semibold text-green-600">+ OF</span>
          </div>
        </div>
      )}
      {safeArray(group?.conditions).map((condition, condIndex) => (
        <ConditionTag key={condIndex} condition={condition} />
      ))}
    </div>
  );

  const renderExtraSection = (title, items, colorClass = 'text-gray-800') => (
    safeArray(items).length > 0 && (
      <div className="mt-4">
        <h5 className="font-medium mb-2 text-gray-600 text-sm">{title}</h5>
        <ul className="list-disc list-inside text-sm space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className={`font-mono ${colorClass}`}>{typeof item === 'string' ? item : item.name}</li>
          ))}
        </ul>
      </div>
    )
  );

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${step?.type === 'RUST' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
            {label}
          </span>
          <span className="text-gray-800">{step?.description}</span>
        </h4>
        <span className="text-gray-400 text-xs font-mono">Regel {step?.lineNumber ?? '–'}</span>
      </div>

      {safeArray(step?.conditions).length > 0 && (
  <div className="mt-4">
    <h5 className="font-medium mb-3 text-gray-600 text-sm">Voorwaarden binnen stap:</h5>
    {safeArray(step?.conditions).map((line, index) => (
      <div key={index} className="font-mono text-sm text-gray-800">{line}</div>
    ))}
  </div>
)}


      {renderExtraSection('Timers gebruikt in deze stap:', step?.timers, 'text-orange-700')}
      {renderExtraSection('Markers gebruikt in deze stap:', step?.markers, 'text-green-700')}
      {renderExtraSection('Storingen gebruikt in deze stap:', step?.storingen, 'text-red-700')}
    </div>
  );
};

export default StepCard;
