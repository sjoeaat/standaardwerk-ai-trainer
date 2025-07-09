import React from 'react';

const StepItem = ({ step }) => {
  // Function to determine step label and type
  const renderStepLabel = () => {
    switch (step.type) {
      case 'RUST':
      case 'RUHE':
        return step.keyword || 'RUHE';
      case 'STAP':
      case 'SCHRITT':
        return `${step.keyword || 'SCHRITT'} ${step.number}`;
      case 'KLAAR':
      case 'FERTIG':
        return step.keyword || 'FERTIG';
      default:
        return `${step.type} ${step.number}`;
    }
  };

  // Function to determine background color
  const getBackgroundColor = () => {
    switch (step.type) {
      case 'RUST':
      case 'RUHE':
        return 'bg-purple-100 text-purple-800';
      case 'KLAAR':
      case 'FERTIG':
        return 'bg-green-100 text-green-800';
      case 'STAP':
      case 'SCHRITT':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Function to render conditions with proper formatting
  const renderConditions = () => {
    if (!step.conditions?.length) return null;

    return (
      <div className="mt-2 space-y-1 pl-4 border-l-2 ml-3">
        {step.conditions.map((condition, idx) => {
          const isOr = condition.startsWith('+');
          const isNot = condition.startsWith('NICHT') || condition.startsWith('NIET');
          const className = `text-sm ${isOr ? 'text-orange-600' : ''} ${isNot ? 'text-red-600' : 'text-gray-700'}`;
          
          return (
            <div key={idx} className={className}>
              {isOr ? '+ ' : '• '}{condition.replace(/^\+\s*/, '')}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-4 mb-2">
      <div className="flex items-center gap-2">
        <span className={`${getBackgroundColor()} px-2 py-1 rounded font-semibold`}>
          {renderStepLabel()}
        </span>
        <span className="font-medium">{step.description}</span>
        {step.lineNumber && (
          <span className="text-xs text-gray-500 ml-auto">
            Regel {step.lineNumber}
          </span>
        )}
      </div>
      {renderConditions()}
      {step.timers?.length > 0 && (
        <div className="mt-2 pl-4 text-sm text-blue-600">
          ⏱️ {step.timers.join(', ')}
        </div>
      )}
      {step.variables?.length > 0 && (
        <div className="mt-2 pl-4 text-sm text-purple-600">
          🔄 {step.variables.join(', ')}
        </div>
      )}
    </div>
  );
};

const AnalysisView = ({ parseResult }) => {
  if (!parseResult) {
    return (
      <div className="p-4 text-gray-500 text-center">
        Geen analyse beschikbaar. Voer eerst een programma in.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4">Analyse Overzicht</h3>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600">Stappen</div>
            <div className="text-2xl font-bold">{parseResult.statistics.totalSteps}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600">Voorwaarden</div>
            <div className="text-2xl font-bold">{parseResult.statistics.totalConditions}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600">Variabelen</div>
            <div className="text-2xl font-bold">{parseResult.statistics.totalVariables}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-orange-600">Complexiteit</div>
            <div className="text-2xl font-bold">{parseResult.statistics.complexityScore}</div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-lg mb-3">Stappen Overzicht ({parseResult.steps.length})</h4>
        <div className="space-y-2">
          {parseResult.steps.map((step, index) => (
            <StepItem key={index} step={step} />
          ))}
        </div>
      </div>

      {parseResult.variables.length > 0 && (
        <div>
          <h4 className="font-semibold text-lg mb-3">Variabelen ({parseResult.variables.length})</h4>
          <div className="grid grid-cols-2 gap-4">
            {parseResult.variables.map((variable, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="font-medium">{variable.name}</div>
                <div className="text-sm text-gray-500">{variable.type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {parseResult.errors && parseResult.errors.length > 0 && (
        <div>
          <h4 className="font-semibold text-lg mb-3 text-red-600">Fouten</h4>
          <div className="space-y-2">
            {parseResult.errors.map((error, index) => (
              <div key={index} className="bg-red-50 text-red-700 p-3 rounded-lg">
                Regel {error.line}: {error.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;