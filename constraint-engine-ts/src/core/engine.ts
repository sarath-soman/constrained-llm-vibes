import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { 
  ConstraintRule, 
  ValidationResult, 
  EngineOptions, 
  EngineStats,
  Violation,
  PluginValidationContext
} from './types';
import { ValidationHelpers } from './rule-builder';

/**
 * Main constraint engine for validating code against architectural rules
 */
export class ConstraintEngine {
  private rules: ConstraintRule[] = [];
  private options: EngineOptions;
  private stats: EngineStats = {
    filesProcessed: 0,
    rulesExecuted: 0,
    totalViolations: 0,
    violationsBySeverity: {},
    executionTime: 0,
    averageFileTime: 0
  };

  constructor(options: EngineOptions) {
    this.options = {
      maxConcurrency: 10,
      enableCache: true,
      verbose: false,
      ...options
    };
  }

  /**
   * Add a constraint rule to the engine
   */
  addRule(rule: ConstraintRule): void {
    this.rules.push(rule);
  }

  /**
   * Add multiple rules at once
   */
  addRules(rules: ConstraintRule[]): void {
    this.rules.push(...rules);
  }

  /**
   * Remove a rule by ID
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Get all rules
   */
  getRules(): ConstraintRule[] {
    return [...this.rules];
  }

  /**
   * Validate a single file
   */
  async validateFile(filePath: string): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const context = this.createValidationContext(filePath, content);
      
      const violations: Violation[] = [];
      
      for (const rule of this.rules) {
        if (this.shouldApplyRule(rule, filePath)) {
          try {
            const ruleViolations = rule.validate(context);
            violations.push(...ruleViolations);
            this.stats.rulesExecuted++;
          } catch (error) {
            if (this.options.verbose) {
              console.warn(`Rule ${rule.id} failed for ${filePath}:`, error);
            }
          }
        }
      }

      const executionTime = Date.now() - startTime;
      this.updateStats(violations, executionTime);

