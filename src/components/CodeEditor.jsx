// =====================================================================
// src/components/CodeEditor.jsx
// =====================================================================
import React from 'react';

const CodeEditor = ({ input, setInput }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Standaardwerk Code</h3>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        className="w-full h-[60vh] p-4 border border-gray-300 rounded-lg font-mono text-sm bg-gray-900 text-gray-300 shadow-inner"
        placeholder="Voer hier je Standaardwerk code in..."
      />
    </div>
  );
};

export default CodeEditor;

