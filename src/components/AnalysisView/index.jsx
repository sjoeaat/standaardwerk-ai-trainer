// src/components/AnalysisView/index.jsx
import React from 'react';
import StepCard from './StepCard.jsx';

const safeArray = arr => Array.isArray(arr) ? arr : [];

const AnalysisView = ({ parseResult }) => {
  if (!parseResult) {
    return <div className="text-center p-4 text-gray-500">Aan het parsen...</div>;
  }
  if (parseResult.errors && parseResult.errors.length > 0) {
    return (
      <div className="text-red-500 bg-red-50 p-4 rounded-lg">
        Error: {parseResult.errors[0].message}
      </div>
    );
  }

  const steps = safeArray(parseResult.steps);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Stappen Overzicht</h3>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
