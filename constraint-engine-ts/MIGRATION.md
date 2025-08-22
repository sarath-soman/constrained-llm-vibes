# Migration Guide: Ruby → TypeScript Constraint Engine

## 🎯 Overview

This guide helps you migrate from our Ruby constraint prototype to the production-ready TypeScript constraint engine.

## ⚡ Quick Migration

### Before (Ruby)
```bash
# Ruby dependency
gem install dependencies
ruby validate.rb

# Mixed ecosystem
npm run test && ruby validate.rb && npm run build
```

### After (TypeScript)
```bash
# Single ecosystem
npm install @constrained-llm/constraint-engine --save-dev
npx constraint-validate plugins

# Unified pipeline
npm run test && npm run validate && npm run build
```

## 🔄 Step-by-Step Migration

### Step 1: Install TypeScript Engine

```bash
npm install @constrained-llm/constraint-engine --save-dev
```

### Step 2: Update package.json Scripts

```json
{
  "scripts": {
    "validate": "constraint-validate plugins",
    "validate:verbose": "constraint-validate plugins --verbose",
    "ci": "npm run test && npm run validate && npm run build"
  }
}
```

### Step 3: Convert Ruby Rules to TypeScript

#### Ruby Rule Example
```ruby
engine.rule "must_extend_base" do
  severity :error
  suggest "Add extends BaseActionPlugin"
  
  when_file(/plugins.*\.ts$/) do
    unless contains(/extends BaseActionPlugin/)
      violation! "Must extend BaseActionPlugin"
    end
  end
end
```

#### TypeScript Equivalent
```typescript
import { createRule } from '@constrained-llm/constraint-engine';

const mustExtendBase = createRule()
  .id('must-extend-base')
  .name('Must Extend Base Plugin')
  .description('Plugin must extend BaseActionPlugin')
  .severity('error')
  .category('architecture')
  .filePattern(/plugins.*\.ts$/)
  .validate((context) => {
    if (!context.content.includes('extends BaseActionPlugin')) {
      return [{
        ruleId: 'must-extend-base',
        severity: 'error',
        message: 'Must extend BaseActionPlugin',
        file: context.file,
        suggestion: 'Add extends BaseActionPlugin'
      }];
    }
    return [];
  });
```

### Step 4: Update CI/CD Pipeline

#### Before (GitHub Actions)
```yaml
- uses: ruby/setup-ruby@v1
  with:
    ruby-version: 2.7
- run: gem install dependencies
- run: ruby validate.rb
- uses: actions/setup-node@v3
  with:
    node-version: '18'
- run: npm ci
- run: npm test
```

#### After (GitHub Actions)
```yaml
- uses: actions/setup-node@v3
  with:
    node-version: '18'
- run: npm ci
- run: npm run validate
- run: npm test
- run: npm run build
```

### Step 5: Remove Ruby Dependencies

```bash
# Remove Ruby validation files
rm -rf constraint-rules.rb
rm -rf ruby-validation/

# Remove Ruby from Docker
# Before: FROM ruby:3.0 AS validator
# After: Single-stage Node.js build

# Update .gitignore
# Remove Ruby-specific ignores
```

## 📊 Feature Comparison

| Feature | Ruby Prototype | TypeScript Engine | Status |
|---------|---------------|-------------------|---------|
| **Expressiveness** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Acceptable trade-off |
| **Team Adoption** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Major improvement |
| **CI/CD Integration** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Much simpler |
| **Performance** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Better |
| **Maintainability** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Same team skillset |

## 🔧 Rule Migration Patterns

### Pattern 1: Simple Content Matching

#### Ruby
```ruby
forbid("console statements").pattern(/console\.log/)
```

#### TypeScript  
```typescript
if (context.content.includes('console.log')) {
  violations.push(/* violation */);
}
```

### Pattern 2: File Pattern Matching

#### Ruby
```ruby
when_file(/plugins.*\.ts$/) do
  # validation logic
end
```

#### TypeScript
```typescript
createRule()
  .filePattern(/plugins.*\.ts$/)
  .validate((context) => {
    // validation logic
  })
```

### Pattern 3: Complex Pattern Matching

#### Ruby
```ruby
find_pattern(/class\s+(\w+)Plugin/).each do |match|
  # process matches
end
```

#### TypeScript
```typescript
const matches = ValidationHelpers.findMatches(
  context.content, 
  /class\s+(\w+)Plugin/g
);

matches.forEach(match => {
  // process matches
});
```

### Pattern 4: Metadata Validation

#### Ruby
```ruby
required_fields = %w[name version description]
required_fields.each do |field|
  unless contains(/#{field}:/)
    violation! "Missing field: #{field}"
  end
end
```

