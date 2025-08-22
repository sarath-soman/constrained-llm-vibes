import { ConstraintRule, PluginValidationContext } from '../core/types';
import { createRule, ValidationHelpers } from '../core/rule-builder';

/**
 * NestJS Plugin Architecture Rules
 * Ported from Ruby with TypeScript improvements
 */

/**
 * Core plugin structure rules
 */
export const mustExtendBasePlugin = createRule()
  .id('must-extend-base-plugin')
  .name('Must Extend BaseActionPlugin')
  .description('All plugin classes must extend BaseActionPlugin')
  .severity('error')
  .category('architecture')
  .tags('plugins', 'inheritance')
  .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
  .validate((context) => {
    const pluginContext = context as PluginValidationContext;
    const violations = [];
    const classes = pluginContext.getClasses();
    
    const pluginClasses = classes.filter(cls => cls.endsWith('Plugin'));
    
    for (const pluginClass of pluginClasses) {
      if (!ValidationHelpers.contains(context.content, 'extends BaseActionPlugin')) {
        violations.push(ValidationHelpers.createViolation(
          'must-extend-base-plugin',
          'error',
          `Plugin class '${pluginClass}' must extend BaseActionPlugin`,
          pluginContext,
          { 
            suggestion: 'Add "extends BaseActionPlugin" to your plugin class declaration'
          }
        ));
      }
    }
    
    return violations;
  });

export const mustHaveInjectableDecorator = createRule()
  .id('must-have-injectable-decorator')
  .name('Must Have Injectable Decorator')
  .description('Plugin classes must have @Injectable() decorator')
  .severity('error')
  .category('architecture')
  .tags('plugins', 'decorators', 'nestjs')
  .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
  .validate((context) => {
    const pluginContext = context as PluginValidationContext;
    const violations = [];
    
    if (context.hasClass(/Plugin$/) && !context.hasDecorator('Injectable')) {
      violations.push(ValidationHelpers.createViolation(
        'must-have-injectable-decorator',
        'error',
        'Plugin class must have @Injectable() decorator',
        context,
        { 
          suggestion: 'Add @Injectable() decorator above your plugin class'
        }
      ));
    }
    
    return violations;
  });

export const mustHaveMetadata = createRule()
  .id('must-have-metadata')
  .name('Must Have Metadata Property')
  .description('Plugins must define readonly metadata property')
  .severity('error')
  .category('architecture')
  .tags('plugins', 'metadata')
  .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
  .validate((context) => {
    const pluginContext = context as PluginValidationContext;
    const violations = [];
    
    if (!ValidationHelpers.contains(context.content, 'readonly metadata: PluginMetadata')) {
      violations.push(ValidationHelpers.createViolation(
        'must-have-metadata',
        'error',
        'Plugin must have "readonly metadata: PluginMetadata" property',
        context,
        { 
          suggestion: 'Add: readonly metadata: PluginMetadata = { name: "...", version: "...", ... }'
        }
      ));
    }
    
    // Check required metadata fields
    const requiredFields = ['name', 'version', 'description', 'author', 'category'];
    const missingFields = requiredFields.filter(field => 
      !ValidationHelpers.contains(context.content, `${field}:`)
    );
    
    if (missingFields.length > 0) {
      violations.push(ValidationHelpers.createViolation(
        'must-have-metadata',
        'error',
        `Plugin metadata missing required fields: ${missingFields.join(', ')}`,
        context,
        { 
          suggestion: `Add missing fields to metadata: ${missingFields.join(', ')}`
        }
      ));
    }
    
    return violations;
  });

export const mustHaveSchema = createRule()
  .id('must-have-schema')
  .name('Must Have Schema Property')
  .description('Plugins must define readonly schema property')
  .severity('error')
  .category('architecture')
  .tags('plugins', 'schema')
  .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
  .validate((context) => {
    const pluginContext = context as PluginValidationContext;
    const violations = [];
    
    if (!ValidationHelpers.contains(context.content, 'readonly schema: ActionSchema')) {
      violations.push(ValidationHelpers.createViolation(
        'must-have-schema',
        'error',
        'Plugin must have "readonly schema: ActionSchema" property',
        context,
        { 
          suggestion: 'Add: readonly schema: ActionSchema = { request: RequestType, response: ResponseType }'
        }
      ));
    }
    
    return violations;
  });

export const mustHaveValidationRules = createRule()
  .id('must-have-validation-rules')
  .name('Must Have Validation Rules')
  .description('Plugins must define validation rules')
  .severity('error')
  .category('architecture')
  .tags('plugins', 'validation')
  .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
  .validate((context) => {
    const pluginContext = context as PluginValidationContext;
    const violations = [];
    
    if (!ValidationHelpers.contains(context.content, 'readonly validationRules: ValidationRule[]')) {
      violations.push(ValidationHelpers.createViolation(
        'must-have-validation-rules',
        'error',
        'Plugin must have "readonly validationRules: ValidationRule[]" property',
        context,
        { 
          suggestion: 'Add: readonly validationRules: ValidationRule[] = [...]'
        }
      ));
    }
    
    return violations;
  });

