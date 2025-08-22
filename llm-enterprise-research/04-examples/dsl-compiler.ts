/**
 * Example DSL compiler for command/query patterns
 * Demonstrates how to create constrained languages that LLMs can safely target
 */

import { z } from 'zod'

// DSL Schema Definition
const CommandSchema = z.object({
  name: z.string(),
  input: z.record(z.string()), // field -> type mapping
  authorize: z.array(z.string()).optional(),
  validate: z.record(z.array(z.string())).optional(), // field -> validators
  execute: z.object({
    action: z.enum(['create', 'update', 'delete']),
    table: z.string(),
    conditions: z.record(z.string()).optional()
  }),
  emits: z.string().optional(),
  audit: z.object({
    action: z.string(),
    table: z.string()
  }).optional()
})

const QuerySchema = z.object({
  name: z.string(),
  input: z.record(z.string()).optional(),
  authorize: z.array(z.string()).optional(),
  select: z.object({
    from: z.string(),
    fields: z.array(z.string()).optional(),
    where: z.record(z.string()).optional(),
    orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
    limit: z.number().optional()
  }),
  cache: z.object({
    key: z.string(),
    ttl: z.number()
  }).optional()
})

type CommandDefinition = z.infer<typeof CommandSchema>
type QueryDefinition = z.infer<typeof QuerySchema>

// DSL Parser
class DSLParser {
  parseCommand(dsl: string): CommandDefinition {
    // In a real implementation, this would parse a custom DSL syntax
    // For now, we'll assume JSON input for simplicity
    const parsed = JSON.parse(dsl)
    return CommandSchema.parse(parsed)
  }

  parseQuery(dsl: string): QueryDefinition {
    const parsed = JSON.parse(dsl)
    return QuerySchema.parse(parsed)
  }
}

// Code Generator
class CodeGenerator {
  private project: ProjectContext

  constructor(project: ProjectContext) {
    this.project = project
  }

  generateCommand(definition: CommandDefinition): GeneratedCommand {
    const inputValidation = this.generateInputValidation(definition.input, definition.validate)
    const authorization = this.generateAuthorization(definition.authorize)
    const execution = this.generateExecution(definition.execute)
    const eventEmission = this.generateEventEmission(definition.emits)
    const auditLogging = this.generateAuditLogging(definition.audit)

    const code = `
export const ${definition.name} = accountCommand(
  ${inputValidation.schema},
  async (${inputValidation.params}, { account, db, user }) => {
    ${authorization}
    
    ${inputValidation.validation}
    
    ${execution}
    
    ${auditLogging}
    
    ${eventEmission}
  }
)
    `.trim()

    return {
      name: definition.name,
      code,
      imports: this.generateImports(definition),
      types: this.generateTypes(definition),
      tests: this.generateTests(definition)
    }
  }

  generateQuery(definition: QueryDefinition): GeneratedQuery {
    const inputValidation = this.generateInputValidation(definition.input || {})
    const authorization = this.generateAuthorization(definition.authorize)
    const queryExecution = this.generateQueryExecution(definition.select)
    const caching = this.generateCaching(definition.cache)

    const code = `
export const ${definition.name} = accountQuery(
  ${inputValidation.schema},
  async (${inputValidation.params}, { account, db, user }) => {
    ${authorization}
    
    ${inputValidation.validation}
    
    ${caching.check}
    
    const result = ${queryExecution}
    
    ${caching.store}
    
    return result
  }
)
    `.trim()

    return {
      name: definition.name,
      code,
      imports: this.generateImports(definition),
      types: this.generateTypes(definition),
      tests: this.generateTests(definition)
    }
  }

  private generateInputValidation(input: Record<string, string>, validators?: Record<string, string[]>) {
    const schemaFields: string[] = []
    const validationChecks: string[] = []
    const params: string[] = []

    for (const [field, type] of Object.entries(input)) {
      // Generate Zod schema
      const zodType = this.mapTypeToZod(type)
      schemaFields.push(`${field}: ${zodType}`)
      params.push(field)

      // Generate custom validation
      if (validators?.[field]) {
        for (const validator of validators[field]) {
          validationChecks.push(`
    if (!${validator}(${field})) {
      throw new ValidationError('${field} validation failed: ${validator}')
    }`)
        }
      }
    }

    return {
      schema: `z.object({${schemaFields.join(', ')}})`,
      params: `{ ${params.join(', ')} }`,
      validation: validationChecks.join('\n')
    }
  }

