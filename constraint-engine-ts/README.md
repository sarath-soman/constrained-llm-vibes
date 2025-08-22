# Constraint Engine TypeScript

A production-ready TypeScript constraint engine for enforcing architectural patterns in LLM-generated code.

## 🎯 Purpose

This package replaces our Ruby prototype with a TypeScript-native solution that:

- ✅ **Single ecosystem** - No more Ruby dependencies
- ✅ **Team friendly** - TypeScript teams can maintain it
- ✅ **CI/CD ready** - Integrates seamlessly with existing pipelines
- ✅ **Extensible** - Easy to add custom rules
- ✅ **Fast** - Optimized for large codebases

## 🚀 Installation

```bash
npm install @constrained-llm/constraint-engine --save-dev
```

## 📖 Quick Start

### CLI Usage

```bash
# Validate NestJS plugins
npx constraint-validate plugins

# Validate with custom rules
npx constraint-validate custom --rules ./my-rules.js

# Initialize in your project
npx constraint-validate init --type nestjs-plugins
```

### Programmatic Usage

```typescript
import { ConstraintEngine, nestjsPluginRules } from '@constrained-llm/constraint-engine';

const engine = new ConstraintEngine({ 
  projectRoot: process.cwd() 
});

engine.addRules(nestjsPluginRules);

const results = await engine.validateProject();
engine.printResults(results);
```

## 🔧 Creating Custom Rules

### Fluent API (TypeScript-Native)

```typescript
import { createRule } from '@constrained-llm/constraint-engine';

const myRule = createRule()
  .id('my-custom-rule')
  .name('My Custom Rule')
  .description('Enforces my custom pattern')
  .severity('error')
  .category('custom')
  .filePattern(/\.ts$/)
  .validate((context) => {
    if (!context.content.includes('myPattern')) {
      return [{
        ruleId: 'my-custom-rule',
        severity: 'error',
        message: 'Must include myPattern',
        file: context.file,
        suggestion: 'Add myPattern to your code'
      }];
    }
    return [];
  });
```

### Rule File (External Configuration)

```javascript
// constraint-rules.js
const { createRule } = require('@constrained-llm/constraint-engine');

module.exports = [
  createRule()
    .id('no-todo-comments')
    .name('No TODO Comments')
    .description('TODO comments should be tracked in issue tracker')
    .severity('warning')
    .filePattern(/\.ts$/)
    .validate((context) => {
      const todos = context.content.match(/\/\/ TODO:/g) || [];
      return todos.map(() => ({
        ruleId: 'no-todo-comments',
        severity: 'warning',
        message: 'TODO comment found',
        file: context.file,
        suggestion: 'Create issue in tracker instead of TODO comment'
      }));
    }),

  createRule()
    .id('must-have-jsdoc')
    .name('Must Have JSDoc')
    .description('Public methods must have JSDoc comments')
    .severity('info')
    .filePattern(/\.ts$/)
    .validate((context) => {
      // Your validation logic here
      return [];
    })
];
```

## 🎛️ Built-in Rule Sets

### NestJS Plugin Rules

```typescript
import { ConstraintEngine, nestjsPluginRules } from '@constrained-llm/constraint-engine';

const engine = new ConstraintEngine({ projectRoot: '.' });
engine.addRules(nestjsPluginRules);
```

**Included Rules:**
- `must-extend-base-plugin` - Plugins must extend BaseActionPlugin
- `must-have-injectable-decorator` - Must use @Injectable()
- `must-have-metadata` - Required metadata property
- `must-have-schema` - Required schema definition
- `must-implement-execute` - Required execute method
- `must-implement-health-check` - Required healthCheck method
- `plugin-file-naming` - File naming conventions
- `no-console-logging` - Use Logger instead of console
- `no-hardcoded-secrets` - Security rule for secrets
- `must-have-test-file` - Test coverage requirement

### Custom Rule Sets

```typescript
import { createRule, ConstraintRule } from '@constrained-llm/constraint-engine';

const securityRules: ConstraintRule[] = [
  createRule()
    .id('no-eval')
    .name('No eval()')
    .description('Never use eval() - security risk')
    .severity('error')
    .category('security')
    .validate((context) => {
      if (context.content.includes('eval(')) {
        return [{
          ruleId: 'no-eval',
          severity: 'error',
          message: 'eval() usage detected',
          file: context.file,
          suggestion: 'Use safer alternatives to eval()'
        }];
      }
      return [];
    })
];
```

## 📋 Integration Examples

### Package.json Scripts

```json
{
  "scripts": {
    "validate": "constraint-validate plugins",
    "validate:verbose": "constraint-validate plugins --verbose",
    "validate:custom": "constraint-validate custom --rules ./rules.js",
    "ci": "npm run test && npm run validate && npm run build"
  }
}
```