export const mustImplementExecuteMethod = createRule()
  .id('must-implement-execute')
  .name('Must Implement Execute Method')
  .description('Plugins must implement async execute method')
  .severity('error')
  .category('architecture')
  .tags('plugins', 'methods')
  .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
  .validate((context) => {
    const pluginContext = context as PluginValidationContext;
    const violations = [];
    
    if (context.hasClass(/Plugin$/) && !context.hasMethod(/^execute$/)) {
      violations.push(ValidationHelpers.createViolation(
        'must-implement-execute',
        'error',
        'Plugin must implement execute method',
        context,
        { 
          suggestion: 'Add: async execute(input: any): Promise<any> { ... }'
        }
      ));
    }
    
    // Check if execute method is async
    if (ValidationHelpers.contains(context.content, 'execute(') && 
        !ValidationHelpers.contains(context.content, 'async execute(')) {
      violations.push(ValidationHelpers.createViolation(
        'must-implement-execute',
        'error',
        'execute method must be async',
        context,
        { 
          suggestion: 'Add "async" keyword: async execute(input: any): Promise<any>'
        }
      ));
    }
    
    return violations;
  });

export const mustImplementHealthCheck = createRule()
  .id('must-implement-health-check')
  .name('Must Implement Health Check')
  .description('Plugins must implement async healthCheck method')
  .severity('error')
  .category('architecture')
  .tags('plugins', 'methods', 'monitoring')
  .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
  .validate((context) => {
    const pluginContext = context as PluginValidationContext;
    const violations = [];
    
    if (context.hasClass(/Plugin$/) && !context.hasMethod(/^healthCheck$/)) {
      violations.push(ValidationHelpers.createViolation(
        'must-implement-health-check',
        'error',
        'Plugin must implement healthCheck method',
        context,
        { 
          suggestion: 'Add: async healthCheck(): Promise<boolean> { return true; }'
        }
      ));
    }
    
    // Check return type
    if (ValidationHelpers.contains(context.content, 'healthCheck()') && 
        !ValidationHelpers.contains(context.content, 'Promise<boolean>')) {
      violations.push(ValidationHelpers.createViolation(
        'must-implement-health-check',
        'error',
        'healthCheck method must return Promise<boolean>',
        context,
        { 
          suggestion: 'Change signature to: async healthCheck(): Promise<boolean>'
        }
      ));
    }
    
    return violations;
  });

/**
 * Import and dependency rules
 */
export const mustImportRequiredModules = createRule()
  .id('must-import-required-modules')
  .name('Must Import Required Modules')
  .description('Plugins must import all required modules')
  .severity('error')
  .category('imports')
  .tags('plugins', 'imports')
  .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
  .validate((context) => {
    const pluginContext = context as PluginValidationContext;
    const violations = [];
    
    const requiredImports = [
      { module: '@nestjs/common', items: ['Injectable'] },
      { module: '../core/base-plugin.abstract', items: ['BaseActionPlugin'] },
      { module: '../core/plugin.interface', items: ['PluginMetadata', 'ActionSchema', 'ValidationRule'] }
    ];
    
    for (const required of requiredImports) {
      if (!context.hasImport(required.module)) {
        violations.push(ValidationHelpers.createViolation(
          'must-import-required-modules',
          'error',
          `Missing import from ${required.module}`,
          context,
          { 
            suggestion: `Add: import { ${required.items.join(', ')} } from '${required.module}';`
          }
        ));
      }
    }
    
    return violations;
  });

/**
 * Naming convention rules
 */
export const pluginFileNaming = createRule()
  .id('plugin-file-naming')
  .name('Plugin File Naming Convention')
  .description('Plugin files must follow naming convention')
  .severity('warning')
  .category('naming')
  .tags('plugins', 'conventions')
  .filePattern(/src\/plugins\/.*\.ts$/)
  .validate((context) => {
    const pluginContext = context as PluginValidationContext;
    const violations = [];
    
    if (!context.file.endsWith('.plugin.ts')) {
      violations.push(ValidationHelpers.createViolation(
        'plugin-file-naming',
        'warning',
        'Plugin files should end with .plugin.ts',
        context,
        { 
          suggestion: 'Rename file to follow pattern: feature-name.plugin.ts'
        }
      ));
    }
    
    return violations;
  });

