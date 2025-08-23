# NestJS Plugin System with LLM Constraints

A constrained plugin architecture for NestJS that ensures LLMs can only generate code following our exact patterns.

## 🎯 Core Concept

> **"Don't make LLMs understand your architecture - make it impossible for them to break it"**

This system constrains LLM-generated code through:
- **Sealed base classes** that enforce patterns
- **Ruby-based validation rules** that catch violations
- **TypeScript interfaces** that require specific structures
- **Automated testing** that validates all constraints

## 🏗️ Architecture

### Plugin Structure (LLMs must follow this exactly)

```typescript
@Injectable()
export class YourPlugin extends BaseActionPlugin {
  readonly metadata: PluginMetadata = {
    name: 'your-plugin',
    version: '1.0.0', 
    description: 'What this plugin does',
    author: 'Your name',
    category: 'business' | 'utility' | 'integration' | 'auth'
  };

  readonly schema: ActionSchema = {
    request: YourRequestInterface,
    response: YourResponseInterface
  };

  readonly validationRules: ValidationRule[] = [
    {
      name: 'rule_name',
      message: 'Error message',
      validate: (input) => boolean
    }
  ];

  async execute(input: YourRequestInterface): Promise<YourResponseInterface> {
    // Implementation here
  }

  async healthCheck(): Promise<boolean> {
    return true; // Or actual health check logic
  }
}
```

### Constraint Enforcement

1. **Base Class Pattern**: All plugins MUST extend `BaseActionPlugin`
2. **Sealed Methods**: Framework controls validation and execution flow
3. **Required Interfaces**: TypeScript enforces structure at compile time
4. **Runtime Validation**: Ruby constraint engine validates at build time
5. **Automated Testing**: Jest tests verify all patterns work

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
# Start development server
npm run start:dev

# Run tests
npm run test

# Validate all plugins against constraints
npm run validate

# Build for production
npm run build
```

### Creating New Plugins

1. **Create plugin file**: `src/plugins/your-feature.plugin.ts`
2. **Follow the pattern**: Extend `BaseActionPlugin` with all required properties
3. **Create test file**: `src/plugins/your-feature.plugin.spec.ts`
4. **Validate**: Run `npm run validate` to ensure constraints are met
5. **Register**: Add to `app.module.ts`

## 📋 LLM Constraints

The system enforces these constraints on LLM-generated code:

### ✅ Required Structure
- Must extend `BaseActionPlugin`
- Must have `@Injectable()` decorator
- Must define `metadata`, `schema`, `validationRules`
- Must implement `execute()` and `healthCheck()` methods
- Must create corresponding test file

### ✅ Metadata Requirements
- All fields required: `name`, `version`, `description`, `author`, `category`
- Category must be: `business`, `utility`, `integration`, or `auth`
- Name should match file/class naming pattern

### ✅ Schema Requirements
- Must define `Request` and `Response` interfaces
- Interfaces must be TypeScript interfaces (not types/classes)
- Schema must reference these interfaces

### ✅ Method Requirements
- `execute` must be async and return Promise
- `healthCheck` must return `Promise<boolean>`
- No overriding of sealed framework methods

### ❌ Forbidden Patterns
- No `console.log` (use proper logging)
- No `eval()` or `Function` constructor
- No hardcoded secrets/credentials
- No direct database imports outside models
- No mutable metadata/schema properties

## 🔧 API Endpoints

The system provides REST endpoints for plugin execution:

```bash
# List all plugins
GET /plugins

# Get plugin details
GET /plugins/:name

# Execute plugin
POST /plugins/:name/execute
Body: { /* plugin-specific request data */ }

# Health check all
GET /plugins/health/status

# Health check specific
GET /plugins/:name/health
```

## 🧪 Example Usage

### User Creation Plugin

```bash
curl -X POST http://localhost:3000/plugins/user-creation/execute \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe", 
    "role": "user"
  }'
```

### Email Notification Plugin

```bash
curl -X POST http://localhost:3000/plugins/email-notification/execute \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": ["user@example.com"],
    "subject": "Welcome!",
    "body": "Welcome to our platform",
    "priority": "normal"
  }'
```

## 🔍 Validation Pipeline

The constraint validation runs automatically:

```bash
# Manual validation
npm run validate

# Validation runs on:
# - Pre-commit hooks (if configured)
# - CI/CD pipeline
# - Before production deployment
```

## 📁 Project Structure

```
src/
├── core/                    # Framework code (LLMs cannot modify)
│   ├── plugin.interface.ts  # Plugin contracts
│   ├── base-plugin.abstract.ts # Base implementation
│   └── plugin-registry.service.ts # Plugin management
├── plugins/                 # Plugin implementations (LLM-generated)
│   ├── user-creation.plugin.ts
│   ├── user-creation.plugin.spec.ts
│   ├── email-notification.plugin.ts
│   └── email-notification.plugin.spec.ts
├── constraints/             # Validation rules
│   └── nestjs-plugin-rules.rb
├── app.module.ts           # Application module
├── plugin.controller.ts    # REST API
└── main.ts                # Application bootstrap
```

## 🎛️ Integration with CI/CD

Add to your pipeline:

```yaml
# .github/workflows/validate.yml
- name: Validate Plugin Architecture
  run: npm run validate
  
- name: Run Plugin Tests  
  run: npm test
  
- name: Check TypeScript Compilation
  run: npm run build
```

## 🔄 LLM Integration Workflow

1. **LLM generates plugin** following the pattern
2. **Constraint engine validates** against architectural rules
3. **TypeScript compiler** enforces interface contracts
4. **Jest tests** verify functionality
5. **Framework registers** plugin if all checks pass

If any step fails, the LLM gets specific feedback on what to fix.

## 🛡️ Security Features

- No hardcoded secrets allowed
- Input validation on all plugins
- Sandboxed execution environment
- Health monitoring and circuit breakers
- Audit logging of all plugin executions

## 📈 Monitoring

The system provides built-in monitoring:

- Plugin execution statistics
- Health check status
- Performance metrics
- Error rates and patterns
- Usage analytics

## 🤝 Contributing

When adding new constraint rules:

1. Add rule to `src/constraints/nestjs-plugin-rules.rb`
2. Create test plugin that violates the rule
3. Verify the rule catches the violation
4. Update documentation

This ensures our constraint system evolves with the architecture.

---

**Bottom Line**: This system makes it impossible for LLMs to generate code that breaks our architecture, while still allowing them to handle the tedious implementation details.