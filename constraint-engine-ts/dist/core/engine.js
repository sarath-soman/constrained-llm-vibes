"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConstraintEngine = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
const rule_builder_1 = require("./rule-builder");
/**
 * Main constraint engine for validating code against architectural rules
 */
class ConstraintEngine {
    constructor(options) {
        this.rules = [];
        this.stats = {
            filesProcessed: 0,
            rulesExecuted: 0,
            totalViolations: 0,
            violationsBySeverity: {},
            executionTime: 0,
            averageFileTime: 0
        };
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
    addRule(rule) {
        this.rules.push(rule);
    }
    /**
     * Add multiple rules at once
     */
    addRules(rules) {
        this.rules.push(...rules);
    }
    /**
     * Remove a rule by ID
     */
    removeRule(ruleId) {
        this.rules = this.rules.filter(rule => rule.id !== ruleId);
    }
    /**
     * Get all rules
     */
    getRules() {
        return [...this.rules];
    }
    /**
     * Validate a single file
     */
    async validateFile(filePath) {
        const startTime = Date.now();
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const context = this.createValidationContext(filePath, content);
            const violations = [];
            for (const rule of this.rules) {
                if (this.shouldApplyRule(rule, filePath)) {
                    try {
                        const ruleViolations = rule.validate(context);
                        violations.push(...ruleViolations);
                        this.stats.rulesExecuted++;
                    }
                    catch (error) {
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
        }
        catch (error) {
            return {
                file: filePath,
                violations: [{
                        ruleId: 'file-read-error',
                        severity: 'error',
                        message: `Failed to read file: ${error.message}`,
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
    async validateFiles(patterns) {
        const startTime = Date.now();
        this.resetStats();
        const files = await this.findFiles(patterns);
        if (this.options.verbose) {
            console.log(`Found ${files.length} files to validate`);
        }
        const results = [];
        // Process files in batches to avoid overwhelming the system
        const batchSize = this.options.maxConcurrency || 10;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(file => this.validateFile(file)));
            results.push(...batchResults);
        }
        this.stats.executionTime = Date.now() - startTime;
        this.stats.averageFileTime = this.stats.executionTime / files.length;
        return results;
    }
    /**
     * Validate entire project
     */
    async validateProject(patterns) {
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
    getStats() {
        return { ...this.stats };
    }
    /**
     * Print validation results
     */
    printResults(results, options) {
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
        }
        else {
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
    printViolations(violations, showSuggestions) {
        violations.forEach(violation => {
            const location = violation.line ? `:${violation.line}` : '';
            console.log(`   ${path.basename(violation.file)}${location} - ${violation.message}`);
            console.log(`     Rule: ${violation.ruleId}`);
            if (showSuggestions && violation.suggestion) {
                console.log(`     💡 ${violation.suggestion}`);
            }
        });
    }
    createValidationContext(filePath, content) {
        const language = this.detectLanguage(filePath);
        const context = {
            file: path.basename(filePath),
            content,
            filePath,
            projectRoot: this.options.projectRoot,
            language,
            hasClass: (pattern) => {
                const classes = rule_builder_1.ValidationHelpers.extractClasses(content);
                const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
                return classes.some(cls => regex.test(cls));
            },
            hasMethod: (pattern) => {
                const methods = rule_builder_1.ValidationHelpers.extractMethods(content);
                const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
                return methods.some(method => regex.test(method));
            },
            hasImport: (pattern) => {
                const imports = rule_builder_1.ValidationHelpers.extractImports(content);
                const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
                return imports.some(imp => regex.test(imp));
            },
            hasDecorator: (pattern) => {
                const decoratorName = typeof pattern === 'string' ? pattern : pattern.source;
                return rule_builder_1.ValidationHelpers.hasDecorator(content, decoratorName);
            },
            hasInterface: (pattern) => {
                const interfaceName = typeof pattern === 'string' ? pattern : pattern.source;
                return rule_builder_1.ValidationHelpers.hasInterface(content, interfaceName);
            },
            getClasses: () => rule_builder_1.ValidationHelpers.extractClasses(content),
            getMethods: () => rule_builder_1.ValidationHelpers.extractMethods(content),
            getImports: () => rule_builder_1.ValidationHelpers.extractImports(content)
        };
        return context;
    }
    shouldApplyRule(rule, filePath) {
        // Check exclude patterns first
        if (rule.excludePatterns?.length &&
            rule_builder_1.ValidationHelpers.matchesAnyPattern(filePath, rule.excludePatterns)) {
            return false;
        }
        // Check include patterns
        if (rule.filePatterns?.length) {
            return rule_builder_1.ValidationHelpers.matchesAnyPattern(filePath, rule.filePatterns);
        }
        return true;
    }
    async findFiles(patterns) {
        const allFiles = [];
        for (const pattern of patterns) {
            const files = await (0, glob_1.glob)(pattern, {
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
    detectLanguage(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const languageMap = {
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
    updateStats(violations, _executionTime) {
        this.stats.filesProcessed++;
        this.stats.totalViolations += violations.length;
        violations.forEach(violation => {
            this.stats.violationsBySeverity[violation.severity] =
                (this.stats.violationsBySeverity[violation.severity] || 0) + 1;
        });
    }
    resetStats() {
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
exports.ConstraintEngine = ConstraintEngine;
//# sourceMappingURL=engine.js.map