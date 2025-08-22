/**
 * Example architectural validation system
 * Based on the doing-it-wrong.ts pattern mentioned in the research
 */

interface ArchitecturalRule {
  id: string
  description: string
  pattern?: RegExp
  astMatcher?: (node: any) => boolean
  exceptions?: string[]
  severity: 'error' | 'warning' | 'info'
  autofix?: string | ((violation: Violation) => string)
  scold: string
}

interface Violation {
  ruleId: string
  file: string
  line: number
  column: number
  message: string
  severity: 'error' | 'warning' | 'info'
  canAutofix: boolean
  suggestion?: string
}

const architecturalRules: ArchitecturalRule[] = [
  // Database access rules
  {
    id: "no-direct-database-imports",
    description: "Prevent direct database imports outside model layer",
    pattern: /import.*from.*['"](.*database.*|.*prisma.*|.*drizzle.*)['"]/,
    exceptions: ["packages/model", "migrations", "scripts/admin"],
    severity: "error",
    scold: "Don't import database directly. Import from @company/model instead.",
    autofix: "Replace with import from @company/model"
  },

  // Type safety rules
  {
    id: "no-bare-string-ids",
    description: "IDs should be branded types, not bare strings",
    pattern: /:\s*string.*(?:Id|ID)(?:[,;\)\}]|$)/,
    exceptions: ["test", "migration"],
    severity: "error",
    scold: "Use branded ID types like UserId instead of bare strings",
    autofix: (violation) => `Replace 'string' with '${extractEntityFromContext(violation)}Id'`
  },

  // Security rules
  {
    id: "no-inline-sql",
    description: "Prevent SQL injection vulnerabilities",
    pattern: /sql`|\.query\s*\(/,
    exceptions: ["packages/query-builder"],
    severity: "error",
    scold: "Use parameterized queries or query builder instead of inline SQL"
  },

  // Architecture boundaries
  {
    id: "no-cross-domain-imports",
    description: "Domains should not import from each other directly",
    pattern: /import.*from.*['"](.*\/(?:users|payments|notifications|billing)\/).*['"]/,
    exceptions: ["packages/shared", "packages/types"],
    severity: "error",
    scold: "Domains should communicate through events, not direct imports"
  },

  // Error handling patterns
  {
    id: "async-functions-must-handle-errors",
    description: "Async functions must have proper error handling",
    astMatcher: (node) => 
      node.type === 'FunctionDeclaration' && 
      node.async && 
      !hasErrorHandling(node),
    severity: "warning",
    scold: "Async functions should include try-catch or proper error propagation"
  },

  // Event emission rules
  {
    id: "events-must-be-typed",
    description: "Event emissions must use typed events",
    pattern: /eventBus\.emit\s*\(\s*['"][^'"]+['"]/,
    severity: "error",
    scold: "Use emitTypedEvent() instead of raw eventBus.emit()",
    autofix: "Convert to emitTypedEvent with proper typing"
  },

  // API design rules
  {
    id: "endpoints-must-have-auth",
    description: "API endpoints must include authorization",
    astMatcher: (node) =>
      isApiEndpoint(node) && 
      !hasAuthMiddleware(node) && 
      !isPublicEndpoint(node),
    severity: "error",
    scold: "API endpoints must include authorization middleware or be explicitly marked as public"
  },

  // Performance rules
  {
    id: "no-n-plus-one-queries",
    description: "Prevent N+1 query patterns",
    pattern: /\.(map|forEach)\s*\([^)]*\bdb\./,
    severity: "warning",
    scold: "Potential N+1 query detected. Consider using batch operations or includes."
  },

  // Testing rules
  {
    id: "tests-must-be-deterministic",
    description: "Tests should not depend on current time or random values",
    pattern: /(?:new Date\(\)|Date\.now\(\)|Math\.random\(\))/,
    exceptions: ["factories", "fixtures"],
    severity: "warning",
    scold: "Tests should use mocked time/random values for determinism"
  }
]

class ArchitecturalValidator {
  private rules: ArchitecturalRule[]

  constructor(rules: ArchitecturalRule[]) {
    this.rules = rules
  }

  async validateFile(filePath: string): Promise<Violation[]> {
    const content = await fs.readFile(filePath, 'utf-8')
    const violations: Violation[] = []

    for (const rule of this.rules) {
      if (this.isFileExcepted(filePath, rule.exceptions)) {
        continue
      }

      // Pattern-based validation
      if (rule.pattern) {
        const matches = this.findPatternMatches(content, rule.pattern)
        for (const match of matches) {
          violations.push({
            ruleId: rule.id,
            file: filePath,
            line: match.line,
            column: match.column,
            message: rule.scold,
            severity: rule.severity,
            canAutofix: !!rule.autofix,
            suggestion: typeof rule.autofix === 'string' ? rule.autofix : undefined
          })
        }
      }

      // AST-based validation
      if (rule.astMatcher) {
        const ast = await this.parseAST(content)
        const astViolations = this.validateAST(ast, rule, filePath)
        violations.push(...astViolations)
      }
    }

    return violations
  }

  async validateProject(projectPath: string): Promise<Violation[]> {
    const files = await this.findRelevantFiles(projectPath)
    const allViolations: Violation[] = []

    for (const file of files) {
      const violations = await this.validateFile(file)
      allViolations.push(...violations)
    }

    return allViolations
  }

  async autofix(violations: Violation[]): Promise<void> {
    const fixableViolations = violations.filter(v => v.canAutofix)
    
    for (const violation of fixableViolations) {
      const rule = this.rules.find(r => r.id === violation.ruleId)
      if (rule?.autofix) {
        await this.applyAutofix(violation, rule.autofix)
      }
    }
  }

  private isFileExcepted(filePath: string, exceptions?: string[]): boolean {
    if (!exceptions) return false
    return exceptions.some(exception => filePath.includes(exception))
  }

  private findPatternMatches(content: string, pattern: RegExp): Array<{line: number, column: number}> {
    const lines = content.split('\n')
    const matches: Array<{line: number, column: number}> = []

    lines.forEach((line, lineIndex) => {
      let match
      while ((match = pattern.exec(line)) !== null) {
        matches.push({
          line: lineIndex + 1,
          column: match.index + 1
        })
      }
    })

    return matches
  }

  private async parseAST(content: string): Promise<any> {
    // Use your preferred AST parser (e.g., @babel/parser, typescript)
    // This is a simplified example
    const parser = require('@babel/parser')
    return parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })
  }

  private validateAST(ast: any, rule: ArchitecturalRule, filePath: string): Violation[] {
    const violations: Violation[] = []
    
    // Traverse AST and apply rule.astMatcher
    const traverse = require('@babel/traverse').default
    
    traverse(ast, {
      enter(path: any) {
        if (rule.astMatcher && rule.astMatcher(path.node)) {
          violations.push({
            ruleId: rule.id,
            file: filePath,
            line: path.node.loc?.start.line || 0,
            column: path.node.loc?.start.column || 0,
            message: rule.scold,
            severity: rule.severity,
            canAutofix: !!rule.autofix
          })
        }
      }
    })

    return violations
  }

  private async findRelevantFiles(projectPath: string): Promise<string[]> {
    // Find all TypeScript/JavaScript files, excluding node_modules
    const glob = require('glob')
    return glob.sync(`${projectPath}/**/*.{ts,tsx,js,jsx}`, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    })
  }

  private async applyAutofix(violation: Violation, autofix: string | ((v: Violation) => string)): Promise<void> {
    // Implementation for applying autofixes
    // This would modify the source file to fix the violation
    console.log(`Applying autofix for ${violation.ruleId} in ${violation.file}`)
  }
}

// Helper functions for AST matchers
function hasErrorHandling(node: any): boolean {
  // Check if function contains try-catch or throws
  return false // Simplified
}

function isApiEndpoint(node: any): boolean {
  // Check if this is an API route handler
  return false // Simplified
}

function hasAuthMiddleware(node: any): boolean {
  // Check if endpoint has auth middleware
  return false // Simplified
}

function isPublicEndpoint(node: any): boolean {
  // Check if endpoint is marked as public
  return false // Simplified
}

function extractEntityFromContext(violation: Violation): string {
  // Extract entity name from the context (e.g., "userId" -> "User")
  return "Entity" // Simplified
}

// Usage example
async function runValidation() {
  const validator = new ArchitecturalValidator(architecturalRules)
  
  // Validate entire project
  const violations = await validator.validateProject('./src')
  
  // Report violations
  if (violations.length > 0) {
    console.error(`Found ${violations.length} architectural violations:`)
    violations.forEach(violation => {
      console.error(`${violation.severity.toUpperCase()}: ${violation.message}`)
      console.error(`  at ${violation.file}:${violation.line}:${violation.column}`)
    })
    
    // Auto-fix what we can
    await validator.autofix(violations)
    
    // Exit with error code if there are errors
    const errors = violations.filter(v => v.severity === 'error')
    if (errors.length > 0) {
      process.exit(1)
    }
  } else {
    console.log('✅ No architectural violations found')
  }
}

export { ArchitecturalValidator, architecturalRules, runValidation }