#### TypeScript
```typescript
const requiredFields = ['name:', 'version:', 'description:'];
const missingFields = requiredFields.filter(field => 
  !context.content.includes(field)
);

if (missingFields.length > 0) {
  violations.push({
    // violation details
    message: `Missing fields: ${missingFields.join(', ')}`
  });
}
```

## 🚀 Advanced Migration

### Custom Rule Sets

#### Ruby Approach
```ruby
# architectural_rules.rb
engine.rule "custom_rule" do
  # rule logic
end

load 'architectural_rules.rb'
```

#### TypeScript Approach
```typescript
// rules/custom-rules.ts
export const customRules: ConstraintRule[] = [
  createRule()
    .id('custom-rule')
    .validate((context) => {
      // rule logic
    })
];

// main.ts
import { customRules } from './rules/custom-rules';
engine.addRules(customRules);
```

### Multi-Language Support

#### Ruby
```ruby
when_language(:typescript) do
  forbid(/:\s*any/)
end

when_language(:python) do
  forbid(/import \*/)
end
```

#### TypeScript
```typescript
const typeScriptRules = createRule()
  .filePattern(/\.ts$/)
  .validate((context) => {
    if (context.language === 'typescript' && 
        context.content.includes(': any')) {
      // violation
    }
  });

const pythonRules = createRule()
  .filePattern(/\.py$/)
  .validate((context) => {
    if (context.language === 'python' && 
        context.content.includes('import *')) {
      // violation  
    }
  });
```

## 🔍 Testing Your Migration

### Validation Test
```bash
# Test both engines side by side
ruby old-validate.rb
npx constraint-validate plugins

# Should produce similar results
```

### Performance Test
```bash
# Time both approaches
time ruby validate.rb
time npx constraint-validate plugins
```

### Integration Test
```bash
# Test in CI/CD pipeline
npm run ci
# Should pass without Ruby dependencies
```

## ⚠️ Migration Gotchas

### 1. **Regex Differences**
Ruby regex and JavaScript regex have slight differences:
```ruby
# Ruby
/(?<=class\s)(\w+)Plugin/  # Positive lookbehind
```
```typescript
// JavaScript - no lookbehind in older engines
/class\s+(\w+)Plugin/  // Capture group instead
```

### 2. **File Path Handling**
```ruby
# Ruby
file_path.include?('plugins')
```
```typescript
// TypeScript
context.filePath.includes('plugins')
```

### 3. **Error Handling**
```ruby
# Ruby - exceptions
begin
  validate_file(file)
rescue => error
  puts error.message
end
```
```typescript
// TypeScript - promises
try {
  await validateFile(file);
} catch (error) {
  console.error((error as Error).message);
}
```

## 📈 Success Metrics

Track these metrics to validate successful migration:

### Technical Metrics
- ✅ Zero Ruby dependencies in production
- ✅ Single ecosystem build pipeline
- ✅ Equivalent or better violation detection
- ✅ Faster CI/CD execution times

### Team Metrics
- ✅ All team members can maintain rules
- ✅ Faster developer onboarding
- ✅ Reduced context switching
- ✅ Better IDE/tooling integration

### Business Metrics
- ✅ Reduced infrastructure complexity
- ✅ Lower maintenance overhead  
- ✅ Improved deployment reliability
- ✅ Better developer productivity

## 🎯 Next Steps After Migration

1. **Enhanced Rules**: Add more sophisticated TypeScript AST-based validation
2. **ESLint Integration**: Create ESLint plugin for IDE integration
3. **Custom Domains**: Build domain-specific rule sets
4. **Performance Optimization**: Add caching and parallel processing
5. **Monitoring**: Add metrics and reporting dashboards

## 🆘 Troubleshooting

### Common Issues

**Issue**: TypeScript rules less expressive than Ruby
**Solution**: Use helper functions and chain multiple simple validations

**Issue**: Performance slower than Ruby for large codebases
**Solution**: Enable concurrency and caching options

**Issue**: Missing regex features from Ruby
**Solution**: Use string methods + regex combinations

**Issue**: Team resistance to changing from Ruby
**Solution**: Show side-by-side demos and emphasize maintainability benefits

## 📞 Getting Help

- 📖 Check the [README](./README.md) for usage examples
- 🐛 File issues with detailed Ruby vs TypeScript comparisons
- 💬 Include migration context in support requests

## 🎉 Migration Complete!

Once migrated, you'll have:
- ✅ Single ecosystem constraint validation
- ✅ Better team maintainability
- ✅ Simpler CI/CD pipelines
- ✅ Production-ready TypeScript tooling

**The Ruby prototype served its purpose - proving the constraint-based approach works. The TypeScript engine scales it for real-world adoption.**