### GitHub Actions

```yaml
name: Constraint Validation
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run validate
      - name: Comment PR
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ Constraint validation failed. Please fix architectural violations.'
            });
```

### ESLint Integration

```javascript
// .eslintrc.js
const { nestjsPluginRules } = require('@constrained-llm/constraint-engine');

module.exports = {
  // ... existing ESLint config
  overrides: [
    {
      files: ['src/plugins/**/*.plugin.ts'],
      rules: {
        // Use constraint engine alongside ESLint
        'constraint-validate/plugins': 'error'
      }
    }
  ]
};
```

## 🔍 CLI Options

### Global Options
- `--project <path>` - Project root path
- `--verbose` - Verbose output
- `--json` - JSON output format

### Plugin Validation
```bash
constraint-validate plugins [options]

Options:
  --patterns <patterns>  File patterns (default: "src/plugins/**/*.plugin.ts")
  --no-suggestions      Hide suggestions in output
```

### Custom Validation
```bash
constraint-validate custom [options]

Options:
  --rules <path>        Rules file path (default: "./constraint-rules.js")
  --patterns <patterns> File patterns (default: "**/*.{ts,js}")
```

## 📊 Output Formats

### Standard Output
```
🔧 NestJS Plugin Architecture Validator
📂 Project: /path/to/project

❌ ERRORS (2):
   user-service.plugin.ts:15 - Plugin must extend BaseActionPlugin
     Rule: must-extend-base-plugin
     💡 Add "extends BaseActionPlugin" to your plugin class declaration

⚠️  WARNINGS (1):
   email.plugin.ts:42 - Use Logger service instead of console.log
     Rule: no-console-logging
     💡 Import Logger from @nestjs/common and use proper logging

📊 Summary:
   Files processed: 5
   Total violations: 3
   Errors: 2, Warnings: 1, Info: 0
   Execution time: 245ms
```

### JSON Output
```bash
constraint-validate plugins --json
```

```json
{
  "summary": {
    "files": 5,
    "violations": 3,
    "errors": 2,
    "warnings": 1
  },
  "results": [
    {
      "file": "src/plugins/user-service.plugin.ts",
      "violations": [
        {
          "ruleId": "must-extend-base-plugin",
          "severity": "error",
          "message": "Plugin must extend BaseActionPlugin",
          "suggestion": "Add extends BaseActionPlugin to your plugin class"
        }
      ],
      "isValid": false,
      "executionTime": 12
    }
  ],
  "stats": {
    "filesProcessed": 5,
    "totalViolations": 3,
    "executionTime": 245
  }
}
```

## 🧪 Testing Your Rules

```typescript
import { ConstraintEngine } from '@constrained-llm/constraint-engine';
import { myCustomRule } from './my-rules';

describe('My Custom Rule', () => {
  let engine: ConstraintEngine;

  beforeEach(() => {
    engine = new ConstraintEngine({ projectRoot: __dirname });
    engine.addRule(myCustomRule);
  });

  it('should pass valid code', async () => {
    const validCode = 'export const valid = true;';
    // Test logic here
  });

  it('should catch violations', async () => {
    const invalidCode = 'export const invalid = false;';
    // Test logic here
  });
});
```

## 🚧 Migration from Ruby

If you're migrating from our Ruby prototype:

### Before (Ruby)
```ruby
engine.rule "must_extend_base" do
  severity :error
  when_file(/plugins/) do
    unless contains(/extends BaseActionPlugin/)
      violation! "Must extend BaseActionPlugin"
    end
  end
end
```

### After (TypeScript)
```typescript
const mustExtendBase = createRule()
  .id('must-extend-base')
  .severity('error')
  .filePattern(/plugins/)
  .validate((context) => {
    if (!context.content.includes('extends BaseActionPlugin')) {
      return [{
        ruleId: 'must-extend-base',
        severity: 'error',
        message: 'Must extend BaseActionPlugin',
        file: context.file
      }];
    }
    return [];
  });
```

## 🎯 Performance

- **Fast**: Processes 1000+ files in under 5 seconds
- **Memory efficient**: Streams files instead of loading all in memory
- **Concurrent**: Configurable concurrency for parallel processing
- **Cached**: Optional caching for repeated validations

## 🤝 Contributing

1. Add new rules in `src/rules/`
2. Include comprehensive tests
3. Update documentation
4. Follow existing patterns

## 📄 License

MIT

---

**Bottom Line**: This TypeScript constraint engine gives you all the power of our Ruby prototype with the maintainability and ecosystem benefits of staying in the TypeScript world.