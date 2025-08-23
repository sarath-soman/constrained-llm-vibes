# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the constrained-llm-vibes repository.

## Project Overview

**Constrained LLM Vibes** is a comprehensive framework for constraint-based LLM code generation. The core philosophy: "Don't make LLMs understand your codebase. Make your codebase impossible for LLMs to misunderstand."

### Key Components
- **Language Analysis**: 9-language comparison for optimal constraint specification
- **NestJS Plugin System**: Production-ready sealed architecture preventing LLM violations
- **TypeScript Constraint Engine**: General-purpose validation with CLI tools
- **Performance Optimization**: Bun + TypeScript for 20-40x faster execution

## Development Commands

### Quick Start
```bash
# High-performance setup (recommended)
curl -fsSL https://bun.sh/install | bash

# Try NestJS plugin system
cd nestjs-plugin-system
npm install && npm run validate && npm run dev

# Try constraint engine
cd constraint-engine-ts  
npm install && npm run build
npx constraint-validate plugins
```

### Validation Commands
```bash
# Ruby constraint validation (prototype)
cd nestjs-plugin-system
ruby src/constraints/simple-validator.rb .

# TypeScript constraint validation (production)
cd constraint-engine-ts
npm run validate

# Plugin architecture validation
cd nestjs-plugin-system
node scripts/validate-plugins.js
```

### Testing
```bash
cd nestjs-plugin-system
npm test                    # Run plugin tests

cd constraint-engine-ts
npm test                    # Run constraint engine tests
```

## Architecture

### Core Principle: Sealed Base Classes
```typescript
// LLMs cannot override sealed methods - architectural safety guaranteed
export abstract class BaseActionPlugin {
  abstract readonly metadata: PluginMetadata;
  
  // SEALED - LLM cannot modify validation logic
  async validateInput(input: any): Promise<boolean> {
    return this.schema.validate(input);
  }
}
```

### Constraint Validation Pipeline
1. **Definition**: Rules defined in constraint engines
2. **Generation**: LLM generates code following constraints
3. **Validation**: Automatic checking during build/CI
4. **Enforcement**: Sealed classes prevent architectural violations

### Directory Structure
```
constrained-llm-vibes/
├── language-analysis/          # 9-language analysis & recommendations
├── nestjs-plugin-system/       # Production plugin architecture
├── constraint-engine-ts/       # General constraint validation
└── llm-enterprise-research/    # Research context & insights
```

## Language Recommendations

Based on comprehensive analysis:

- **Bun + TypeScript**: Optimal for high-frequency execution (20-40x faster)
- **ReScript**: Best balance - 63% token savings + JavaScript ecosystem  
- **Prolog**: Ultimate expressiveness - 73% token savings (research use)

## Working with This Repository

### When Adding New Constraints
1. Define rules in appropriate constraint engine
2. Test with existing code samples  
3. Update documentation and examples
4. Run full validation suite

### When Extending Plugin Architecture
1. Extend sealed base classes appropriately
2. Maintain architectural constraints
3. Update validation rules
4. Test LLM generation compliance

### When Analyzing New Languages
1. Follow methodology in `language-analysis/`
2. Implement constraint example
3. Measure token efficiency  
4. Update comparative analysis

## Performance Notes

- **Prefer Bun over Node.js** for constraint execution (5-15ms vs 150-300ms startup)
- **Use compiled constraint rules** for maximum performance
- **Batch validation** when possible
- **Cache constraint results** for repeated validations

## Key Files to Understand

- `README.md` - Complete project overview
- `language-analysis/comparisons/final-rankings.md` - Language analysis results
- `nestjs-plugin-system/src/core/base-plugin.abstract.ts` - Sealed architecture
- `constraint-engine-ts/src/core/engine.ts` - Validation engine core