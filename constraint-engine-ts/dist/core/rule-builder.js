"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationHelpers = exports.ConstraintRuleBuilder = void 0;
exports.createRule = createRule;
/**
 * Fluent API for building constraint rules
 * Provides Ruby-like expressiveness in TypeScript
 */
class ConstraintRuleBuilder {
    constructor() {
        this.rule = {
            filePatterns: [],
            excludePatterns: [],
            tags: []
        };
    }
    id(id) {
        this.rule.id = id;
        return this;
    }
    name(name) {
        this.rule.name = name;
        return this;
    }
    description(description) {
        this.rule.description = description;
        return this;
    }
    severity(severity) {
        this.rule.severity = severity;
        return this;
    }
    category(category) {
        this.rule.category = category;
        return this;
    }
    tags(...tags) {
        this.rule.tags = [...(this.rule.tags || []), ...tags];
        return this;
    }
    filePattern(pattern) {
        this.rule.filePatterns = [...(this.rule.filePatterns || []), pattern];
        return this;
    }
    excludePattern(pattern) {
        this.rule.excludePatterns = [...(this.rule.excludePatterns || []), pattern];
        return this;
    }
    validate(validator) {
        this.rule.validate = validator;
        // Validate required fields
        if (!this.rule.id)
            throw new Error('Rule ID is required');
        if (!this.rule.name)
            throw new Error('Rule name is required');
        if (!this.rule.description)
            throw new Error('Rule description is required');
        if (!this.rule.severity)
            this.rule.severity = 'warning';
        if (!this.rule.category)
            this.rule.category = 'general';
        if (!this.rule.filePatterns?.length) {
            this.rule.filePatterns = [/.*/]; // Match all files by default
        }
        return this.rule;
    }
}
exports.ConstraintRuleBuilder = ConstraintRuleBuilder;
/**
 * Factory function for creating rules with fluent API
 */
function createRule() {
    return new ConstraintRuleBuilder();
}
/**
 * Helper functions for common validation patterns
 */
class ValidationHelpers {
    /**
     * Check if content contains a pattern
     */
    static contains(content, pattern) {
        if (typeof pattern === 'string') {
            return content.includes(pattern);
        }
        return pattern.test(content);
    }
    /**
     * Find all matches of a pattern with line numbers
     */
    static findMatches(content, pattern) {
        const lines = content.split('\n');
        const matches = [];
        lines.forEach((line, lineIndex) => {
            const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
            let match;
            while ((match = globalPattern.exec(line)) !== null) {
                matches.push({
                    match: match[0],
                    line: lineIndex + 1,
                    column: match.index + 1
                });
            }
        });
        return matches;
    }
    /**
     * Check if file matches any of the patterns
     */
    static matchesAnyPattern(filePath, patterns) {
        return patterns.some(pattern => pattern.test(filePath));
    }
    /**
     * Extract class names from TypeScript content
     */
    static extractClasses(content) {
        const classPattern = /class\s+(\w+)/g;
        const classes = [];
        let match;
        while ((match = classPattern.exec(content)) !== null) {
            classes.push(match[1]);
        }
        return classes;
    }
    /**
     * Extract method names from TypeScript content
     */
    static extractMethods(content) {
        const methodPattern = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g;
        const methods = [];
        let match;
        while ((match = methodPattern.exec(content)) !== null) {
            methods.push(match[1]);
        }
        return methods;
    }
    /**
     * Extract import statements
     */
    static extractImports(content) {
        const importPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        const imports = [];
        let match;
        while ((match = importPattern.exec(content)) !== null) {
            imports.push(match[1]);
        }
        return imports;
    }
    /**
     * Check if content has a specific decorator
     */
    static hasDecorator(content, decoratorName) {
        const decoratorPattern = new RegExp(`@${decoratorName}\\s*\\(`);
        return decoratorPattern.test(content);
    }
    /**
     * Check if content has a specific interface
     */
    static hasInterface(content, interfaceName) {
        const interfacePattern = new RegExp(`interface\\s+${interfaceName}`);
        return interfacePattern.test(content);
    }
    /**
     * Create violation with context
     */
    static createViolation(ruleId, severity, message, context, options) {
        return {
            ruleId,
            severity,
            message,
            file: context.file,
            suggestion: options?.suggestion,
            line: options?.line,
            column: options?.column,
            source: options?.source
        };
    }
}
exports.ValidationHelpers = ValidationHelpers;
//# sourceMappingURL=rule-builder.js.map