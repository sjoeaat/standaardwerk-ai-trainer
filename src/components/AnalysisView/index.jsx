// src/components/AnalysisView/index.jsx - Complete Enhanced versie
import React from 'react';
import { GitCompare, Clock, AlertTriangle, Settings, Zap } from 'lucide-react';

const safeArray = arr => Array.isArray(arr) ? arr : [];

// Enhanced ConditionTag component
const ConditionTag = ({ condition }) => (
  <div className="ml-4 p-3 bg-gray-50 border-l-4 border-blue-200 text-sm rounded-r mb-2">
    <div className="flex items-center gap-2 mb-2">
      {condition?.negated && (
        <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">NIET</span>
      )}
      {condition?.operator === 'OR' && (
        <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">OF</span>
      )}
      {condition?.isTimeCondition && (
        <Clock className="w-4 h-4 text-orange-500" />
      )}
      {condition?.hasExternalRef && (
        <Zap className="w-4 h-4 text-purple-500" />
      )}
      <span className="flex-1 font-mono text-xs text-gray-700">
        {condition?.originalLine || condition?.text || 'Onbekende voorwaarde'}
      </span>
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

// Enhanced StepCard component
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

  const renderExtraSection = (title, items, colorClass = 'text-gray-800', icon = null) => (
    safeArray(items).length > 0 && (
      <div className="mt-4">
        <h5 className="font-medium mb-2 text-gray-600 text-sm flex items-center gap-2">
          {icon}
          {title}
        </h5>
        <ul className="list-disc list-inside text-sm space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className={`font-mono ${colorClass}`}>
              {typeof item === 'string' ? item : item.name}
            </li>
          ))}
        </ul>
      </div>
    )
  );

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            step?.type === 'RUST' 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {label}
          </span>
          <span className="text-gray-800">{step?.description}</span>
        </h4>
        <span className="text-gray-400 text-xs font-mono">Regel {step?.lineNumber ?? '–'}</span>
      </div>

      {/* Transition Conditions */}
      {safeArray(step?.transitionConditions).length > 0 && (
        <div className="mt-4">
          <h5 className="font-medium mb-3 text-gray-600 text-sm">Overgangsvoorwaarden:</h5>
          {step.transitionConditions.map((group, index) => 
            renderConditionGroup(group, index)
          )}
        </div>
      )}

      {/* Legacy conditions support */}
      {safeArray(step?.conditions).length > 0 && (
        <div className="mt-4">
          <h5 className="font-medium mb-3 text-gray-600 text-sm">Voorwaarden binnen stap:</h5>
          <div className="space-y-1">
            {safeArray(step?.conditions).map((line, index) => (
              <div key={index} className="ml-4 p-2 bg-gray-50 border-l-4 border-blue-200 text-sm rounded-r">
                <span className="font-mono text-gray-800">{line}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variable usage in this step */}
      {renderExtraSection(
        'Timers gebruikt in deze stap:', 
        step?.timers, 
        'text-orange-700', 
        <Clock className="w-4 h-4 text-orange-500" />
      )}
      {renderExtraSection(
        'Markers gebruikt in deze stap:', 
        step?.markers, 
        'text-green-700',
        <Settings className="w-4 h-4 text-green-500" />
      )}
      {renderExtraSection(
        'Storingen gebruikt in deze stap:', 
        step?.storingen, 
        'text-red-700',
        <AlertTriangle className="w-4 h-4 text-red-500" />
      )}
    </div>
  );
};

// Enhanced VariableCard component
const VariableCard = ({ variable, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'timer': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'marker': return <Settings className="w-5 h-5 text-green-500" />;
      case 'storing': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <GitCompare className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'timer': return 'border-orange-200 bg-orange-50';
      case 'marker': return 'border-green-200 bg-green-50';
      case 'storing': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getColorClass()}`}>
      <div className="flex items-center gap-3 mb-3">
        {getIcon()}
        <h4 className="font-semibold text-gray-800">{variable.name}</h4>
        {variable.value && (
          <span className="text-sm font-mono text-gray-600">= {variable.value}</span>
        )}
        <span className="text-gray-400 text-xs font-mono ml-auto">Regel {variable.lineNumber}</span>
      </div>
      
      {safeArray(variable?.conditions).length > 0 && (
        <div>
          <h5 className="font-medium mb-2 text-gray-600 text-sm">Voorwaarden:</h5>
          {variable.conditions.map((condition, idx) => (
            <ConditionTag key={idx} condition={condition} />
          ))}
        </div>
      )}
    </div>
  );
};

// Main AnalysisView component
const AnalysisView = ({ parseResult }) => {
  if (!parseResult) {
    return <div className="text-center p-4 text-gray-500">Aan het parsen...</div>;
  }
  
  if (parseResult.errors && parseResult.errors.length > 0) {
    return (
      <div className="text-red-500 bg-red-50 p-4 rounded-lg">
        <h3 className="font-bold text-red-800 mb-2">Parser Fouten:</h3>
        {parseResult.errors.map((error, idx) => (
          <div key={idx} className="mb-2">
            Regel {error.line}: {error.message}
          </div>
        ))}
      </div>
    );
  }

  const steps = safeArray(parseResult.steps);
  const variables = safeArray(parseResult.variables);
  const timers = safeArray(parseResult.timers);
  const markers = safeArray(parseResult.markers);
  const storingen = safeArray(parseResult.storingen);

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {parseResult.statistics && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">Analyse Overzicht</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{parseResult.statistics.totalSteps}</div>
              <div className="text-sm text-blue-700">Stappen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{parseResult.statistics.totalConditions}</div>
              <div className="text-sm text-green-700">Voorwaarden</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{parseResult.statistics.totalVariables}</div>
              <div className="text-sm text-orange-700">Variabelen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{parseResult.statistics.complexityScore}</div>
              <div className="text-sm text-purple-700">Complexiteit</div>
            </div>
          </div>
        </div>
      )}

      {/* Steps Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Stappen Overzicht ({steps.length})</h3>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} />
          ))}
        </div>
      </div>

      {/* Variables Section */}
      {(variables.length > 0 || timers.length > 0 || markers.length > 0 || storingen.length > 0) && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Variabelen Overzicht</h3>
          
          <div className="space-y-6">
            {timers.length > 0 && (
              <div>
                <h4 className="text-lg font-medium mb-3 text-orange-700 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Timers ({timers.length})
                </h4>
                <div className="grid gap-3">
                  {timers.map((timer, idx) => (
                    <VariableCard key={idx} variable={timer} type="timer" />
                  ))}
                </div>
              </div>
            )}

            {markers.length > 0 && (
              <div>
                <h4 className="text-lg font-medium mb-3 text-green-700 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Markers ({markers.length})
                </h4>
                <div className="grid gap-3">
                  {markers.map((marker, idx) => (
                    <VariableCard key={idx} variable={marker} type="marker" />
                  ))}
                </div>
              </div>
            )}

            {storingen.length > 0 && (
              <div>
                <h4 className="text-lg font-medium mb-3 text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Storingen ({storingen.length})
                </h4>
                <div className="grid gap-3">
                  {storingen.map((storing, idx) => (
                    <VariableCard key={idx} variable={storing} type="storing" />
                  ))}
                </div>
              </div>
            )}

            {variables.length > 0 && (
              <div>
                <h4 className="text-lg font-medium mb-3 text-blue-700 flex items-center gap-2">
                  <GitCompare className="w-5 h-5" />
                  Overige Variabelen ({variables.length})
                </h4>
                <div className="grid gap-3">
                  {variables.map((variable, idx) => (
                    <VariableCard key={idx} variable={variable} type="variable" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;