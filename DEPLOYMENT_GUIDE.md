# 🚀 Standaardwerk AI Trainer - Deployment Guide

## 📋 **Quick Start**

### **1. Single Document Processing**
```bash
# Parse a Word document
node cli-parser.js parse "./path/to/document.docx"

# Parse a text file  
node cli-parser.js parse "./path/to/document.txt"

# Specify output directory
node cli-parser.js parse "./document.docx" "./custom-output"
```

### **2. Mass Training**
```bash
# Train on directory of documents
node cli-parser.js auto-train "./training-data" "./results" 10 0.8

# Parameters:
# - "./training-data": Input directory with .docx files
# - "./results": Output directory for results
# - 10: Maximum iterations
# - 0.8: Minimum confidence threshold
```

### **3. Testing & Validation**
```bash
# Test with validation documents
node cli-parser.js parse "./validation/new-document.docx"

# Review results
cat ./output/new-document.json
cat ./output/metrics.json
```

---

## ⚙️ **Advanced Configuration**

### **AutoTrainer Options**
```javascript
const options = {
  maxIterations: 10,           // Maximum training iterations
  minConfidence: 0.8,          // Minimum pattern confidence
  convergenceThreshold: 0.05,  // Convergence detection threshold
  persistentStorage: true,     // Enable persistent pattern storage
  backupOriginalRules: true    // Backup original rules before training
};
```

### **Pattern Storage Configuration**
```javascript
// Default storage location
const storagePath = './pattern-storage';

// Custom storage location
const customStorage = new PersistentPatternStorage('./custom/path');
```

---

## 📊 **Output Files**

### **Generated Files per Document**
```
output/
├── document.json              # Structured program data
├── document.xml               # TIA Portal compatible XML
├── log.txt                    # Processing log
├── metrics.json               # Performance metrics
└── suggestions.json           # Pattern improvement suggestions
```

### **Training Results**
```
training-results/
├── training-report.json       # Comprehensive training report
├── optimized-syntax-rules.json # Optimized parsing rules
├── original-rules/            # Backup of original rules
├── iteration-1/               # Per-iteration results
├── iteration-2/
└── ...
```

### **Persistent Storage**
```
pattern-storage/
├── patterns.json              # Learned patterns
├── metadata.json              # Training statistics
├── versions/v1/               # Versioned backups
├── exports/                   # Exported rules
└── analytics/                 # Performance analytics
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **"File not found" Error**
```bash
# Ensure file path is correct
ls -la "./path/to/document.docx"

# Use absolute paths if needed
node cli-parser.js parse "/full/path/to/document.docx"
```

#### **Memory Issues with Large Documents**
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 cli-parser.js parse "./large-document.docx"
```

#### **Permission Errors**
```bash
# Ensure output directory is writable
chmod 755 ./output

# Create output directory if it doesn't exist
mkdir -p ./output
```

### **Performance Optimization**

#### **For Large Document Collections**
```bash
# Process documents in batches
node cli-parser.js auto-train "./batch1" "./results1" 5 0.8
node cli-parser.js auto-train "./batch2" "./results2" 5 0.8
```

#### **For Faster Processing**
```javascript
// Reduce max iterations for faster training
const quickOptions = {
  maxIterations: 3,
  minConfidence: 0.7,
  convergenceThreshold: 0.1
};
```

---

## 📈 **Monitoring & Maintenance**

### **Pattern Storage Health**
```bash
# Check pattern statistics
cat pattern-storage/metadata.json | jq '.improvements'

# View current patterns
cat pattern-storage/patterns.json | jq '.stepPatterns | length'
```

### **Performance Monitoring**
```bash
# Monitor processing metrics
tail -f output/log.txt

# Check error rates
jq '.validation.summary.errorCount' output/*.json
```

### **Pattern Storage Maintenance**
```javascript
// Roll back to previous version if needed
const storage = new PersistentPatternStorage();
storage.rollbackToVersion(1);

// Export current patterns
const exportedRules = storage.exportForSyntaxRules();
```

---

## 🔄 **Integration Examples**

