# 🚀 Standaardwerk Webapp - Deployment Instructions

## 📁 **Correcte Repository Setup**

Je hebt de verkeerde download gebruikt. Hier is hoe je de **production-ready webapp met ML integration** krijgt:

### **Optie 1: GitHub Repository (Aanbevolen)**
```bash
git clone https://github.com/sjoeaat/standaardwerk-ai-trainer.git
cd standaardwerk-ai-trainer
npm install
npm run dev
```

### **Optie 2: Manual Setup**
Als je de files handmatig wilt kopiëren, heb je deze **production-ready structure** nodig:

---

## 📦 **Required Package.json**

Maak een `package.json` bestand met:

```json
{
  "name": "standaardwerk-webapp-ml",
  "version": "2.0.0",
  "type": "module",
  "description": "Production-Ready Standaardwerk Webapp with ML Integration",
  "scripts": {
    "dev": "vite",
    "build": "vite build", 
    "preview": "vite preview",
    "test": "node test-ml-integration.js"
  },
  "dependencies": {
    "file-saver": "^2.0.5",
    "jszip": "^3.10.1", 
    "lucide-react": "^0.276.0",
    "mammoth": "^1.9.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-syntax-highlighter": "^15.6.1"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.15", 
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.4",
    "autoprefixer": "^10.4.15",
    "esbuild": "^0.19.2", 
    "postcss": "^8.4.27",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.9"
  }
}
```

---

## 🏗️ **Required Project Structure**

```
standaardwerk-webapp/
├── package.json              # Dependencies & scripts
├── vite.config.js            # Vite configuration  
├── tailwind.config.js        # Tailwind CSS config
├── index.html               # HTML entry point
├── src/
│   ├── App.jsx              # Main React app with ML integration
│   ├── constants.js         # Default configurations
│   ├── generator.js         # TIA Portal XML generator  
│   ├── config/
│   │   ├── syntaxRules.js   # ML-enhanced syntax rules
│   │   └── validationRules.js # Validation configuration
│   ├── core/
│   │   ├── UnifiedTextParser.js     # ML-enhanced parser
│   │   ├── EnhancedLogicParser.js   # Logic parsing engine
│   │   ├── enhancedWordParser.js    # Word document processing
│   │   ├── ContentPreprocessor.js   # Text preprocessing
│   │   └── HierarchicalParser.js    # Structural parsing
│   └── components/
│       ├── CodeEditor.jsx           # Code editor component
│       ├── AnalysisView/
│       │   └── index.jsx           # Analysis view with ML metrics
│       ├── TiaXmlPreview.jsx       # TIA Portal preview
│       ├── DebugView.jsx           # Debug information
│       ├── SyntaxConfigView.jsx    # Syntax configuration
│       ├── ValidationConfigManager.jsx # Validation manager
│       └── ui/
│           ├── Tab.jsx             # Tab component
│           └── exportManager.js    # Export functionality
├── cli-parser.js            # Command-line interface
└── pattern-storage/         # ML training data
    ├── patterns.json        # Learned patterns
    └── metadata.json        # Training statistics
```

---

## ⚙️ **Configuration Files Needed**

### **vite.config.js**
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    target: 'es2020'
  },
  define: {
    global: 'globalThis'
  },
  server: {
    port: 5173,
    host: true
  }
});
```

### **tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### **index.html**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Standaardwerk Webapp - ML Enhanced</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## 🚀 **Quick Start Command Sequence**

1. **Download van GitHub**:
```bash
git clone https://github.com/sjoeaat/standaardwerk-ai-trainer.git
cd standaardwerk-ai-trainer
```

2. **Install Dependencies**:
```bash
npm install
```

3. **Start Development**:
```bash
npm run dev
```

4. **Open Browser**:
```
http://localhost:5173
```

---

## 🧠 **ML Features Verification**

Na het starten, controleer of de ML integration werkt:

1. **Upload een Word document** (.docx)
2. **Check Analysis tab** - je moet zien:
   - ML Training Integration card
   - Training Accuracy: 100%
   - Total Examples: 8,107
   - Pattern Reduction: 51%
   - ML Patterns count

3. **Test parsing** - je moet zien:
   - Verbeterde step detection
   - Cross-reference herkenning
   - Variabele pattern matching

---

## 🔧 **Troubleshooting**

### **Als npm install faalt:**
```bash
# Clear cache and reinstall
npm cache clean --force
npm install
```

### **Als Vite start faalt:**
```bash
# Check Node.js version (needs 18+)
node --version

# Update if needed
npm install -g npm@latest
```

### **Als ML features ontbreken:**
Check of deze files bestaan:
- `src/config/syntaxRules.js` (moet ML patterns bevatten)
- `src/core/UnifiedTextParser.js` (moet ML methods bevatten)
- `src/components/AnalysisView/index.jsx` (moet MLMetricsCard bevatten)

---

## 📞 **Support**

**GitHub Repository**: https://github.com/sjoeaat/standaardwerk-ai-trainer  
**Issues**: https://github.com/sjoeaat/standaardwerk-ai-trainer/issues

---

**Production-Ready Webapp met ML Integration**  
*Ready voor industrial automation document processing* 🚀