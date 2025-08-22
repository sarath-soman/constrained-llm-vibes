"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplePluginRules = void 0;
const rule_builder_1 = require("../core/rule-builder");
/**
 * Simplified NestJS Plugin Rules - TypeScript Native
 * Focus on the most critical constraints for LLM code generation
 */
exports.simplePluginRules = [
    (0, rule_builder_1.createRule)()
        .id('must-extend-base-plugin')
        .name('Must Extend BaseActionPlugin')
        .description('All plugin classes must extend BaseActionPlugin')
        .severity('error')
        .category('architecture')
        .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
        .validate((context) => {
        const violations = [];
        if (context.content.includes('class') &&
            context.content.includes('Plugin') &&
            !context.content.includes('extends BaseActionPlugin')) {
            violations.push({
                ruleId: 'must-extend-base-plugin',
                severity: 'error',
                message: 'Plugin class must extend BaseActionPlugin',
                file: context.file,
                suggestion: 'Add "extends BaseActionPlugin" to your plugin class declaration'
            });
        }
        return violations;
    }),
    (0, rule_builder_1.createRule)()
        .id('must-have-injectable-decorator')
        .name('Must Have Injectable Decorator')
        .description('Plugin classes must have @Injectable() decorator')
        .severity('error')
        .category('architecture')
        .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
        .validate((context) => {
        const violations = [];
        if (context.content.includes('class') &&
            context.content.includes('Plugin') &&
            !context.content.includes('@Injectable()')) {
            violations.push({
                ruleId: 'must-have-injectable-decorator',
                severity: 'error',
                message: 'Plugin class must have @Injectable() decorator',
                file: context.file,
                suggestion: 'Add @Injectable() decorator above your plugin class'
            });
        }
        return violations;
    }),
    (0, rule_builder_1.createRule)()
        .id('must-have-metadata')
        .name('Must Have Metadata Property')
        .description('Plugins must define readonly metadata property')
        .severity('error')
        .category('architecture')
        .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
        .validate((context) => {
        const violations = [];
        if (!context.content.includes('readonly metadata: PluginMetadata')) {
            violations.push({
                ruleId: 'must-have-metadata',
                severity: 'error',
                message: 'Plugin must have "readonly metadata: PluginMetadata" property',
                file: context.file,
                suggestion: 'Add: readonly metadata: PluginMetadata = { name: "...", version: "...", ... }'
            });
        }
        // Check required metadata fields
        const requiredFields = ['name:', 'version:', 'description:', 'author:', 'category:'];
        const missingFields = requiredFields.filter(field => !context.content.includes(field));
        if (missingFields.length > 0) {
            violations.push({
                ruleId: 'must-have-metadata',
                severity: 'error',
                message: `Plugin metadata missing required fields: ${missingFields.map(f => f.replace(':', '')).join(', ')}`,
                file: context.file,
                suggestion: `Add missing fields to metadata: ${missingFields.map(f => f.replace(':', '')).join(', ')}`
            });
        }
        return violations;
    }),
    (0, rule_builder_1.createRule)()
        .id('must-have-execute-method')
        .name('Must Have Execute Method')
        .description('Plugins must implement async execute method')
        .severity('error')
        .category('architecture')
        .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
        .validate((context) => {
        const violations = [];
        if (context.content.includes('class') &&
            context.content.includes('Plugin') &&
            !context.content.includes('async execute(')) {
            violations.push({
                ruleId: 'must-have-execute-method',
                severity: 'error',
                message: 'Plugin must implement async execute method',
                file: context.file,
                suggestion: 'Add: async execute(input: any): Promise<any> { ... }'
            });
        }
        return violations;
    }),
    (0, rule_builder_1.createRule)()
        .id('must-have-health-check')
        .name('Must Have Health Check')
        .description('Plugins must implement async healthCheck method')
        .severity('error')
        .category('architecture')
        .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
        .validate((context) => {
        const violations = [];
        if (context.content.includes('class') &&
            context.content.includes('Plugin') &&
            !context.content.includes('async healthCheck()')) {
            violations.push({
                ruleId: 'must-have-health-check',
                severity: 'error',
                message: 'Plugin must implement async healthCheck method',
                file: context.file,
                suggestion: 'Add: async healthCheck(): Promise<boolean> { return true; }'
            });
        }
        return violations;
    }),
    (0, rule_builder_1.createRule)()
        .id('plugin-file-naming')
        .name('Plugin File Naming Convention')
        .description('Plugin files must follow naming convention')
        .severity('warning')
        .category('naming')
        .filePattern(/src\/plugins\/.*\.ts$/)
        .validate((context) => {
        const violations = [];
        if (!context.file.endsWith('.plugin.ts')) {
            violations.push({
                ruleId: 'plugin-file-naming',
                severity: 'warning',
                message: 'Plugin files should end with .plugin.ts',
                file: context.file,
                suggestion: 'Rename file to follow pattern: feature-name.plugin.ts'
            });
        }
        return violations;
    }),
    (0, rule_builder_1.createRule)()
        .id('no-console-logging')
        .name('No Console Logging')
        .description('Use Logger service instead of console')
        .severity('warning')
        .category('security')
        .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
        .validate((context) => {
        const violations = [];
        const consolePattern = /console\.(log|warn|error|debug)/g;
        const matches = rule_builder_1.ValidationHelpers.findMatches(context.content, consolePattern);
        for (const match of matches) {
            violations.push({
                ruleId: 'no-console-logging',
                severity: 'warning',
                message: `Avoid ${match.match} - use Logger service instead`,
                file: context.file,
                suggestion: 'Import Logger from @nestjs/common and use proper logging',
                line: match.line,
                column: match.column
            });
        }
        return violations;
    }),
    (0, rule_builder_1.createRule)()
        .id('no-hardcoded-secrets')
        .name('No Hardcoded Secrets')
        .description('No hardcoded secrets or credentials')
        .severity('error')
        .category('security')
        .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
        .validate((context) => {
        const violations = [];
        const secretPattern = /(?:api_key|password|secret|token)\s*[:=]\s*['"][^'"\n]{8,}['"]/gi;
        const matches = rule_builder_1.ValidationHelpers.findMatches(context.content, secretPattern);
        for (const match of matches) {
            violations.push({
                ruleId: 'no-hardcoded-secrets',
                severity: 'error',
                message: 'Potential hardcoded secret detected',
                file: context.file,
                suggestion: 'Use environment variables or configuration service for secrets',
                line: match.line,
                column: match.column
            });
        }
        return violations;
    }),
    (0, rule_builder_1.createRule)()
        .id('valid-metadata-category')
        .name('Valid Metadata Category')
        .description('Plugin category must be valid')
        .severity('error')
        .category('validation')
        .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
        .validate((context) => {
        const violations = [];
        const validCategories = ['business', 'utility', 'integration', 'auth'];
        const categoryMatch = context.content.match(/category:\s*['"]([^'"]+)['"]/);
        if (categoryMatch) {
            const category = categoryMatch[1];
            if (!validCategories.includes(category)) {
                violations.push({
                    ruleId: 'valid-metadata-category',
                    severity: 'error',
                    message: `Invalid category '${category}'. Must be one of: ${validCategories.join(', ')}`,
                    file: context.file,
                    suggestion: `Use valid category: ${validCategories.join(', ')}`
                });
            }
        }
        return violations;
    })
];
//# sourceMappingURL=simple-plugin-rules.js.map