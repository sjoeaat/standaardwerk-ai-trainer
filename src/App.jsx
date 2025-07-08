import React, { useState, useEffect } from 'react';
import {  Code, Eye, FileText, Settings, AlertCircle, Download, UploadCloud,
  Folder, Loader2, Bug
} from 'lucide-react';
import { UnifiedTextParser } from './core/UnifiedTextParser.js';
import { DEFAULT_VALIDATION_RULES } from './config/validationRules.js';
// UPDATED: Gebruik de enhanced word parser
import { parseWordDocument } from './core/enhancedWordParser';
import { generateTIAPortalXML } from './generator';
import { exportParsedDocument } from './components/ui/exportManager';
import { defaultInput, defaultSyntaxRules } from './constants';
import CodeEditor from './components/CodeEditor';
// UPDATED: Gebruik de enhanced analysis view
import AnalysisView from './components/AnalysisView/index.jsx';
import TiaXmlPreview from './components/TiaXmlPreview';
import Tab from './components/ui/Tab';
import ErrorBoundary from './components/ErrorBoundary';
import DebugView from './components/DebugView';
import SyntaxConfigView from './components/SyntaxConfigView';
import ValidationConfigManager from './components/ValidationConfigManager';




// -------------------
// ProjectHierarchy inline
// -------------------
const ProjectHierarchy = ({ hierarchy, onProgramSelect, activeProgram }) => {
  const tree = hierarchy?.children ? hierarchy.children : hierarchy;

  if (!tree || Object.keys(tree).length === 0) {
    return <div className="text-sm text-gray-500">Geen programma's gevonden.</div>;
  }

  const renderLevel = (levelData, level = 0) => {
    return Object.entries(levelData).map(([name, content]) => {
      const hasChildren = content.children && Object.keys(content.children).length > 0;
      const hasPrograms = Array.isArray(content.programs) && content.programs.length > 0;

      if (!hasChildren && !hasPrograms) return null;

      return (
        <div key={name} style={{ paddingLeft: `${level * 16}px` }}>
          <div className="flex items-center gap-2 text-gray-700 font-medium my-2">
            <Folder className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <span>{name}</span>
          </div>
          {hasChildren && renderLevel(content.children, level + 1)}
          {hasPrograms && (
            <ul className="pl-5 border-l-2 border-gray-200">
              {content.programs.map(program => (
                <li key={program.fullTitle}>
                  <button
                    onClick={() => onProgramSelect(program)}
                    className={`w-full text-left p-2 my-1 rounded-md flex items-center gap-2 transition-colors ${activeProgram?.fullTitle === program.fullTitle ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'}`}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-grow">{program.name} ({program.type}{program.fbNumber})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    });
  };

  return <div className="space-y-1">{renderLevel(tree)}</div>;
};

// Verbeterde WordImportView component voor in App.js
const WordImportView = ({
  setProjectData,
  projectData,
  activeProgram,
  setActiveProgram,
  setRawHtml,
  syntaxRules,
  programRegistry,
  setProgramRegistry
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parseDetails, setParseDetails] = useState(null);

  const handleFileChange = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setProjectData(null);
    setActiveProgram(null);
    setRawHtml('');
    setParseDetails(null);

    try {
      const { value: html } = await window.mammoth.convertToHtml(
        { arrayBuffer: await file.arrayBuffer() },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh"
          ]
        }
      );
      setRawHtml(html);
      const syntaxRules = {
        stepDetection: {
          patterns: [
            "^SCHRITT\\s+\\d+[:\\.\\-\\s]"
          ],
          stripPrefix: true
        },
        timerDetection: {
          patterns: [
            "\\b(Timer|Zeit|T\\d{1,4})\\b"
          ]
        },
        markerDetection: {
          patterns: [
            "\\bM\\d{1,5}(\\.\\d)?\\b",
            "\\bMB\\d{1,5}\\b",
            "\\bMerker\\s*\\d{1,5}\\b"
          ]
        },
        storingDetection: {
          patterns: [
            "\\bStörung\\b",
            "\\bFehler\\b",
            "\\bAlarm\\b"
          ]
        },
        variableDetection: {
          patterns: [
            "\\b\\w+(?:\\.\\w+)*(?:\\[\\d+\\])?\\s*(==|=|<>|<|>|<=|>=)\\s*[^\\s\\n]+",
            "\\b[A-Za-z_]+\\d*(?:\\[[^\\]]+\\])?\\b"
          ]
        }
      };
      
      const result = await parseWordDocument(file, syntaxRules);

      setProjectData(result);

      // ✅ Hier gebruiken we de juiste props
      const newRegistry = new Map(programRegistry);
      if (result.programs) {
        result.programs.forEach(program => {
          newRegistry.set(program.name, {
            steps: program.steps || [],
            variables: program.variables || [],
            timers: program.timers || [],
            markers: program.markers || [],
            storingen: program.storingen || [],
            errors: program.errors || [],
            warnings: program.warnings || []
          });
        });
        setProgramRegistry(newRegistry);
      }

      if (result.statistics) {
        setParseDetails(result.statistics);
      }

      if (result.errors?.length > 0) {
        setError(result.errors.map(e => e.message || e).join(', '));
      }

      if (result.programs?.length === 1) {
        setActiveProgram(result.programs[0]);
      }
    } catch (err) {
      setError(`Onverwachte fout bij het parsen van het document: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!projectData) return;
    await exportParsedDocument(projectData, {
      projectName: 'TIA_Project_Export',
      generateIDBs: true,
      includeCallStatements: true,
      useChapterNumbers: true
    });
  };

  const handleProgramSelect = (program) => {
    setActiveProgram(program);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">1. Importeer Word Document</h3>
          <input type="file" id="file-upload" className="hidden" accept=".docx" onChange={handleFileChange} />
          <button
            onClick={() => document.getElementById('file-upload').click()}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <UploadCloud className={isLoading ? "animate-pulse" : ""} />
            {isLoading ? 'Bezig met parsen...' : 'Kies .docx bestand'}
          </button>

          {error && (
            <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {parseDetails && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Parse Resultaten:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Programma's: <span className="font-mono">{parseDetails.totalPrograms}</span></div>
                <div>Stappen: <span className="font-mono">{parseDetails.totalSteps}</span></div>
                <div>Variabelen: <span className="font-mono">{parseDetails.totalVariables}</span></div>
                <div>Timers: <span className="font-mono">{parseDetails.totalTimers}</span></div>
                <div>Markers: <span className="font-mono">{parseDetails.totalMarkers}</span></div>
                <div>Storingen: <span className="font-mono">{parseDetails.totalStoringen}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border rounded-lg p-6 min-h-[400px]">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">2. Project Structuur</h3>
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Loader2 className="animate-spin w-8 h-8" />
            </div>
          ) : projectData ? (
            <ProjectHierarchy
              hierarchy={projectData.hierarchy}
              onProgramSelect={handleProgramSelect}
              activeProgram={activeProgram}
            />
          ) : (
            <div className="text-center text-gray-400 pt-16">
              Upload een document om de structuur te zien.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">3. Programma Details & Export</h3>
        {activeProgram ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-lg">{activeProgram.name}</h4>
              <p className="text-sm text-gray-500">{activeProgram.fullTitle}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {activeProgram.type}{activeProgram.fbNumber}
                </span>
                {activeProgram.idbName && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    IDB: {activeProgram.idbName}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold text-sm mb-2">Programma Analyse:</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Stappen: <span className="font-mono">{activeProgram.steps?.length || 0}</span></div>
                <div>Variabelen: <span className="font-mono">{activeProgram.variables?.length || 0}</span></div>
                <div>Timers: <span className="font-mono">{activeProgram.timers?.length || 0}</span></div>
                <div>Markers: <span className="font-mono">{activeProgram.markers?.length || 0}</span></div>
                <div>Storingen: <span className="font-mono">{activeProgram.storingen?.length || 0}</span></div>
                <div>Fouten: <span className="font-mono text-red-600">{activeProgram.errors?.length || 0}</span></div>
              </div>
            </div>

            <details className="border rounded-lg">
              <summary className="px-4 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100">
                Raw Content ({activeProgram.rawContent?.length || 0} karakters)
              </summary>
              <div className="p-4 bg-gray-50 font-mono text-xs overflow-auto max-h-96">
                <pre>{activeProgram.rawContent}</pre>
              </div>
            </details>

            {activeProgram.processedContent && (
              <details className="border rounded-lg">
                <summary className="px-4 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100">
                  Processed Content (voor parser)
                </summary>
                <div className="p-4 bg-gray-50 font-mono text-xs overflow-auto max-h-96">
                  <pre>{activeProgram.processedContent}</pre>
                </div>
              </details>
            )}

            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download />
              Exporteer Project als .ZIP
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-400 pt-16">
            Selecteer een programma om de details te bekijken.
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------
// App component
// -------------------
function App() {

  const [input, setInput] = useState(defaultInput);
  const [parseResult, setParseResult] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [activeProgram, setActiveProgram] = useState(null);
  const [activeTab, setActiveTab] = useState('wordImport');
  const [syntaxRules, setSyntaxRules] = useState(defaultSyntaxRules);
  const [rawHtml, setRawHtml] = useState('');
  const [validationRules, setValidationRules] = useState(DEFAULT_VALIDATION_RULES);
  const [programRegistry, setProgramRegistry] = useState(new Map());

  useEffect(() => {
    const calculateStatistics = (result) => ({
      steps: result.steps?.length ?? 0,
      variables: result.variables?.length ?? 0,
      timers: result.timers?.length ?? 0,
      markers: result.markers?.length ?? 0,
      storingen: result.storingen?.length ?? 0,
    });

    const handler = setTimeout(() => {
      if (activeProgram) {
        const resultFromWord = {
          programName: activeProgram.name,
          functionBlock: `${activeProgram.type}${activeProgram.fbNumber}`,
          symbolikIDB: activeProgram.idbName,
          steps: (activeProgram.steps || []).map(step => ({
            ...step,
            conditions: step.conditions || []
          })),
          
          variables: activeProgram.variables || [],
          timers: activeProgram.timers || [],
          markers: activeProgram.markers || [],
          storingen: activeProgram.storingen || [],
          errors: activeProgram.errors || [],
        };
        resultFromWord.statistics = calculateStatistics(resultFromWord);
        setParseResult(resultFromWord);
      } else {
        try {
          const parser = new UnifiedTextParser(syntaxRules, validationRules);
          // Register existing programs for cross-reference validation
          programRegistry.forEach((program, name) => {
            parser.registerProgram(name, program);
          });
          
          const result = parser.parse(input, 'manual', {
            programName: 'Manual Input',
            functionBlock: 'FB_Manual'
          });
          result.statistics = calculateStatistics(result);
          setParseResult(result);
        } catch (error) {
          console.error("Parsing Error:", error);
          setParseResult({ 
            errors: [{ message: error.message, line: 1, type: 'PARSING_ERROR' }], 
            warnings: [],
            steps: [], 
            statistics: {}, 
            timers: [], 
            markers: [], 
            variables: [], 
            storingen: [],
            crossReferences: []
          });
        }
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [input, activeProgram, syntaxRules]);

  const tabs = [
    { id: 'wordImport', label: 'Word Import', icon: UploadCloud },
    { id: 'input', label: 'Code Editor', icon: Code },
    { id: 'analysis', label: 'Analyse', icon: Eye },
    { id: 'tia', label: 'TIA Preview', icon: FileText },
    { id: 'config', label: 'Configuratie', icon: Settings },
    { id: 'validation', label: 'Validatie', icon: AlertCircle },
    { id: 'debug', label: 'Debug', icon: Bug }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'wordImport':
        return <WordImportView
        projectData={projectData}
        setProjectData={setProjectData}
        activeProgram={activeProgram}
        setActiveProgram={setActiveProgram}
        setRawHtml={setRawHtml}
        syntaxRules={syntaxRules}
        programRegistry={programRegistry}
        setProgramRegistry={setProgramRegistry}
      />
      ;
      case 'config':
        return <SyntaxConfigView syntaxRules={syntaxRules} setSyntaxRules={setSyntaxRules} />;
      case 'validation':
        return <ValidationConfigManager 
          validationRules={validationRules}
          onUpdateRules={setValidationRules}
          programRegistry={programRegistry}
          onUpdateProgramRegistry={setProgramRegistry}
        />;
      case 'debug':
        return <DebugView rawHtml={rawHtml} projectData={projectData} finalParseResult={parseResult} />;
      case 'input':
        return (
          <div>
            <h2 className="text-lg font-semibold mb-2">Handmatige Code Editor</h2>
            <p className="text-sm text-gray-600 mb-4">Deze editor wordt gebruikt als er geen programma uit een Word-document is geselecteerd.</p>
            <CodeEditor input={input} setInput={setInput} />
          </div>
        );
      case 'analysis':
        return parseResult ? <AnalysisView parseResult={parseResult} /> : <div className="text-center p-8 text-gray-500">Selecteer een programma of voer code in om een analyse te zien.</div>;
      case 'tia':
        return <TiaXmlPreview parseResult={parseResult} generateXml={generateTIAPortalXML} />;
      default:
        return <div className="p-4 text-gray-500">Selecteer een tabblad.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-screen-2xl mx-auto p-4 sm:p-6">
        <header className="mb-6 bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Standaardwerk Compiler & Validator</h1>
          <p className="text-gray-600">Geavanceerde parser voor stappenprogramma's • TIA Portal V18 Ready</p>
        </header>
        <nav className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            {tabs.map(tabInfo => <Tab key={tabInfo.id} {...tabInfo} activeTab={activeTab} setActiveTab={setActiveTab} />)}
          </div>
        </nav>
        <main className="bg-white rounded-lg shadow-sm p-6">
          <ErrorBoundary>
            {renderActiveTab()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default App;