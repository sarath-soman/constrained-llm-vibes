# CLAUDE.md - TypeScript Constraint Engine

## Directory Purpose
General-purpose constraint validation engine for any TypeScript/JavaScript codebase. Provides rule-based validation with CLI tools for integration into build pipelines and development workflows.

## Core Components
- `src/core/engine.ts` - Main constraint validation engine
- `src/core/rule-builder.ts` - Fluent API for creating constraint rules
- `src/rules/` - Pre-built constraint rule sets
- `src/cli/` - Command-line validation tools

## Development Commands
```bash
# Setup
npm install
npm run build

# Validation
npx constraint-validate <path>              # Validate files/directories
npx constraint-validate plugins --verbose   # Detailed plugin validation
npm run validate                            # Run all configured validations

# Development  
npm run dev                                 # Watch mode compilation
npm test                                    # Run test suite
npm run lint                               # ESLint validation
npm run typecheck                          # TypeScript type checking
```

## Creating Constraint Rules
Use the fluent rule builder for maximum clarity:

```typescript
import { createRule } from './core/rule-builder';

const pluginMustExtend = createRule()
  .id('must-extend-base-plugin')
  .name('Plugin Must Extend Base')
  .description('All plugin classes must extend BaseActionPlugin')
  .severity('error')
  .category('architecture')
  .filePattern(/src\/plugins\/.*\.plugin\.ts$/)
  .validate((context) => {
    if (context.content.includes('class') && 
        context.content.includes('Plugin') &&
        !context.content.includes('extends BaseActionPlugin')) {
      return [{
        ruleId: 'must-extend-base-plugin',
        severity: 'error',
        message: 'Plugin class must extend BaseActionPlugin',
        file: context.file,
        suggestion: 'Add "extends BaseActionPlugin" to class declaration'
      }];
    }
    return [];
  });
```

## Rule Categories
Organize rules by category for better maintainability:

- **Architecture**: Structural requirements (inheritance, interfaces)
- **Security**: Security best practices (no hardcoded secrets)
- **Performance**: Performance guidelines (avoid inefficient patterns)
- **Maintainability**: Code quality rules (naming, complexity)

## Engine Configuration
```typescript
// constraint-engine.config.ts
export default {
  rules: [
    ...pluginRules,
    ...securityRules, 
    ...performanceRules
  ],
  
  filePatterns: [
    'src/**/*.ts',
    'src/**/*.js'
  ],
  
  exclude: [
    'node_modules/**',
    'dist/**',
    '**/*.test.ts'
  ],
  
  severity: {
    error: ['must-extend-base-plugin', 'no-hardcoded-secrets'],
    warning: ['prefer-const', 'no-unused-imports']
  }
};
```

## CLI Usage
```bash
# Basic validation
constraint-validate src/

# With specific rules
constraint-validate src/ --rules="plugin-architecture,security"

# Output formats
constraint-validate src/ --format=json > results.json
constraint-validate src/ --format=junit > test-results.xml

# CI/CD integration
constraint-validate src/ --fail-on-error --quiet
```

## Integration Patterns

### ESLint Integration
```javascript
// eslint.config.js
module.exports = {
  plugins: ['@constrained-llm/constraint-engine'],
  rules: {
    '@constrained-llm/architecture-compliance': 'error'
  }
};
```

### Build Tool Integration
```json
{
  "scripts": {
    "prebuild": "constraint-validate src/",
    "test": "constraint-validate src/ && jest",
    "ci": "npm run lint && npm run typecheck && npm run validate && npm test"
  }
}
```

### GitHub Actions
```yaml
- name: Validate Architecture
  run: |
    npm install
    npx constraint-validate src/ --format=json > constraint-results.json
    
- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: constraint-validation
    path: constraint-results.json
```

## Performance Optimization

### For High-Frequency Validation
- **Use Bun**: 20-40x faster startup than Node.js
- **Compile rules**: Pre-compile constraint functions
- **Batch processing**: Validate multiple files together
- **Caching**: Cache validation results for unchanged files

```typescript
// High-performance setup
const engine = new ConstraintEngine({
  compiled: true,        // Pre-compile rules
  cache: true,          // Enable result caching
  parallel: true,       // Parallel file processing
  batchSize: 50         // Optimal batch size
});
```

## Rule Development Best Practices

1. **Specific file patterns**: Target exact file types
2. **Clear error messages**: Help developers understand violations
3. **Actionable suggestions**: Provide fix recommendations  
4. **Performance conscious**: Avoid expensive regex operations
5. **Testable**: Write unit tests for each rule

## Testing Constraint Rules
```typescript
// rule.test.ts
import { createRule } from '../core/rule-builder';
import { ValidationContext } from '../core/types';

describe('plugin-must-extend rule', () => {
  const rule = pluginMustExtendRule;
  
  it('should pass for valid plugin', () => {
    const context: ValidationContext = {
      content: 'export class MyPlugin extends BaseActionPlugin {}',
      file: 'src/plugins/my.plugin.ts',
      language: 'typescript'
    };
    
    const violations = rule.validate(context);
    expect(violations).toHaveLength(0);
  });
  
  it('should fail for invalid plugin', () => {
    const context: ValidationContext = {
      content: 'export class MyPlugin {}',
      file: 'src/plugins/my.plugin.ts', 
      language: 'typescript'
    };
    
    const violations = rule.validate(context);
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('must extend BaseActionPlugin');
  });
});
```

## Extending the Engine
Add new rule types by implementing the ConstraintRule interface:

```typescript
interface ConstraintRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  validate: (context: ValidationContext) => Violation[];
}
```