  private generateAuthorization(permissions?: string[]): string {
    if (!permissions || permissions.length === 0) return ''

    const checks = permissions.map(permission => 
      `hasPermission(user, "${permission}")`
    ).join(' && ')

    return `
    if (!(${checks})) {
      throw new UnauthorizedError('Insufficient permissions')
    }`
  }

  private generateExecution(execution: CommandDefinition['execute']): string {
    const { action, table, conditions } = execution

    switch (action) {
      case 'create':
        return `
    const result = await db.${table}.create({
      data: { ${Object.keys(conditions || {}).map(k => `${k}`).join(', ')} }
    })`

      case 'update':
        const whereClause = conditions ? 
          Object.entries(conditions).map(([k, v]) => `${k}: ${v}`).join(', ') : 
          'id'
        return `
    const result = await db.${table}.update({
      where: { ${whereClause} },
      data: { ${Object.keys(conditions || {}).map(k => `${k}`).join(', ')} }
    })`

      case 'delete':
        return `
    const result = await db.${table}.delete({
      where: { ${Object.keys(conditions || {}).map(k => `${k}: ${k}`).join(', ')} }
    })`

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }

  private generateQueryExecution(select: QueryDefinition['select']): string {
    const { from, fields, where, orderBy, limit } = select

    const selectClause = fields ? `select: { ${fields.map(f => `${f}: true`).join(', ')} },` : ''
    const whereClause = where ? 
      `where: { ${Object.entries(where).map(([k, v]) => `${k}: ${v}`).join(', ')} },` : ''
    const orderByClause = orderBy ? 
      `orderBy: { ${Object.entries(orderBy).map(([k, v]) => `${k}: '${v}'`).join(', ')} },` : ''
    const limitClause = limit ? `take: ${limit},` : ''

    return `await db.${from}.findMany({
      ${selectClause}
      ${whereClause}
      ${orderByClause}
      ${limitClause}
    })`
  }

  private generateEventEmission(eventName?: string): string {
    if (!eventName) return ''

    return `
    await emitTypedEvent('${eventName}', {
      // Event payload would be generated based on the command context
    })`
  }

  private generateAuditLogging(audit?: CommandDefinition['audit']): string {
    if (!audit) return ''

    return `
    await insertAuditLog(db, {
      action: '${audit.action}',
      table: '${audit.table}',
      userId: user.id,
      timestamp: new Date()
    })`
  }

  private generateCaching(cache?: QueryDefinition['cache']) {
    if (!cache) return { check: '', store: '' }

    return {
      check: `
    const cached = await getFromCache('${cache.key}')
    if (cached) return cached`,
      store: `
    await setCache('${cache.key}', result, ${cache.ttl})`
    }
  }

  private generateImports(definition: CommandDefinition | QueryDefinition): string[] {
    const imports = [
      "import { z } from 'zod'",
      "import { accountCommand, accountQuery } from '@company/framework'",
      "import { db } from '@company/database'",
      "import { hasPermission, UnauthorizedError, ValidationError } from '@company/auth'"
    ]

    if ('emits' in definition && definition.emits) {
      imports.push("import { emitTypedEvent } from '@company/events'")
    }

    if ('audit' in definition && definition.audit) {
      imports.push("import { insertAuditLog } from '@company/audit'")
    }

    return imports
  }

  private generateTypes(definition: CommandDefinition | QueryDefinition): string[] {
    const types: string[] = []

    // Generate input type
    const inputFields = Object.entries(definition.input || {})
      .map(([field, type]) => `${field}: ${this.mapTypeToTypeScript(type)}`)
    
    if (inputFields.length > 0) {
      types.push(`
export interface ${definition.name}Input {
  ${inputFields.join('\n  ')}
}`)
    }

    // Generate result type for queries
    if ('select' in definition) {
      types.push(`
export interface ${definition.name}Result {
  // Generated based on select fields
}`)
    }

    return types
  }

  private generateTests(definition: CommandDefinition | QueryDefinition): string[] {
    const tests: string[] = []

    // Happy path test
    tests.push(`
describe('${definition.name}', () => {
  it('should execute successfully with valid input', async () => {
    // Test implementation would be generated
  })

  it('should throw validation error with invalid input', async () => {
    // Test implementation would be generated
  })

  it('should throw authorization error without permissions', async () => {
    // Test implementation would be generated  
  })
})`)

    return tests
  }

  private mapTypeToZod(type: string): string {
    const mapping: Record<string, string> = {
      'string': 'z.string()',
      'number': 'z.number()',
      'boolean': 'z.boolean()',
      'Date': 'z.date()',
      'string | null': 'z.string().nullable()',
      'number | null': 'z.number().nullable()'
    }
    return mapping[type] || 'z.unknown()'
  }

  private mapTypeToTypeScript(type: string): string {
    // Direct mapping for TypeScript types
    return type
  }
}

// Validator
class DSLValidator {
  private project: ProjectContext