export const pluginClassNaming = createRule()
  .id('plugin-class-naming')
  .name('Plugin Class Naming Convention')
  .description('Plugin classes must end with "Plugin"')
  .severity('error')
  .category('naming')
  .tags('plugins', 'conventions')
  .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
  .validate((context) => {
    const pluginContext = context as PluginValidationContext;
    const violations = [];
    const classes = pluginContext.getClasses();
    
    for (const className of classes) {
      if (!className.endsWith('Plugin')) {
        violations.push(ValidationHelpers.createViolation(
          'plugin-class-naming',
          'error',
          `Plugin class '${className}' must end with 'Plugin'`,
          context,
          { 
            suggestion: `Rename class to '${className}Plugin'`
          }
        ));
      }
    }
    
    return violations;
  });

export const metadataCategoryValidation = createRule()
  .id('metadata-category-validation')
  .name('Valid Metadata Category')
  .description('Plugin category must be valid')
  .severity('error')
  .category('validation')
  .tags('plugins', 'metadata')
  .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
  .validate((context) => {
    const pluginContext = context as PluginValidationContext;
    const violations = [];
    const validCategories = ['business', 'utility', 'integration', 'auth'];
    
    const categoryMatch = context.content.match(/category:\s*['"]([^'"]+)['"]/);
    if (categoryMatch) {
      const category = categoryMatch[1];
      if (!validCategories.includes(category)) {
        violations.push(ValidationHelpers.createViolation(
          'metadata-category-validation',
          'error',
          `Invalid category '${category}'. Must be one of: ${validCategories.join(', ')}`,
          context,
          { 
            suggestion: `Use valid category: ${validCategories.join(', ')}`
          }
        ));
      }
    }
    
    return violations;
  });

/**
 * Security rules
 */
export const noConsoleLogging = createRule()
  .id('no-console-logging')
  .name('No Console Logging')
  .description('Use Logger service instead of console')
  .severity('warning')
  .category('security')
  .tags('plugins', 'logging')
  .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
  .validate((context) => {
    const pluginContext = context as PluginValidationContext;
    const violations = [];
    const consoleMatches = ValidationHelpers.findMatches(
      context.content, 
      /console\.(log|warn|error|debug)/g
    );
    
    for (const match of consoleMatches) {
      violations.push(ValidationHelpers.createViolation(
        'no-console-logging',
        'warning',
        `Avoid console.${match.match.split('.')[1]}() - use Logger service instead`,
        context,
        { 
          suggestion: 'Import Logger from @nestjs/common and use proper logging',
          line: match.line,
          column: match.column
        }
      ));
    }
    
    return violations;
  });

export const noHardcodedSecrets = createRule()
  .id('no-hardcoded-secrets')
  .name('No Hardcoded Secrets')
  .description('No hardcoded secrets or credentials')
  .severity('error')
  .category('security')
  .tags('plugins', 'security', 'secrets')
  .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
  .validate((context) => {
    const pluginContext = context as PluginValidationContext;
    const violations = [];
    const secretPatterns = [
      /(?:api_key|apikey|password|secret|token)\s*[:=]\s*['"][^'"\n]{8,}['"]/g,
      /(?:sk_|pk_)[a-zA-Z0-9]{20,}/g,
      /[A-Za-z0-9+\/]{40,}/g // Base64 encoded secrets
    ];
    
    for (const pattern of secretPatterns) {
      const matches = ValidationHelpers.findMatches(context.content, pattern);
      for (const match of matches) {
        violations.push(ValidationHelpers.createViolation(
          'no-hardcoded-secrets',
          'error',
          'Potential hardcoded secret detected',
          context,
          { 
            suggestion: 'Use environment variables or configuration service for secrets',
            line: match.line,
            column: match.column
          }
        ));
      }
    }
    
    return violations;
  });

/**
 * Testing rules
 */
export const mustHaveTestFile = createRule()
  .id('must-have-test-file')
  .name('Must Have Test File')
  .description('Each plugin must have a corresponding test file')
  .severity('warning')
  .category('testing')
  .tags('plugins', 'testing')
  .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
  .validate((context) => {
    const pluginContext = context as PluginValidationContext;
    const violations = [];
    const testFilePath = context.filePath.replace('.plugin.ts', '.plugin.spec.ts');
    
    try {
      require('fs').accessSync(testFilePath);
    } catch {
      violations.push(ValidationHelpers.createViolation(
        'must-have-test-file',
        'warning',
        `Missing test file: ${context.file.replace('.plugin.ts', '.plugin.spec.ts')}`,
        context,
        { 
          suggestion: 'Create corresponding test file for your plugin'
        }
      ));
    }
    
    return violations;
  });

/**
 * Export all NestJS plugin rules as a rule set
 */
export const nestjsPluginRules: ConstraintRule[] = [
  mustExtendBasePlugin,
  mustHaveInjectableDecorator,
  mustHaveMetadata,
  mustHaveSchema,
  mustHaveValidationRules,
  mustImplementExecuteMethod,
  mustImplementHealthCheck,
  mustImportRequiredModules,
  pluginFileNaming,
  pluginClassNaming,
  metadataCategoryValidation,
  noConsoleLogging,
  noHardcodedSecrets,
  mustHaveTestFile
];