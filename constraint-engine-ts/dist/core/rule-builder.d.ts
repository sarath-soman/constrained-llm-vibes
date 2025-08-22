import { ConstraintRule, RuleBuilder, ValidationContext, PluginValidationContext, Violation } from './types';
/**
 * Fluent API for building constraint rules
 * Provides Ruby-like expressiveness in TypeScript
 */
export declare class ConstraintRuleBuilder implements RuleBuilder {
    private rule;
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
/**
 * Factory function for creating rules with fluent API
 */
export declare function createRule(): RuleBuilder;
/**
 * Helper functions for common validation patterns
 */
export declare class ValidationHelpers {
    /**
     * Check if content contains a pattern
     */
    static contains(content: string, pattern: string | RegExp): boolean;
    /**
     * Find all matches of a pattern with line numbers
     */
    static findMatches(content: string, pattern: RegExp): Array<{
        match: string;
        line: number;
        column: number;
    }>;
    /**
     * Check if file matches any of the patterns
     */
    static matchesAnyPattern(filePath: string, patterns: RegExp[]): boolean;
    /**
     * Extract class names from TypeScript content
     */
    static extractClasses(content: string): string[];
    /**
     * Extract method names from TypeScript content
     */
    static extractMethods(content: string): string[];
    /**
     * Extract import statements
     */
    static extractImports(content: string): string[];
    /**
     * Check if content has a specific decorator
     */
    static hasDecorator(content: string, decoratorName: string): boolean;
    /**
     * Check if content has a specific interface
     */
    static hasInterface(content: string, interfaceName: string): boolean;
    /**
     * Create violation with context
     */
    static createViolation(ruleId: string, severity: 'error' | 'warning' | 'info', message: string, context: ValidationContext, options?: {
        suggestion?: string;
        line?: number;
        column?: number;
        source?: string;
    }): Violation;
}
//# sourceMappingURL=rule-builder.d.ts.map