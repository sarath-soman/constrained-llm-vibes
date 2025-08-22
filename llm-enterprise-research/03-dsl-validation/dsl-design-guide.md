# Mini DSL Design and Validation Architecture

A comprehensive guide to creating Domain-Specific Languages (DSLs) that constrain LLM operations while maintaining expressiveness.

## Core Concept

A DSL isn't just simplified syntax - it's a **contract that makes invalid operations impossible to express**. The validation isn't checking if code is "good", it's checking if the contract was fulfilled.

## The Three-Layer DSL Architecture

### Layer 1: Intent DSL (What you want)
Describes business intent in a constrained, unambiguous language.

```typescript
// Instead of: "Add a new field to dancers table"
projection dancers {
  field email: string | null
  field phone?: string  // optional vs nullable is explicit
  index (email) where email != null
  computed fullName = firstName + " " + lastName
  
  validate: {
    email: [isValidEmail, isUnique]
    phone: [isValidPhoneNumber]
  }
  
  audit: {
    track: [email, phone]
    retention: "7_years"
  }
}
```

### Layer 2: Transformation DSL (How to change things)
Defines mechanical transformations with precise patterns.

```typescript
// Not: "refactor this to use sqlPredicate"
transform FindPattern {
  match: `$.filter(x => $body)`
  where: {
    parent: { type: 'TableExpression' }
    hasUnsafeOperations: true
  }
  replace: `$.filter(sqlPredicate(x => $body))`
  validate: [
    OutputMustCompile,
    BehaviorMustBeIdentical,
    PerformanceMustNotDegrade
  ]
}
```

### Layer 3: Validation DSL (What's allowed)
Encodes architectural rules as executable predicates.

```typescript
// Your doing-it-wrong rules, but structured
rule NoBareStringIds {
  ast: TypeAnnotation[value="string"]
  where: {
    name: /.*Id$|.*ID$/
    context: "parameter" | "field" | "return"
  }
  
  suggest: {
    find: nearestImport("@phoenix/model")
    replace: addImport("${extractEntity(node.name)}Id")
    change: TypeAnnotation[value="${extractEntity(node.name)}Id"]
  }
  
  severity: "error"
  autofix: true
}
```

## AST Predicate Language

Think of AST predicates as structural queries with semantic conditions:

### Structural Predicates
```typescript
// Match specific code shapes
predicate UseEffectWithoutDeps {
  match: CallExpression {
    callee: "useEffect"
    arguments: [Function, undefined]  // missing dependency array
  }
  
  context: {
    inComponent: true     // parent is React.FC
    hasStateUsage: true   // references useState in body
    hasPropsUsage: true   // references props in effect
  }
}
```

### Semantic Predicates
```typescript
// Business logic validation
predicate UnsafeUserDataAccess {
  match: CallExpression {
    callee: /db\.(query|execute)/
    arguments: [TemplateString]
  }
  
  where: {
    hasUserInput: containsUserInput(node.arguments),
    notSanitized: !hasSanitization(node.arguments),
    inUserFacingEndpoint: isPublicEndpoint(getContainingFunction(node))
  }
  
  fix: "Use parameterized queries or query builder"
}
```

### Transformation Predicates
```typescript
// Code evolution rules
predicate LegacyEventPattern {
  match: CallExpression {
    callee: "eventBus.emit"
    arguments: [String, Object]
  }
  
  replace: CallExpression {
    callee: "emitTypedEvent"
    arguments: [
      "${args[0]}Event",  // EventType
      args[1]             // payload
    ]
  }
  
  migrate: {
    createEventType: true,
    updateImports: true,
    preserveBackCompatibility: true
  }
}
```

## Concrete DSL Examples