  constructor(project: ProjectContext) {
    this.project = project
  }

  validateCommand(definition: CommandDefinition): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate table exists
    if (!this.project.tables.includes(definition.execute.table)) {
      errors.push(`Table '${definition.execute.table}' does not exist`)
    }

    // Validate input types
    for (const [field, type] of Object.entries(definition.input)) {
      if (!this.isValidType(type)) {
        errors.push(`Invalid type '${type}' for field '${field}'`)
      }
    }

    // Validate permissions exist
    for (const permission of definition.authorize || []) {
      if (!this.project.permissions.includes(permission)) {
        warnings.push(`Permission '${permission}' is not defined`)
      }
    }

    // Validate event types exist
    if (definition.emits && !this.project.eventTypes.includes(definition.emits)) {
      errors.push(`Event type '${definition.emits}' is not defined`)
    }

    return { errors, warnings, isValid: errors.length === 0 }
  }

  private isValidType(type: string): boolean {
    const validTypes = ['string', 'number', 'boolean', 'Date', 'string | null', 'number | null']
    return validTypes.includes(type) || this.project.customTypes.includes(type)
  }
}

// Supporting types
interface ProjectContext {
  tables: string[]
  permissions: string[]
  eventTypes: string[]
  customTypes: string[]
}

interface GeneratedCommand {
  name: string
  code: string
  imports: string[]
  types: string[]
  tests: string[]
}

interface GeneratedQuery {
  name: string
  code: string
  imports: string[]
  types: string[]
  tests: string[]
}

interface ValidationResult {
  errors: string[]
  warnings: string[]
  isValid: boolean
}

// Usage example
class DSLCompiler {
  private parser: DSLParser
  private generator: CodeGenerator
  private validator: DSLValidator

  constructor(project: ProjectContext) {
    this.parser = new DSLParser()
    this.generator = new CodeGenerator(project)
    this.validator = new DSLValidator(project)
  }

  async compileCommand(dslSource: string): Promise<GeneratedCommand> {
    // Parse DSL
    const definition = this.parser.parseCommand(dslSource)
    
    // Validate
    const validation = this.validator.validateCommand(definition)
    if (!validation.isValid) {
      throw new Error(`DSL validation failed: ${validation.errors.join(', ')}`)
    }

    // Generate code
    const result = this.generator.generateCommand(definition)
    
    // Validate generated code
    await this.validateGeneratedCode(result.code)
    
    return result
  }

  private async validateGeneratedCode(code: string): Promise<void> {
    // Run the architectural validation system on generated code
    // This ensures LLM-generated DSL still produces valid code
    const validator = new (await import('./doing-it-wrong-example')).ArchitecturalValidator([])
    const violations = await validator.validateFile('generated.ts')
    
    if (violations.length > 0) {
      throw new Error(`Generated code violates architectural rules: ${violations.map(v => v.message).join(', ')}`)
    }
  }
}

// Example DSL usage
const exampleCommandDSL = `{
  "name": "updateUserEmail",
  "input": {
    "userId": "string",
    "email": "string"
  },
  "authorize": ["update_user"],
  "validate": {
    "email": ["isValidEmail", "isNotDuplicate"],
    "userId": ["exists"]
  },
  "execute": {
    "action": "update",
    "table": "users",
    "conditions": {
      "id": "userId"
    }
  },
  "emits": "UserEmailUpdated",
  "audit": {
    "action": "email_update",
    "table": "users"
  }
}`

// This would generate safe, validated code that LLMs can target
export { DSLCompiler, DSLParser, CodeGenerator, DSLValidator }