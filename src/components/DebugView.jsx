// src/components/DebugView.jsx
import React from 'react';

/**
 * Een component om de ruwe output van de parser te tonen voor diagnostische doeleinden.
 */
const DebugView = ({ rawHtml, projectData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h2 className="text-xl font-bold text-yellow-800">Debug Informatie</h2>
        <p className="text-yellow-700 mt-1">
          Deze tab toont de interne data van de parser. Deel een screenshot van deze weergave om te helpen bij het oplossen van problemen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ruwe HTML Output */}
        <div>
          <h3 className="text-lg font-semibold mb-2">1. Ruwe HTML gegenereerd door Mammoth.js</h3>
          <div className="bg-gray-800 text-white p-4 rounded-lg font-mono text-xs h-96 overflow-auto">
            <pre>
              {rawHtml || 'Geen HTML data beschikbaar. Upload een bestand.'}
            </pre>
          </div>
        </div>

        {/* Geparseerde Data Output */}
        <div>
          <h3 className="text-lg font-semibold mb-2">2. Finale Output van de Parser</h3>
          <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-auto">
            <h4 className="font-bold mb-2">Gevonden Programma's (`programs` array):</h4>
            <pre className="text-xs bg-white p-2 rounded">
              {projectData ? JSON.stringify(projectData.programs, null, 2) : '[]'}
            </pre>

            <h4 className="font-bold mt-4 mb-2">Gegenereerde Hiërarchie (`hierarchy` object):</h4>
            <pre className="text-xs bg-white p-2 rounded">
              {projectData ? JSON.stringify(projectData.hierarchy, null, 2) : '{}'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugView;