### 1. Command/Query DSL
```typescript
// Clear business intent
command UpdateDancerEmail {
  input: { 
    dancerId: DancerId
    email: Email | null 
  }
  
  authorize: HasPermission("update_dancer") && OwnsAccount(dancerId)
  
  validate: {
    email: [isValidEmail, notDuplicate]
    dancerId: [exists, notSoftDeleted]
  }
  
  execute: {
    update: dancers.set({ email }).where(eq(dancers.id, dancerId))
    audit: { action: "email_update", table: "dancers" }
  }
  
  emits: DancerEmailChanged { dancerId, oldEmail, newEmail }
  
  rollback: {
    condition: emitEventFails
    action: revertDancerEmail
  }
}

// Generated implementation (boilerplate, validatable)
export const updateDancerEmail = accountCommand(
  z.object({ 
    dancerId: DancerIdSchema,
    email: EmailSchema.nullable() 
  }),
  async ({ dancerId, email }, { account, db, user }) => {
    // Generated authorization
    if (!hasPermission(user, "update_dancer")) throw new UnauthorizedError()
    if (!ownsAccount(user, account, dancerId)) throw new ForbiddenError()
    
    // Generated validation
    if (email && !isValidEmail(email)) throw new ValidationError("Invalid email")
    if (await isDuplicateEmail(db, email, dancerId)) throw new DuplicateError()
    
    const dancer = await getDancer(db, dancerId)
    if (!dancer || dancer.deleted) throw new NotFoundError()
    
    // Generated execution with audit
    const oldEmail = dancer.email
    await db.transaction(async (tx) => {
      await tx.update(dancers)
        .set({ email })
        .where(eq(dancers.id, dancerId))
      
      await insertAuditLog(tx, {
        action: "email_update",
        table: "dancers",
        recordId: dancerId,
        oldValue: oldEmail,
        newValue: email,
        userId: user.id
      })
    })
    
    // Generated event emission with rollback
    try {
      await emitTypedEvent('DancerEmailChanged', { 
        dancerId, 
        oldEmail, 
        newEmail: email 
      })
    } catch (error) {
      await revertDancerEmail(db, dancerId, oldEmail)
      throw error
    }
  }
)
```

### 2. Migration DSL
```typescript
migration AddEmailToDancers {
  version: 2024_01_15_001
  
  dependencies: [
    "2024_01_10_001_create_dancers_table"
  ]
  
  up: {
    alter: dancers {
      add: email string nullable
      add: index dancers_email_idx on (email) where email is not null
      add: constraint dancers_email_format check (email ~* '^[^@]+@[^@]+$')
    }
    
    backfill: {
      query: "UPDATE dancers SET email = legacy_email WHERE legacy_email IS NOT NULL"
      batchSize: 1000
      timeout: "30s"
    }
  }
  
  down: {
    alter: dancers {
      drop: constraint dancers_email_format
      drop: index dancers_email_idx  
      drop: column email
    }
  }
  
  validate: [
    NoDataLoss,           // Ensure down migration preserves data
    NoLockingOperations,  // Ensure migration doesn't lock tables
    BackfillSafety,       // Ensure backfill is idempotent
    RollbackSafety        // Ensure rollback always works
  ]
  
  monitoring: {
    track: "email_migration_progress"
    alert: "migration_taking_too_long"
    rollbackTrigger: "error_rate > 5%"
  }
}
```

### 3. Test Scenario DSL
```typescript
// Describes the "what" not the "how"
scenario "Dancer can register for class with waitlist" {
  given: {
    dancer: Factory.dancer({ name: "Alice", email: "alice@example.com" })
    class: Factory.class({ 
      name: "Salsa 101", 
      capacity: 10, 
      enrolled: 10,     // full
      waitlistEnabled: true 
    })
  }
  
  when: dancer.registerFor(class)
  
  then: {
    dancer.waitlisted includes class
    class.waitlist.length = 1
    class.enrolled = 10  // unchanged
    
    email.sent to: dancer.email {
      template: "WaitlistConfirmation"
      data: { className: class.name, position: 1 }
    }
    
    event.emitted: DancerWaitlisted {
      dancerId: dancer.id
      classId: class.id
      position: 1
    }
  }
  
  cleanup: {
    removeFromWaitlist: true
    cleanupEmails: true
  }
}
```

## The Validation Strategy

### 1. Structural Validation (Can this DSL compile?)
```typescript
function validateDSLStructure(dsl: string): AST {
  const ast = parseDSL(dsl)
  
  // Schema validation
  const validation = DSLSchema.safeParse(ast)
  if (!validation.success) {
    throw new DSLStructureError(validation.error)
  }
  
  // Structural consistency
  assert(ast.type in ALLOWED_DSL_TYPES)
  assert(ast.fields.every(f => f.type in ALLOWED_FIELD_TYPES))
  assert(!hasDuplicateFieldNames(ast))
  
  return ast
}
```

