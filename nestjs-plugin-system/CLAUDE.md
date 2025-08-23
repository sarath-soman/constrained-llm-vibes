# CLAUDE.md - NestJS Plugin System

## Directory Purpose
Production-ready plugin architecture demonstrating constraint-based LLM integration. Shows how sealed base classes prevent architectural violations while enabling LLM-generated plugin development.

## Key Architecture Principles
- **Sealed Base Classes**: LLMs cannot override critical validation methods
- **Interface Compliance**: All plugins must implement IActionPlugin
- **Automatic Validation**: Built-in health checking and input validation
- **Registry Pattern**: Centralized plugin discovery and management

## Core Files
- `src/core/base-plugin.abstract.ts` - **CRITICAL** - Sealed base class that prevents LLM violations
- `src/core/plugin-registry.service.ts` - Plugin management and discovery
- `src/plugins/` - Example constraint-compliant plugins
- `src/constraints/` - Ruby validation rules (prototype)

## Development Commands
```bash
# Setup and run
npm install
npm run dev                    # Start development server

# Validation
npm run validate              # Run constraint validation
npm test                      # Run all tests
node scripts/validate-plugins.js  # Ruby constraint validation

# Plugin development
npm run generate-plugin       # Generate new plugin template
npm run validate-plugin <path>   # Validate single plugin
```

## Creating New Plugins
When generating new plugins (LLM or manual), they MUST:

1. **Extend BaseActionPlugin**:
```typescript
export class MyPlugin extends BaseActionPlugin {
  // LLM can implement these
  readonly metadata: PluginMetadata = { /* */ };
  readonly schema: ActionSchema = { /* */ };
  
  async execute(input: any): Promise<any> {
    // Plugin logic here
  }
  
  // LLM CANNOT override these sealed methods:
  // - validateInput()
  // - healthCheck()
  // - getMetadata()
}
```

2. **Have @Injectable decorator**:
```typescript
@Injectable()
export class MyPlugin extends BaseActionPlugin {
  // ...
}
```

3. **Define required properties**:
- `metadata: PluginMetadata`
- `schema: ActionSchema`  
- `validationRules: ValidationRule[]`

## Constraint Validation
The system validates plugins at multiple levels:

1. **Compile-time**: TypeScript ensures interface compliance
2. **Runtime**: Sealed methods prevent violations  
3. **CI/CD**: Ruby constraints validate architectural rules
4. **Plugin Registry**: Health checks ensure plugin functionality

## Testing Strategy
```bash
# Unit tests for individual plugins
npm run test:unit

# Integration tests for plugin system
npm run test:integration  

# Constraint validation tests
npm run test:constraints

# End-to-end plugin lifecycle
npm run test:e2e
```

## LLM Generation Guidelines
When using LLMs to generate plugins:

### ✅ Safe to Generate
- Business logic in `execute()` method
- Custom validation rules
- Plugin metadata and schemas
- Additional helper methods

### ❌ Never Allow LLM to Override
- `validateInput()` - Sealed validation logic
- `healthCheck()` - System health verification  
- `getMetadata()` - Metadata access control
- Base constructor logic

## Plugin Registry Usage
```typescript
// Register plugin
this.pluginRegistry.register(MyPlugin);

// Execute plugin
const result = await this.pluginRegistry.execute('my-plugin', input);

// Health check
const health = await this.pluginRegistry.healthCheck('my-plugin');
```

## Common Issues & Solutions

**Issue**: Plugin not loading
**Solution**: Ensure @Injectable decorator and proper registration

**Issue**: Validation failing  
**Solution**: Check BaseActionPlugin extension and required properties

**Issue**: Runtime errors
**Solution**: Verify sealed methods aren't overridden in generated code

## File Structure
```
nestjs-plugin-system/
├── src/
│   ├── core/                 # Core plugin architecture
│   ├── plugins/              # Example plugins
│   ├── constraints/          # Validation rules
│   └── *.ts                  # NestJS application files
├── scripts/                  # Validation scripts
└── tests/                    # Test suites
```