      return {
        file: filePath,
        violations,
        isValid: violations.filter(v => v.severity === 'error').length === 0,
        executionTime
      };
    } catch (error) {
      return {
        file: filePath,
        violations: [{
          ruleId: 'file-read-error',
          severity: 'error',
          message: `Failed to read file: ${(error as Error).message}`,
          file: filePath
        }],
        isValid: false,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Validate multiple files
   */
  async validateFiles(patterns: string[]): Promise<ValidationResult[]> {
    const startTime = Date.now();
    this.resetStats();

    const files = await this.findFiles(patterns);
    
    if (this.options.verbose) {
      console.log(`Found ${files.length} files to validate`);
    }

    const results: ValidationResult[] = [];
    
    // Process files in batches to avoid overwhelming the system
    const batchSize = this.options.maxConcurrency || 10;
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(file => this.validateFile(file))
      );
      results.push(...batchResults);
    }

    this.stats.executionTime = Date.now() - startTime;
    this.stats.averageFileTime = this.stats.executionTime / files.length;

    return results;
  }

  /**
   * Validate entire project
   */
  async validateProject(patterns?: string[]): Promise<ValidationResult[]> {
    const defaultPatterns = [
      '**/*.ts',
      '**/*.js',
      '**/*.tsx',
      '**/*.jsx'
    ];

    const searchPatterns = patterns || defaultPatterns;
    return this.validateFiles(searchPatterns);
  }

  /**
   * Get engine statistics
   */
  getStats(): EngineStats {
    return { ...this.stats };
  }

  /**
   * Print validation results
   */
  printResults(results: ValidationResult[], options?: { 
    showStats?: boolean; 
    groupBySeverity?: boolean;
    showSuggestions?: boolean;
  }): void {
    const opts = {
      showStats: true,
      groupBySeverity: true,
      showSuggestions: true,
      ...options
    };

    const allViolations = results.flatMap(r => r.violations);
    const errorCount = allViolations.filter(v => v.severity === 'error').length;
    const warningCount = allViolations.filter(v => v.severity === 'warning').length;
    const infoCount = allViolations.filter(v => v.severity === 'info').length;

    console.log('\n🔍 Constraint Validation Results');
    console.log('================================');

    if (allViolations.length === 0) {
      console.log('✅ No violations found! All files pass architectural constraints.');
      return;
    }

    if (opts.groupBySeverity) {
      if (errorCount > 0) {
        console.log(`\n❌ ERRORS (${errorCount}):`);
        this.printViolations(allViolations.filter(v => v.severity === 'error'), opts.showSuggestions);
      }

      if (warningCount > 0) {
        console.log(`\n⚠️  WARNINGS (${warningCount}):`);
        this.printViolations(allViolations.filter(v => v.severity === 'warning'), opts.showSuggestions);
      }

      if (infoCount > 0) {
        console.log(`\nℹ️  INFO (${infoCount}):`);
        this.printViolations(allViolations.filter(v => v.severity === 'info'), opts.showSuggestions);
      }
    } else {
      results.forEach(result => {
        if (result.violations.length > 0) {
          console.log(`\n📄 ${result.file}:`);
          this.printViolations(result.violations, opts.showSuggestions);
        }
      });
    }

    if (opts.showStats) {
      console.log('\n📊 Summary:');
      console.log(`   Files processed: ${this.stats.filesProcessed}`);
      console.log(`   Total violations: ${allViolations.length}`);
      console.log(`   Errors: ${errorCount}, Warnings: ${warningCount}, Info: ${infoCount}`);
      console.log(`   Execution time: ${this.stats.executionTime}ms`);
    }
  }

  private printViolations(violations: Violation[], showSuggestions: boolean): void {
    violations.forEach(violation => {
      const location = violation.line ? `:${violation.line}` : '';
      console.log(`   ${path.basename(violation.file)}${location} - ${violation.message}`);
      console.log(`     Rule: ${violation.ruleId}`);
      
      if (showSuggestions && violation.suggestion) {
        console.log(`     💡 ${violation.suggestion}`);
      }
    });
  }

  private createValidationContext(filePath: string, content: string): PluginValidationContext {
    const language = this.detectLanguage(filePath);
    
    const context: PluginValidationContext = {
      file: path.basename(filePath),
      content,
      filePath,
      projectRoot: this.options.projectRoot,
      language,
      hasClass: (pattern) => {
        const classes = ValidationHelpers.extractClasses(content);
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        return classes.some(cls => regex.test(cls));
      },
      hasMethod: (pattern) => {
        const methods = ValidationHelpers.extractMethods(content);
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        return methods.some(method => regex.test(method));
      },
      hasImport: (pattern) => {
        const imports = ValidationHelpers.extractImports(content);
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        return imports.some(imp => regex.test(imp));
      },
      hasDecorator: (pattern) => {
        const decoratorName = typeof pattern === 'string' ? pattern : pattern.source;
        return ValidationHelpers.hasDecorator(content, decoratorName);
      },
      hasInterface: (pattern) => {
        const interfaceName = typeof pattern === 'string' ? pattern : pattern.source;
        return ValidationHelpers.hasInterface(content, interfaceName);
      },
      getClasses: () => ValidationHelpers.extractClasses(content),
      getMethods: () => ValidationHelpers.extractMethods(content),
      getImports: () => ValidationHelpers.extractImports(content)
    };

    return context;
  }

  private shouldApplyRule(rule: ConstraintRule, filePath: string): boolean {
    // Check exclude patterns first
    if (rule.excludePatterns?.length && 
        ValidationHelpers.matchesAnyPattern(filePath, rule.excludePatterns)) {
      return false;
    }

    // Check include patterns
    if (rule.filePatterns?.length) {
      return ValidationHelpers.matchesAnyPattern(filePath, rule.filePatterns);
    }

    return true;
  }

  private async findFiles(patterns: string[]): Promise<string[]> {
    const allFiles: string[] = [];
    
    for (const pattern of patterns) {
      const files = await glob(pattern, {
        cwd: this.options.projectRoot,
        ignore: this.options.excludePatterns?.map(p => p.source) || [
          '**/node_modules/**',
          '**/dist/**',
          '**/*.d.ts'
        ]
      });
      
      allFiles.push(...files.map(f => path.resolve(this.options.projectRoot, f)));
    }

    return [...new Set(allFiles)]; // Remove duplicates
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.rb': 'ruby',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust'
    };

    return languageMap[ext] || 'unknown';
  }

  private updateStats(violations: Violation[], _executionTime: number): void {
    this.stats.filesProcessed++;
    this.stats.totalViolations += violations.length;
    
    violations.forEach(violation => {
      this.stats.violationsBySeverity[violation.severity] = 
        (this.stats.violationsBySeverity[violation.severity] || 0) + 1;
    });
  }

  private resetStats(): void {
    this.stats = {
      filesProcessed: 0,
      rulesExecuted: 0,
      totalViolations: 0,
      violationsBySeverity: {},
      executionTime: 0,
      averageFileTime: 0
    };
  }
}