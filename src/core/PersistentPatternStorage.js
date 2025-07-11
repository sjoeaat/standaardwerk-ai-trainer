// =====================================================================
// src/core/PersistentPatternStorage.js - Persistent Pattern Storage
// =====================================================================
// Implements persistent storage for learned patterns with versioning,
// rollback capabilities, and intelligent pattern merging for continuous
// improvement of the Standaardwerk AI Trainer
// =====================================================================

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export class PersistentPatternStorage {
  constructor(storagePath = './pattern-storage') {
    this.storagePath = storagePath;
    this.currentVersion = 1;
    this.patterns = {
      stepPatterns: [],
      conditionPatterns: [],
      variablePatterns: [],
      crossReferencePatterns: [],
      zeitPatterns: [],
      technicalStatusPatterns: [],
      industrialPatterns: []
    };
    this.metadata = {
      version: this.currentVersion,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      totalTrainingSessions: 0,
      totalDocumentsProcessed: 0,
      accuracy: {
        stepDetection: 0,
        variableDetection: 0,
        conditionDetection: 0,
        overallAccuracy: 0
      },
      improvements: []
    };
    
    this.ensureStorageDirectory();
    this.loadExistingPatterns();
  }

  /**
   * Ensure storage directory exists
   */
  ensureStorageDirectory() {
    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }
    
    // Create subdirectories
    const subdirs = ['versions', 'backups', 'exports', 'analytics'];
    subdirs.forEach(subdir => {
      const subdirPath = join(this.storagePath, subdir);
      if (!existsSync(subdirPath)) {
        mkdirSync(subdirPath, { recursive: true });
      }
    });
  }

  /**
   * Load existing patterns from storage
   */
  loadExistingPatterns() {
    const patternsFile = join(this.storagePath, 'patterns.json');
    const metadataFile = join(this.storagePath, 'metadata.json');
    
    if (existsSync(patternsFile)) {
      try {
        const data = JSON.parse(readFileSync(patternsFile, 'utf8'));
        this.patterns = { ...this.patterns, ...data };
        console.log('✅ Loaded existing patterns from storage');
      } catch (error) {
        console.warn('⚠️ Failed to load existing patterns:', error.message);
      }
    }
    
    if (existsSync(metadataFile)) {
      try {
        const data = JSON.parse(readFileSync(metadataFile, 'utf8'));
        this.metadata = { ...this.metadata, ...data };
        this.currentVersion = this.metadata.version || 1;
        console.log(`✅ Loaded metadata (version ${this.currentVersion})`);
      } catch (error) {
        console.warn('⚠️ Failed to load metadata:', error.message);
      }
    }
  }

  /**
   * Save patterns to persistent storage
   */
  savePatterns() {
    // Update metadata
    this.metadata.lastUpdated = new Date().toISOString();
    this.metadata.version = this.currentVersion;
    
    // Save patterns
    const patternsFile = join(this.storagePath, 'patterns.json');
    const metadataFile = join(this.storagePath, 'metadata.json');
    
    writeFileSync(patternsFile, JSON.stringify(this.patterns, null, 2));
    writeFileSync(metadataFile, JSON.stringify(this.metadata, null, 2));
    
    // Create versioned backup
    this.createVersionedBackup();
    
    console.log(`💾 Patterns saved to persistent storage (version ${this.currentVersion})`);
  }

  /**
   * Add new patterns from training
   */
  addPatternsFromTraining(newPatterns, trainingMetrics) {
    console.log('📚 Adding new patterns from training...');
    
    let totalAdded = 0;
    let totalMerged = 0;
    
    Object.entries(newPatterns).forEach(([category, patterns]) => {
      if (this.patterns[category] && Array.isArray(patterns)) {
        patterns.forEach(pattern => {
          const result = this.addPattern(category, pattern);
          if (result.added) totalAdded++;
          if (result.merged) totalMerged++;
        });
      }
    });
    
    // Update training metadata
    this.metadata.totalTrainingSessions++;
    this.metadata.totalDocumentsProcessed += trainingMetrics?.totalFiles || 0;
    
    // Record improvement
    this.metadata.improvements.push({
      timestamp: new Date().toISOString(),
      patternsAdded: totalAdded,
      patternsMerged: totalMerged,
      trainingMetrics: trainingMetrics
    });
    
    console.log(`📊 Added ${totalAdded} new patterns, merged ${totalMerged} existing patterns`);
    
    this.savePatterns();
    
    return { totalAdded, totalMerged };
  }

  /**
   * Add individual pattern with intelligent merging
   */
  addPattern(category, newPattern) {
    if (!this.patterns[category]) {
      this.patterns[category] = [];
    }
    
    // Check for existing similar patterns
    const existingPattern = this.findSimilarPattern(category, newPattern);
    
    if (existingPattern) {
      // Merge with existing pattern
      const merged = this.mergePatterns(existingPattern, newPattern);
      const index = this.patterns[category].indexOf(existingPattern);
      this.patterns[category][index] = merged;
      
      return { added: false, merged: true, pattern: merged };
    } else {
      // Add as new pattern
      const enhancedPattern = this.enhancePattern(newPattern);
      this.patterns[category].push(enhancedPattern);
      
      return { added: true, merged: false, pattern: enhancedPattern };
    }
  }

  /**
   * Find similar existing pattern
   */
  findSimilarPattern(category, newPattern) {
    return this.patterns[category].find(existing => 
      this.patternsAreSimilar(existing, newPattern)
    );
  }

  /**
   * Check if two patterns are similar
   */
  patternsAreSimilar(pattern1, pattern2) {
    // Check regex similarity
    if (pattern1.pattern && pattern2.pattern) {
      const regex1 = pattern1.pattern.replace(/[\\\\]/g, '\\');
      const regex2 = pattern2.pattern.replace(/[\\\\]/g, '\\');
      
      if (regex1 === regex2) return true;
    }
    
    // Check description similarity
    if (pattern1.description && pattern2.description) {
      const desc1 = pattern1.description.toLowerCase();
      const desc2 = pattern2.description.toLowerCase();
      
      if (desc1.includes(desc2) || desc2.includes(desc1)) return true;
    }
    
    // Check example similarity
    if (pattern1.examples && pattern2.examples) {
      const examples1 = pattern1.examples.map(e => e.toLowerCase());
      const examples2 = pattern2.examples.map(e => e.toLowerCase());
      
      const commonExamples = examples1.filter(e => examples2.includes(e));
      if (commonExamples.length > 0) return true;
    }
    
    return false;
  }

  /**
   * Merge two similar patterns
   */
  mergePatterns(existing, newPattern) {
    const merged = { ...existing };
    
    // Merge confidence (weighted average)
    const existingWeight = existing.frequency || existing.examples?.length || 1;
    const newWeight = newPattern.frequency || newPattern.examples?.length || 1;
    const totalWeight = existingWeight + newWeight;
    
    merged.confidence = (
      (existing.confidence * existingWeight) + 
      (newPattern.confidence * newWeight)
    ) / totalWeight;
    
    // Merge frequency
    merged.frequency = (existing.frequency || 0) + (newPattern.frequency || 0);
    
    // Merge examples (unique)
    if (existing.examples && newPattern.examples) {
      const allExamples = [...existing.examples, ...newPattern.examples];
      merged.examples = [...new Set(allExamples)].slice(0, 10); // Keep top 10
    }
    
    // Update description if new one is more descriptive
    if (newPattern.description && newPattern.description.length > (existing.description?.length || 0)) {
      merged.description = newPattern.description;
    }
    
    // Update metadata
    merged.lastUpdated = new Date().toISOString();
    merged.mergeCount = (existing.mergeCount || 0) + 1;
    
    return merged;
  }

  /**
   * Enhance pattern with metadata
   */
  enhancePattern(pattern) {
    return {
      ...pattern,
      id: this.generatePatternId(),
      addedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      mergeCount: 0,
      usageCount: 0,
      accuracy: pattern.confidence || 0
    };
  }

  /**
   * Generate unique pattern ID
   */
  generatePatternId() {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create versioned backup
   */
  createVersionedBackup() {
    const versionDir = join(this.storagePath, 'versions', `v${this.currentVersion}`);
    
    if (!existsSync(versionDir)) {
      mkdirSync(versionDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(versionDir, `patterns_${timestamp}.json`);
    const metadataBackupFile = join(versionDir, `metadata_${timestamp}.json`);
    
    writeFileSync(backupFile, JSON.stringify(this.patterns, null, 2));
    writeFileSync(metadataBackupFile, JSON.stringify(this.metadata, null, 2));
  }

  /**
   * Export patterns for syntax rules
   */
  exportForSyntaxRules() {
    const exported = {
      stepPatterns: this.patterns.stepPatterns.map(this.patternToSyntaxRule),
      conditionPatterns: this.patterns.conditionPatterns.map(this.patternToSyntaxRule),
      variablePatterns: this.patterns.variablePatterns.map(this.patternToSyntaxRule),
      crossReferencePatterns: this.patterns.crossReferencePatterns.map(this.patternToSyntaxRule),
      zeitPatterns: this.patterns.zeitPatterns.map(this.patternToSyntaxRule),
      technicalStatusPatterns: this.patterns.technicalStatusPatterns.map(this.patternToSyntaxRule),
      industrialPatterns: this.patterns.industrialPatterns.map(this.patternToSyntaxRule)
    };
    
    // Save export
    const exportFile = join(this.storagePath, 'exports', `syntax-rules-${Date.now()}.json`);
    writeFileSync(exportFile, JSON.stringify(exported, null, 2));
    
    return exported;
  }

  /**
   * Convert pattern to syntax rule format
   */
  patternToSyntaxRule(pattern) {
    return {
      pattern: new RegExp(pattern.pattern, 'i'),
      description: pattern.description,
      confidence: pattern.confidence,
      examples: pattern.examples?.slice(0, 3) || []
    };
  }

  /**
   * Get pattern statistics
   */
  getStatistics() {
    const stats = {
      totalPatterns: 0,
      patternsByCategory: {},
      averageConfidence: 0,
      totalTrainingSessions: this.metadata.totalTrainingSessions,
      totalDocumentsProcessed: this.metadata.totalDocumentsProcessed,
      recentImprovements: this.metadata.improvements.slice(-5)
    };
    
    let totalConfidence = 0;
    
    Object.entries(this.patterns).forEach(([category, patterns]) => {
      stats.patternsByCategory[category] = patterns.length;
      stats.totalPatterns += patterns.length;
      
      patterns.forEach(pattern => {
        totalConfidence += pattern.confidence || 0;
      });
    });
    
    stats.averageConfidence = stats.totalPatterns > 0 ? 
      totalConfidence / stats.totalPatterns : 0;
    
    return stats;
  }

  /**
   * Get high-confidence patterns
   */
  getHighConfidencePatterns(minConfidence = 0.8) {
    const highConfidence = {};
    
    Object.entries(this.patterns).forEach(([category, patterns]) => {
      highConfidence[category] = patterns.filter(p => 
        (p.confidence || 0) >= minConfidence
      );
    });
    
    return highConfidence;
  }

  /**
   * Increment version
   */
  incrementVersion() {
    this.currentVersion++;
    this.metadata.version = this.currentVersion;
    console.log(`📈 Incremented to version ${this.currentVersion}`);
  }

  /**
   * Rollback to previous version
   */
  rollbackToVersion(version) {
    const versionDir = join(this.storagePath, 'versions', `v${version}`);
    
    if (!existsSync(versionDir)) {
      throw new Error(`Version ${version} not found`);
    }
    
    // Find the latest backup in that version
    const files = require('fs').readdirSync(versionDir);
    const patternFiles = files.filter(f => f.startsWith('patterns_'));
    
    if (patternFiles.length === 0) {
      throw new Error(`No pattern files found for version ${version}`);
    }
    
    const latestFile = patternFiles.sort().pop();
    const patternFile = join(versionDir, latestFile);
    
    // Load patterns from backup
    const backupPatterns = JSON.parse(readFileSync(patternFile, 'utf8'));
    this.patterns = backupPatterns;
    this.currentVersion = version;
    
    this.savePatterns();
    console.log(`↩️ Rolled back to version ${version}`);
  }
}

export default PersistentPatternStorage;