### 2. Semantic Validation (Does this make sense?)
```typescript
function validateDSLSemantics(ast: AST, context: ProjectContext) {
  // Reference validation
  assert(referencedTablesExist(ast, context.schema))
  assert(referencedTypesExist(ast, context.types))
  assert(referencedPermissionsExist(ast, context.permissions))
  
  // Business rule validation  
  assert(typesAreCompatible(ast))
  assert(constraintsAreValid(ast))
  assert(authorizationIsComplete(ast))
  
  // Consistency validation
  assert(inputOutputTypesMatch(ast))
  assert(eventsHaveHandlers(ast, context.eventHandlers))
  assert(rollbackIsImplemented(ast))
}
```

### 3. Generation Validation (Is the output correct?)
```typescript
function validateGenerated(input: DSL, output: GeneratedCode, context: ProjectContext) {
  // Architectural compliance
  const violations = runArchitecturalRules(output)
  if (violations.length > 0) {
    throw new ArchitecturalViolationError(violations)
  }
  
  // Behavioral equivalence
  assert(outputImplementsIntent(input, output))
  assert(preservesExistingBehavior(output, context))
  
  // Safety requirements
  assert(hasValidation(output))
  assert(hasErrorHandling(output))
  assert(hasAuditLogging(output))
  assert(hasProperAuthorization(output))
  
  // Test coverage
  assert(generatedTestsPassCoverage(output, 0.9))
  assert(integrationTestsPass(output, context))
}
```

## Implementation Pipeline

Think of it as a compiler pipeline with validation at each stage:

```
English Intent → DSL → AST → Validated AST → Generated Code → Validated Output
     ↓            ↓      ↓         ↓              ↓              ↓
   "I want"    Precise  Tree    Business      Boilerplate    It works
              Language  Form      Rules          Code
     ↓            ↓      ↓         ↓              ↓              ↓
  Structure   Semantic Parse   Business     Architecture    Integration
  Validation  Validation Tree  Validation    Validation     Validation
```

### Stage 1: Intent Capture
```typescript
const intent = captureUserIntent(`
  I want dancers to be able to update their email addresses
  with proper validation and audit logging
`)

const dsl = convertToCommandDSL(intent)
```

### Stage 2: DSL Processing
```typescript
const ast = parseDSL(dsl)
validateStructure(ast)
validateSemantics(ast, projectContext)
```

### Stage 3: Code Generation
```typescript
const generatedCode = generateImplementation(ast, {
  templates: commandTemplates,
  patterns: existingPatterns,
  constraints: architecturalRules
})
```

### Stage 4: Validation and Integration
```typescript
validateGenerated(dsl, generatedCode, projectContext)
runTests(generatedCode)
integrateWithExistingCode(generatedCode)
```

## Key Design Principles

### 1. Make Invalid States Unrepresentable
```typescript
// Bad: Allows inconsistent state
interface User {
  email?: string
  emailVerified?: boolean  // Can be true when email is undefined!
}

// Good: Constrains valid combinations
type User = {
  email: null
} | {
  email: string
  emailVerified: boolean
}
```

### 2. Encode Business Rules as Types
```typescript
// Instead of documentation that says "user IDs are UUIDs"
type UserId = UUID & { readonly __brand: 'UserId' }

// The type system prevents misuse
function getUser(id: UserId): Promise<User>  // ✅
getUser("123")                               // ❌ Type error
getUser(userId)                              // ✅ Works
```

### 3. Make Transformations Mechanical
```typescript
// Not: "make this code better" 
// But: "apply this exact transformation"
const transformation = {
  name: "callback-to-async",
  
  detect: (node: ASTNode) => 
    isFunction(node) && 
    hasCallbackParameter(node) && 
    doesAsyncWork(node),
    
  transform: (node: FunctionNode) => 
    convertToAsyncFunction(node),
    
  validate: (before: ASTNode, after: ASTNode) => 
    behaviorIsEquivalent(before, after) &&
    errorHandlingIsPreserved(before, after)
}
```

The key insight: DSLs aren't about making things easier to write - they're about making wrong things impossible to write. Your validation isn't checking if the code is good - it's proving the transformation from intent to implementation preserved all invariants.