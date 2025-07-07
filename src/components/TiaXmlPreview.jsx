// =====================================================================
// src/components/TiaXmlPreview.jsx (Definitieve Versie)
// =====================================================================
// Deze versie bevat de definitieve fix voor de XML-opmaak,
// een downloadknop en verbeterde foutafhandeling.
// =====================================================================
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Download, AlertTriangle } from 'lucide-react';

/**
 * Deze component toont de gegenereerde TIA Portal XML en biedt een downloadknop.
 */
function TiaXmlPreview({ parseResult, generateXml }) {
  // Functie om de download te starten.
  const handleDownload = () => {
    if (!parseResult || (parseResult.errors && parseResult.errors.length > 0)) {
      alert("Kan het bestand niet downloaden omdat er fouten in de code zitten.");
      return;
    }

    try {
      const xmlString = generateXml(parseResult);
      const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const fileName = `${parseResult.functionBlock || 'FB1'}.xml`;
      
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download Error:", error);
      alert(`Er is een fout opgetreden bij het genereren van het XML-bestand: ${error.message}`);
    }
  };

  // Toon een laadbericht als de parser nog bezig is.
  if (!parseResult) {
    return (
      <div className="p-4 text-center text-gray-500">
        Analyse wordt uitgevoerd...
      </div>
    );
  }

  // Toon een foutmelding als de parser fouten heeft gevonden.
  if (parseResult.errors && parseResult.errors.length > 0) {
    return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-bold text-red-800 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Parser Fout
            </h3>
            <p className="text-red-700 mt-2">{parseResult.errors[0].message}</p>
        </div>
    );
  }

  // Genereer de XML voor de preview.
  let xmlString;
  try {
    // Gebruik false voor 'pretty' om de output compacter te maken, wat de witruimtefout oplost.
    // De syntax highlighter zorgt alsnog voor de leesbaarheid.
    xmlString = generateXml(parseResult);
  } catch (error) {
    console.error("XML Generation Error:", error);
    return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-bold text-red-800 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Generator Fout
            </h3>
            <p className="text-red-700 mt-2">{error.message}</p>
        </div>
    );
  }

  // Toon de preview en de downloadknop.
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleDownload}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Download className="mr-2 h-5 w-5" />
          Download XML
        </button>
      </div>
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <SyntaxHighlighter language="xml" style={vscDarkPlus} showLineNumbers>
          {xmlString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default TiaXmlPreview;
