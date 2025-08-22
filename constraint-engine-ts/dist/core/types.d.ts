/**
 * Core types for the TypeScript constraint engine
 */
export interface Violation {
    ruleId: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestion?: string;
    file: string;
    line?: number;
    column?: number;
    source?: string;
}
export interface ValidationResult {
    file: string;
    violations: Violation[];
    isValid: boolean;
    executionTime: number;
}
export interface ValidationContext {
    file: string;
    content: string;
    filePath: string;
    projectRoot: string;
    language: string;
    metadata?: Record<string, any>;
}
export interface ConstraintRule {
    id: string;
    name: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
    category: string;
    tags: string[];
    filePatterns: RegExp[];
    excludePatterns?: RegExp[];
    validate: (context: ValidationContext | PluginValidationContext) => Violation[];
}
export interface RuleBuilder {
    id(id: string): RuleBuilder;
    name(name: string): RuleBuilder;
    description(description: string): RuleBuilder;
    severity(severity: 'error' | 'warning' | 'info'): RuleBuilder;
    category(category: string): RuleBuilder;
    tags(...tags: string[]): RuleBuilder;
    filePattern(pattern: RegExp): RuleBuilder;
    excludePattern(pattern: RegExp): RuleBuilder;
    validate(validator: (context: ValidationContext | PluginValidationContext) => Violation[]): ConstraintRule;
}
export interface EngineOptions {
    projectRoot: string;
    configFile?: string;
    excludePatterns?: RegExp[];
    includePatterns?: RegExp[];
    maxConcurrency?: number;
    enableCache?: boolean;
    verbose?: boolean;
}
export interface EngineStats {
    filesProcessed: number;
    rulesExecuted: number;
    totalViolations: number;
    violationsBySeverity: Record<string, number>;
    executionTime: number;
    averageFileTime: number;
}
export interface RuleSet {
    name: string;
    version: string;
    description: string;
    rules: ConstraintRule[];
}
/**
 * Plugin architecture specific types
 */
export interface PluginMetadata {
    name: string;
    version: string;
    description: string;
    author: string;
    category: 'business' | 'utility' | 'integration' | 'auth';
    dependencies?: string[];
}
export interface PluginValidationContext extends ValidationContext {
    hasClass: (pattern: string | RegExp) => boolean;
    hasMethod: (pattern: string | RegExp) => boolean;
    hasImport: (pattern: string | RegExp) => boolean;
    hasDecorator: (pattern: string | RegExp) => boolean;
    hasInterface: (pattern: string | RegExp) => boolean;
    getClasses: () => string[];
    getMethods: () => string[];
    getImports: () => string[];
}
//# sourceMappingURL=types.d.ts.map