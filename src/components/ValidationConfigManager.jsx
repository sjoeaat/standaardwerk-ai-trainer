// =====================================================================
// src/components/ValidationConfigManager.jsx
// =====================================================================
// Component for managing validation rules configuration
// Allows import/export of validation rules and program registry
// =====================================================================

import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Settings, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  FileText,
  Eye,
  Edit
} from 'lucide-react';
import { 
  exportValidationRules, 
  importValidationRules, 
  DEFAULT_VALIDATION_RULES 
} from '../config/validationRules.js';
import { PatternGenerator } from '../core/PatternGenerator.js';

const ValidationConfigManager = ({ 
  validationRules, 
  onUpdateRules, 
  programRegistry,
  onUpdateProgramRegistry 
}) => {
  const [activeTab, setActiveTab] = useState('rules');
  const [editingGroup, setEditingGroup] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);
  const [patternGenerationStatus, setPatternGenerationStatus] = useState(null);
  const fileInputRef = useRef(null);
  const trainingDataRef = useRef(null);

  const handleExportRules = () => {
    try {
      const config = {
        validationRules: validationRules || DEFAULT_VALIDATION_RULES,
        programRegistry: Array.from(programRegistry?.entries() || []).map(([name, data]) => ({
          name,
          steps: data.steps?.map(s => ({ 
            number: s.number, 
            type: s.type, 
            description: s.description 
          })) || []
        })),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'validation-config.json';
      a.click();
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const handleImportRules = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        
        // Validate structure
        if (!config.validationRules) {
          throw new Error('Invalid config: missing validationRules');
        }

        // Import validation rules
        if (onUpdateRules) {
          onUpdateRules(config.validationRules);
        }

        // Import program registry
        if (config.programRegistry && onUpdateProgramRegistry) {
          const registryMap = new Map();
          config.programRegistry.forEach(program => {
            registryMap.set(program.name, program);
          });
          onUpdateProgramRegistry(registryMap);
        }

        setImportStatus('success');
        setTimeout(() => setImportStatus(null), 3000);
      } catch (error) {
        console.error('Import error:', error);
        setImportStatus('error');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset alle validation rules naar standaard instellingen?')) {
      onUpdateRules(DEFAULT_VALIDATION_RULES);
      setImportStatus('reset');
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const handleGeneratePatterns = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setPatternGenerationStatus('loading');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const trainingData = JSON.parse(e.target.result);
          
          // Initialize pattern generator
          const generator = new PatternGenerator({
            minFrequency: 3,
            minPrecision: 0.7,
            minRecall: 0.7,
            maxPatterns: 5
          });
          
          // Load training data
          const allResults = [];
          if (trainingData.bestSuggestions) {
            allResults.push({
              suggestions: trainingData.bestSuggestions
            });
          }
          
          generator.loadTrainingData(allResults);
          
          // Generate patterns
          const patterns = await generator.generateAllPatterns();
          
          // Convert to validation rules format
          const newRules = { ...validationRules };
          
          patterns.forEach((groupPatterns, groupType) => {
            if (newRules.groups[groupType]) {
              // Add generated patterns to existing group
              const regexPatterns = groupPatterns.map(p => new RegExp(p.pattern, 'i'));
              newRules.groups[groupType].patterns = [
                ...newRules.groups[groupType].patterns,
                ...regexPatterns
              ];
            }
          });
          
          // Update rules
          onUpdateRules(newRules);
          
          setPatternGenerationStatus('success');
          setTimeout(() => setPatternGenerationStatus(null), 5000);
          
        } catch (error) {
          console.error('Pattern generation error:', error);
          setPatternGenerationStatus('error');
          setTimeout(() => setPatternGenerationStatus(null), 5000);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('File reading error:', error);
      setPatternGenerationStatus('error');
      setTimeout(() => setPatternGenerationStatus(null), 5000);
    }
  };

  const renderGroupEditor = (groupName, groupConfig) => {
    const isEditing = editingGroup === groupName;
    
    return (
      <div key={groupName} className="border rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-lg">{groupConfig.name}</h4>
          <button
            onClick={() => setEditingGroup(isEditing ? null : groupName)}
            className="text-blue-500 hover:text-blue-700"
          >
            {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          </button>
        </div>
        
        <p className="text-gray-600 mb-3">{groupConfig.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium mb-2">Implementation</h5>
            <div className="bg-gray-50 p-2 rounded text-sm">
              <div>Type: <span className="font-mono">{groupConfig.implementation.type}</span></div>
              <div>Data Type: <span className="font-mono">{groupConfig.implementation.dataType}</span></div>
              <div>Array: <span className="font-mono">{groupConfig.implementation.arrayName}[{groupConfig.implementation.arrayRange.join('..')}]</span></div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium mb-2">Validation Rules</h5>
            <div className="bg-gray-50 p-2 rounded text-sm">
              <div>Requires Conditions: <span className="font-mono">{groupConfig.validation.requiresConditions.toString()}</span></div>
              <div>Allows SET/RESET: <span className="font-mono">{groupConfig.validation.allowsSetResetTable.toString()}</span></div>
              <div>Max Conditions: <span className="font-mono">{groupConfig.validation.maxConditions}</span></div>
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <h5 className="font-medium mb-2">Recognition Patterns</h5>
          <div className="bg-gray-50 p-2 rounded">
            {groupConfig.patterns.map((pattern, index) => (
              <div key={index} className="font-mono text-sm mb-1">
                {pattern.toString()}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderProgramRegistry = () => {
    const programs = Array.from(programRegistry?.entries() || []);
    
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Program Registry</h3>
        <div className="text-sm text-gray-600 mb-4">
          Registered programs: {programs.length}
        </div>
        
        {programs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No programs registered yet. Import a Word document to populate the registry.
          </div>
        ) : (
          <div className="space-y-4">
            {programs.map(([name, data]) => (
              <div key={name} className="border rounded-lg p-4">
                <h4 className="font-semibold">{name}</h4>
                <div className="mt-2">
                  <div className="text-sm text-gray-600">
                    Steps: {data.steps?.length || 0}
                  </div>
                  {data.steps && data.steps.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {data.steps.map(step => (
                        <div key={step.number} className="bg-gray-50 p-2 rounded text-sm">
                          <div className="font-mono">{step.type} {step.number}</div>
                          <div className="text-xs text-gray-500 truncate">{step.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Validation Configuration</h2>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleExportRules}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => trainingDataRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            disabled={patternGenerationStatus === 'loading'}
          >
            <Settings className="w-4 h-4" />
            {patternGenerationStatus === 'loading' ? 'Generating...' : 'Generate Patterns'}
          </button>
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            <Settings className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {importStatus && (
        <div className={`mb-4 p-3 rounded flex items-center gap-2 ${
          importStatus === 'success' ? 'bg-green-100 text-green-800' : 
          importStatus === 'reset' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {importStatus === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {importStatus === 'success' ? 'Configuration imported successfully!' : 
           importStatus === 'reset' ? 'Configuration reset to defaults!' :
           'Error importing configuration!'}
        </div>
      )}

      {exportStatus && (
        <div className={`mb-4 p-3 rounded flex items-center gap-2 ${
          exportStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {exportStatus === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {exportStatus === 'success' ? 'Configuration exported successfully!' : 'Error exporting configuration!'}
        </div>
      )}

      {patternGenerationStatus && (
        <div className={`mb-4 p-3 rounded flex items-center gap-2 ${
          patternGenerationStatus === 'success' ? 'bg-green-100 text-green-800' : 
          patternGenerationStatus === 'loading' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {patternGenerationStatus === 'success' ? <CheckCircle className="w-4 h-4" /> : 
           patternGenerationStatus === 'loading' ? <Settings className="w-4 h-4 animate-spin" /> :
           <AlertCircle className="w-4 h-4" />}
          {patternGenerationStatus === 'success' ? 'Patterns generated and applied successfully!' : 
           patternGenerationStatus === 'loading' ? 'Generating patterns from training data...' :
           'Error generating patterns!'}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Validation Rules
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'registry'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Program Registry
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'rules' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Variable Groups</h3>
          {Object.entries(validationRules?.groups || DEFAULT_VALIDATION_RULES.groups).map(([groupName, groupConfig]) =>
            renderGroupEditor(groupName, groupConfig)
          )}
        </div>
      )}

      {activeTab === 'registry' && renderProgramRegistry()}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportRules}
        className="hidden"
      />
      <input
        ref={trainingDataRef}
        type="file"
        accept=".json"
        onChange={handleGeneratePatterns}
        className="hidden"
      />
    </div>
  );
};

export default ValidationConfigManager;