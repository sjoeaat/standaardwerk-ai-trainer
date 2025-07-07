// src/components/SyntaxConfigView.jsx
import React from 'react';

const SyntaxConfigView = ({ syntaxRules, setSyntaxRules }) => {
  const updateVariableDetection = (key, value) => {
    setSyntaxRules(prev => ({
      ...prev,
      variableDetection: {
        ...prev.variableDetection,
        [key]: value.split(',').map(s => s.trim()).filter(Boolean),
      },
    }));
  };

  const updateStepKeywordGroup = (group, value) => {
    setSyntaxRules(prev => ({
      ...prev,
      stepKeywords: {
        ...prev.stepKeywords,
        [group]: value.split(',').map(s => s.trim()).filter(Boolean),
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <h3 className="text-lg font-semibold mb-2 text-orange-800">⚙️ Live Syntax Configuratie</h3>
        <p className="text-orange-700 text-sm">
          Pas hier de parsingregels aan. Alle wijzigingen worden direct toegepast.
        </p>
      </div>

      {/* STAP HERKENNING */}
      <div className="bg-white border rounded-lg p-6">
        <label className="block text-sm font-medium mb-2">Stap Keywords</label>
        <input
          type="text"
          value={syntaxRules.stepKeywords.step.join(', ')}
          onChange={(e) => updateStepKeywordGroup('step', e.target.value)}
          className="w-full p-3 border rounded font-mono text-sm"
          placeholder="stap, schritt, step"
        />
      </div>

      <div className="bg-white border rounded-lg p-6">
        <label className="block text-sm font-medium mb-2">Rust Keywords</label>
        <input
          type="text"
          value={syntaxRules.stepKeywords.rest.join(', ')}
          onChange={(e) => updateStepKeywordGroup('rest', e.target.value)}
          className="w-full p-3 border rounded font-mono text-sm"
          placeholder="rust, ruhe, idle"
        />
      </div>

      {/* VARIABELE DETECTIE */}
      {['timerKeywords', 'markerKeywords', 'storingKeywords'].map((key, idx) => (
        <div key={idx} className="bg-white border rounded-lg p-6">
          <label className="block text-sm font-medium mb-2 capitalize">
            {key.replace('Keywords', '')} Keywords
          </label>
          <input
            type="text"
            value={syntaxRules.variableDetection[key].join(', ')}
            onChange={(e) => updateVariableDetection(key, e.target.value)}
            className="w-full p-3 border rounded font-mono text-sm"
            placeholder="gescheiden door komma’s"
          />
        </div>
      ))}
    </div>
  );
};

export default SyntaxConfigView;