### **Integration with Node.js Application**
```javascript
import { CLIParser } from './cli-parser.js';

const parser = new CLIParser('flexible');

async function processDocument(filePath) {
  await parser.parseFile(filePath, './output');
  return parser.metrics;
}

// Usage
const metrics = await processDocument('./document.docx');
console.log(`Processed ${metrics.totalSteps} steps`);
```

### **Batch Processing Script**
```javascript
import { readdirSync } from 'fs';
import { extname } from 'path';

async function processBatch(inputDir, outputDir) {
  const files = readdirSync(inputDir)
    .filter(f => extname(f) === '.docx');
    
  for (const file of files) {
    console.log(`Processing ${file}...`);
    await parser.parseFile(`${inputDir}/${file}`, outputDir);
  }
}
```

### **Web API Integration**
```javascript
import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/parse', upload.single('document'), async (req, res) => {
  try {
    await parser.parseFile(req.file.path, './temp-output');
    res.json({ success: true, metrics: parser.metrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🛡️ **Security Considerations**

### **File Validation**
```javascript
// Validate file extensions
const allowedExtensions = ['.docx', '.txt', '.md'];
const isValidFile = allowedExtensions.includes(extname(filePath));

// Validate file size
const maxSize = 50 * 1024 * 1024; // 50MB
const stats = statSync(filePath);
const isValidSize = stats.size <= maxSize;
```

### **Input Sanitization**
```javascript
// Sanitize file paths
const safePath = path.resolve(path.normalize(userInput));
const isInAllowedDir = safePath.startsWith(allowedDirectory);
```

### **Output Security**
```javascript
// Ensure output directory is safe
const safeOutputDir = path.resolve('./safe-output');
if (!outputDir.startsWith(safeOutputDir)) {
  throw new Error('Invalid output directory');
}
```

---

## 📚 **API Reference**

### **CLI Commands**
```bash
# Parse command
node cli-parser.js parse <input> [output]

# Auto-train command  
node cli-parser.js auto-train <input> [output] [iterations] [confidence]

# Validate command
node cli-parser.js validate [config] [testdir]

# Test command
node cli-parser.js test [testfile]
```

### **AutoTrainer Methods**
```javascript
const trainer = new AutoTrainer(parser, options);

// Start training
const result = await trainer.startTraining(inputFiles, outputDir);

// Get pattern statistics
const stats = trainer.getPatternStatistics();

// Reset training state
trainer.reset();
```

### **Pattern Storage Methods**
```javascript
const storage = new PersistentPatternStorage(storagePath);

// Add patterns from training
storage.addPatternsFromTraining(patterns, metrics);

// Export for syntax rules
const rules = storage.exportForSyntaxRules();

// Get statistics
const stats = storage.getStatistics();

// Rollback to version
storage.rollbackToVersion(versionNumber);
```

---

## 🎯 **Best Practices**

### **1. Training Strategy**
- Start with a diverse set of representative documents
- Use iterative training with 5-10 iterations maximum
- Monitor convergence to avoid overtraining
- Validate on unseen documents regularly

### **2. Pattern Management**
- Regular backup of pattern storage
- Monitor pattern quality through confidence scores
- Clean up low-confidence patterns periodically
- Version control for pattern storage

### **3. Performance Optimization**
- Process documents in batches for large collections
- Use appropriate confidence thresholds (0.7-0.9)
- Monitor memory usage for very large documents
- Cache frequently used patterns

### **4. Quality Assurance**
- Validate results on known-good documents
- Monitor error rates and unknown pattern counts
- Review suggestions for pattern improvements
- Test with documents from different sources

---

## 📞 **Support & Troubleshooting**

### **Log Analysis**
```bash
# Check processing logs
tail -f output/log.txt

# Analyze error patterns
grep "ERROR" output/log.txt

# Monitor performance
grep "Processing time" output/log.txt
```

### **Debug Mode**
```javascript
// Enable debug logging
const parser = new CLIParser('flexible');
parser.debugMode = true;
```

### **Common Solutions**
1. **Slow processing**: Reduce max iterations or increase convergence threshold
2. **High memory usage**: Process documents in smaller batches
3. **Low accuracy**: Add more diverse training documents
4. **Pattern conflicts**: Review and clean pattern storage

---

*Deployment Guide for Standaardwerk AI Trainer*  
*Version: Production-Ready v1.0*  
*Last Updated: 2025-07-11*