import { ConstraintRule, ValidationResult, EngineOptions, EngineStats } from './types';
/**
 * Main constraint engine for validating code against architectural rules
 */
export declare class ConstraintEngine {
    private rules;
    private options;
    private stats;
    constructor(options: EngineOptions);
    /**
     * Add a constraint rule to the engine
     */
    addRule(rule: ConstraintRule): void;
    /**
     * Add multiple rules at once
     */
    addRules(rules: ConstraintRule[]): void;
    /**
     * Remove a rule by ID
     */
    removeRule(ruleId: string): void;
    /**
     * Get all rules
     */
    getRules(): ConstraintRule[];
    /**
     * Validate a single file
     */
    validateFile(filePath: string): Promise<ValidationResult>;
    /**
     * Validate multiple files
     */
    validateFiles(patterns: string[]): Promise<ValidationResult[]>;
    /**
     * Validate entire project
     */
    validateProject(patterns?: string[]): Promise<ValidationResult[]>;
    /**
     * Get engine statistics
     */
    getStats(): EngineStats;
    /**
     * Print validation results
     */
    printResults(results: ValidationResult[], options?: {
        showStats?: boolean;
        groupBySeverity?: boolean;
        showSuggestions?: boolean;
    }): void;
    private printViolations;
    private createValidationContext;
    private shouldApplyRule;
    private findFiles;
    private detectLanguage;
    private updateStats;
    private resetStats;
}
//# sourceMappingURL=engine.d.ts.map