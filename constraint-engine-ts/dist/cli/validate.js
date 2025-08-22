#!/usr/bin/env node
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
const commander_1 = require("commander");
const path = __importStar(require("path"));
const engine_1 = require("../core/engine");
const simple_plugin_rules_1 = require("../rules/simple-plugin-rules");
/**
 * CLI for constraint validation
 */
const program = new commander_1.Command();
program
    .name('constraint-validate')
    .description('Validate code against architectural constraints')
    .version('1.0.0');
program
    .command('plugins')
    .description('Validate NestJS plugins')
    .option('-p, --project <path>', 'Project root path', process.cwd())
    .option('-v, --verbose', 'Verbose output')
    .option('--patterns <patterns>', 'File patterns to validate (comma-separated)', 'src/plugins/**/*.plugin.ts')
    .option('--no-suggestions', 'Hide suggestions in output')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
    console.log('🔧 NestJS Plugin Architecture Validator');
    console.log(`📂 Project: ${options.project}`);
    console.log('');
    const engine = new engine_1.ConstraintEngine({
        projectRoot: options.project,
        verbose: options.verbose
    });
    // Add NestJS plugin rules
    engine.addRules(simple_plugin_rules_1.simplePluginRules);
    const patterns = options.patterns.split(',').map((p) => p.trim());
    try {
        const results = await engine.validateFiles(patterns);
        if (options.json) {
            console.log(JSON.stringify({
                summary: {
                    files: results.length,
                    violations: results.reduce((acc, r) => acc + r.violations.length, 0),
                    errors: results.reduce((acc, r) => acc + r.violations.filter(v => v.severity === 'error').length, 0),
                    warnings: results.reduce((acc, r) => acc + r.violations.filter(v => v.severity === 'warning').length, 0)
                },
                results,
                stats: engine.getStats()
            }, null, 2));
        }
        else {
            engine.printResults(results, {
                showStats: true,
                groupBySeverity: true,
                showSuggestions: !options.noSuggestions
            });
        }
        // Exit with error code if there are any errors
        const hasErrors = results.some(r => r.violations.some(v => v.severity === 'error'));
        process.exit(hasErrors ? 1 : 0);
    }
    catch (error) {
        console.error('❌ Validation failed:', error.message);
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
program
    .command('custom')
    .description('Validate with custom rules')
    .option('-p, --project <path>', 'Project root path', process.cwd())
    .option('-r, --rules <path>', 'Rules file path', './constraint-rules.js')
    .option('-v, --verbose', 'Verbose output')
    .option('--patterns <patterns>', 'File patterns to validate (comma-separated)', '**/*.{ts,js}')
    .action(async (options) => {
    console.log('🔧 Custom Constraint Validator');
    console.log(`📂 Project: ${options.project}`);
    console.log(`📋 Rules: ${options.rules}`);
    console.log('');
    try {
        const rulesPath = path.resolve(options.rules);
        const customRules = require(rulesPath);
        const engine = new engine_1.ConstraintEngine({
            projectRoot: options.project,
            verbose: options.verbose
        });
        if (Array.isArray(customRules)) {
            engine.addRules(customRules);
        }
        else if (customRules.rules && Array.isArray(customRules.rules)) {
            engine.addRules(customRules.rules);
        }
        else {
            throw new Error('Rules file must export an array of rules or object with rules property');
        }
        const patterns = options.patterns.split(',').map((p) => p.trim());
        const results = await engine.validateFiles(patterns);
        engine.printResults(results);
        const hasErrors = results.some(r => r.violations.some(v => v.severity === 'error'));
        process.exit(hasErrors ? 1 : 0);
    }
    catch (error) {
        console.error('❌ Custom validation failed:', error.message);
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
});
program
    .command('init')
    .description('Initialize constraint validation in project')
    .option('-p, --project <path>', 'Project root path', process.cwd())
    .option('--type <type>', 'Project type (nestjs-plugins, custom)', 'nestjs-plugins')
    .action(async (options) => {
    console.log('🚀 Initializing constraint validation...');
    const fs = require('fs');
    const packageJsonPath = path.join(options.project, 'package.json');
    try {
        // Add npm script
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            if (!packageJson.scripts) {
                packageJson.scripts = {};
            }
            packageJson.scripts.validate = 'constraint-validate plugins';
            packageJson.scripts['validate:verbose'] = 'constraint-validate plugins --verbose';
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            console.log('✅ Added validation scripts to package.json');
        }
        // Create example rules file for custom validation
        if (options.type === 'custom') {
            const rulesTemplate = `// Custom constraint rules
const { createRule } = require('@constrained-llm/constraint-engine');

module.exports = [
  createRule()
    .id('example-rule')
    .name('Example Rule')
    .description('Example constraint rule')
    .severity('warning')
    .category('custom')
    .filePattern(/\.ts$/)
    .validate((context) => {
      // Add your validation logic here
      return [];
    })
];`;
            fs.writeFileSync(path.join(options.project, 'constraint-rules.js'), rulesTemplate);
            console.log('✅ Created example constraint-rules.js');
        }
        console.log('');
        console.log('🎯 Setup complete! Run validation with:');
        console.log('   npm run validate');
        console.log('   npm run validate:verbose');
    }
    catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
});
// Parse command line arguments
program.parse();
// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=validate.js.map