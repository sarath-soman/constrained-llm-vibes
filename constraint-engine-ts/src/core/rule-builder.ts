import { ConstraintRule, RuleBuilder, ValidationContext, PluginValidationContext, Violation } from './types';

/**
 * Fluent API for building constraint rules
 * Provides Ruby-like expressiveness in TypeScript
 */
export class ConstraintRuleBuilder implements RuleBuilder {
  private rule: Partial<ConstraintRule> = {
    filePatterns: [],
    excludePatterns: [],
    tags: []
  };

  id(id: string): RuleBuilder {
    this.rule.id = id;
    return this;
  }

  name(name: string): RuleBuilder {
    this.rule.name = name;
    return this;
  }

  description(description: string): RuleBuilder {
    this.rule.description = description;
    return this;
  }

  severity(severity: 'error' | 'warning' | 'info'): RuleBuilder {
    this.rule.severity = severity;
    return this;
  }

  category(category: string): RuleBuilder {
    this.rule.category = category;
    return this;
  }

  tags(...tags: string[]): RuleBuilder {
    this.rule.tags = [...(this.rule.tags || []), ...tags];
    return this;
  }

  filePattern(pattern: RegExp): RuleBuilder {
    this.rule.filePatterns = [...(this.rule.filePatterns || []), pattern];
    return this;
  }

  excludePattern(pattern: RegExp): RuleBuilder {
    this.rule.excludePatterns = [...(this.rule.excludePatterns || []), pattern];
    return this;
  }

  validate(validator: (context: ValidationContext | PluginValidationContext) => Violation[]): ConstraintRule {
    this.rule.validate = validator;
    
    // Validate required fields
    if (!this.rule.id) throw new Error('Rule ID is required');
    if (!this.rule.name) throw new Error('Rule name is required');
    if (!this.rule.description) throw new Error('Rule description is required');
    if (!this.rule.severity) this.rule.severity = 'warning';
    if (!this.rule.category) this.rule.category = 'general';
    if (!this.rule.filePatterns?.length) {
      this.rule.filePatterns = [/.*/]; // Match all files by default
    }

    return this.rule as ConstraintRule;
  }
}

/**
 * Factory function for creating rules with fluent API
 */
export function createRule(): RuleBuilder {
  return new ConstraintRuleBuilder();
}

/**
 * Helper functions for common validation patterns
 */
export class ValidationHelpers {
  /**
   * Check if content contains a pattern
   */
  static contains(content: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return content.includes(pattern);
    }
    return pattern.test(content);
  }

  /**
   * Find all matches of a pattern with line numbers
   */
  static findMatches(content: string, pattern: RegExp): Array<{ match: string; line: number; column: number }> {
    const lines = content.split('\n');
    const matches: Array<{ match: string; line: number; column: number }> = [];

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
  static matchesAnyPattern(filePath: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Extract class names from TypeScript content
   */
  static extractClasses(content: string): string[] {
    const classPattern = /class\s+(\w+)/g;
    const classes: string[] = [];
    let match;

    while ((match = classPattern.exec(content)) !== null) {
      classes.push(match[1]);
    }

    return classes;
  }

  /**
   * Extract method names from TypeScript content
   */
  static extractMethods(content: string): string[] {
    const methodPattern = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g;
    const methods: string[] = [];
    let match;

    while ((match = methodPattern.exec(content)) !== null) {
      methods.push(match[1]);
    }

    return methods;
  }

  /**
   * Extract import statements
   */
  static extractImports(content: string): string[] {
    const importPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importPattern.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Check if content has a specific decorator
   */
  static hasDecorator(content: string, decoratorName: string): boolean {
    const decoratorPattern = new RegExp(`@${decoratorName}\\s*\\(`);
    return decoratorPattern.test(content);
  }

  /**
   * Check if content has a specific interface
   */
  static hasInterface(content: string, interfaceName: string): boolean {
    const interfacePattern = new RegExp(`interface\\s+${interfaceName}`);
    return interfacePattern.test(content);
  }

  /**
   * Create violation with context
   */
  static createViolation(
    ruleId: string,
    severity: 'error' | 'warning' | 'info',
    message: string,
    context: ValidationContext,
    options?: {
      suggestion?: string;
      line?: number;
      column?: number;
      source?: string;
    }
  ): Violation {
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