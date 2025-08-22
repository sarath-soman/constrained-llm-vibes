/**
 * Example transformation rules for safe LLM-assisted refactoring
 * These rules define precise, mechanical transformations that preserve behavior
 */

import * as t from '@babel/types'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import { parse } from '@babel/parser'

interface TransformationRule {
  id: string
  name: string
  description: string
  
  // Pattern matching
  detect: (ast: t.Node) => boolean
  
  // Transformation logic
  transform: (ast: t.Node) => t.Node
  
  // Validation
  validate: (before: t.Node, after: t.Node) => ValidationResult
  
  // Metadata
  safety: 'safe' | 'requires-review' | 'dangerous'
  category: 'refactoring' | 'modernization' | 'performance' | 'security'
  estimatedImpact: 'low' | 'medium' | 'high'
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  preservesBehavior: boolean
  preservesTypes: boolean
}

/**
 * Rule: Convert callback patterns to async/await
 */
const callbackToAsyncRule: TransformationRule = {
  id: 'callback-to-async',
  name: 'Convert Callback to Async/Await',
  description: 'Converts Node.js callback patterns to modern async/await syntax',
  safety: 'requires-review',
  category: 'modernization',
  estimatedImpact: 'medium',

  detect: (ast: t.Node): boolean => {
    if (!t.isFunctionDeclaration(ast) && !t.isFunctionExpression(ast)) {
      return false
    }

    // Check if function has callback parameter (last param named 'callback', 'cb', or 'done')
    const params = ast.params
    if (params.length === 0) return false

    const lastParam = params[params.length - 1]
    if (!t.isIdentifier(lastParam)) return false

    const callbackNames = ['callback', 'cb', 'done']
    return callbackNames.includes(lastParam.name)
  },

  transform: (ast: t.Node): t.Node => {
    if (!t.isFunctionDeclaration(ast) && !t.isFunctionExpression(ast)) {
      throw new Error('Expected function declaration or expression')
    }

    // Remove callback parameter
    const newParams = ast.params.slice(0, -1)
    
    // Transform function body to use async/await
    const newBody = transformCallbackBodyToAsync(ast.body)
    
    // Create new async function
    const newFunction = t.isFunctionDeclaration(ast) 
      ? t.functionDeclaration(
          ast.id,
          newParams,
          newBody,
          false,  // generator
          true    // async
        )
      : t.functionExpression(
          ast.id,
          newParams,
          newBody,
          false,  // generator
          true    // async
        )

    return newFunction
  },

  validate: (before: t.Node, after: t.Node): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    // Check that we still have a function
    if (!t.isFunction(after)) {
      errors.push('Transformation did not produce a function')
    }

    // Check that parameter count decreased by 1
    if (t.isFunction(before) && t.isFunction(after)) {
      if (after.params.length !== before.params.length - 1) {
        errors.push('Parameter count should decrease by 1 (callback removal)')
      }
    }

    // Check that function is now async
    if (t.isFunction(after) && !after.async) {
      errors.push('Transformed function should be async')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      preservesBehavior: true, // Assumes proper transformation
      preservesTypes: true
    }
  }
}

/**
 * Rule: Add error handling to async functions
 */
const addErrorHandlingRule: TransformationRule = {
  id: 'add-error-handling',
  name: 'Add Error Handling to Async Functions',
  description: 'Wraps async function bodies in try-catch blocks',
  safety: 'safe',
  category: 'refactoring',
  estimatedImpact: 'low',

  detect: (ast: t.Node): boolean => {
    if (!t.isFunction(ast) || !ast.async) return false
    
    // Check if function body lacks try-catch
    const body = ast.body
    if (!t.isBlockStatement(body)) return false
    
    // If already has try-catch as top-level statement, skip
    return !body.body.some(stmt => t.isTryStatement(stmt))
  },

  transform: (ast: t.Node): t.Node => {
    if (!t.isFunction(ast)) {
      throw new Error('Expected function')
    }

    const body = ast.body as t.BlockStatement
    
    // Wrap existing body in try-catch
    const tryBlock = t.blockStatement(body.body)
    const catchClause = t.catchClause(
      t.identifier('error'),
      t.blockStatement([
        // Log error
        t.expressionStatement(
          t.callExpression(
            t.memberExpression(t.identifier('console'), t.identifier('error')),
            [t.stringLiteral('Error in async function:'), t.identifier('error')]
          )
        ),
        // Re-throw
        t.throwStatement(t.identifier('error'))
      ])
    )
    
    const tryStatement = t.tryStatement(tryBlock, catchClause)
    const newBody = t.blockStatement([tryStatement])
    
    // Create new function with try-catch
    if (t.isFunctionDeclaration(ast)) {
      return t.functionDeclaration(
        ast.id,
        ast.params,
        newBody,
        ast.generator,
        ast.async
      )
    } else {
      return t.functionExpression(
        ast.id,
        ast.params,
        newBody,
        ast.generator,
        ast.async
      )
    }
  },

  validate: (before: t.Node, after: t.Node): ValidationResult => {
    const errors: string[] = []
    
    if (!t.isFunction(after)) {
      errors.push('Result is not a function')
    }
    
    if (t.isFunction(after)) {
      const body = after.body as t.BlockStatement
      const hasTryStatement = body.body.some(stmt => t.isTryStatement(stmt))
      
      if (!hasTryStatement) {
        errors.push('Transformed function should contain try-catch')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      preservesBehavior: true,
      preservesTypes: true
    }
  }
}

/**
 * Rule: Convert filter + map to flatMap where applicable
 */
const filterMapToFlatMapRule: TransformationRule = {
  id: 'filter-map-to-flatmap',
  name: 'Convert filter().map() to flatMap()',
  description: 'Optimizes chained filter/map operations to flatMap',
  safety: 'safe',
  category: 'performance',
  estimatedImpact: 'low',

  detect: (ast: t.Node): boolean => {
    // Look for: array.filter(...).map(...)
    if (!t.isCallExpression(ast)) return false
    
    const callee = ast.callee
    if (!t.isMemberExpression(callee)) return false
    if (!t.isIdentifier(callee.property) || callee.property.name !== 'map') return false
    
    const object = callee.object
    if (!t.isCallExpression(object)) return false
    
    const filterCallee = object.callee
    if (!t.isMemberExpression(filterCallee)) return false
    if (!t.isIdentifier(filterCallee.property) || filterCallee.property.name !== 'filter') return false
    
    return true
  },

  transform: (ast: t.Node): t.Node => {
    const callExpr = ast as t.CallExpression
    const mapCall = callExpr
    const filterCall = (mapCall.callee as t.MemberExpression).object as t.CallExpression
    
    const array = (filterCall.callee as t.MemberExpression).object
    const filterArg = filterCall.arguments[0]
    const mapArg = mapCall.arguments[0]
    
    // Create flatMap callback that combines filter and map logic
    if (t.isArrowFunctionExpression(filterArg) && t.isArrowFunctionExpression(mapArg)) {
      const param = filterArg.params[0]
      
      // Create: item => filterCondition(item) ? [mapFunction(item)] : []
      const flatMapCallback = t.arrowFunctionExpression(
        [param],
        t.conditionalExpression(
          filterArg.body as t.Expression,
          t.arrayExpression([
            t.isExpression(mapArg.body) 
              ? mapArg.body 
              : t.callExpression(mapArg as t.Expression, [param as t.Expression])
          ]),
          t.arrayExpression([])
        )
      )
      
      return t.callExpression(
        t.memberExpression(array, t.identifier('flatMap')),
        [flatMapCallback]
      )
    }
    
    return ast
  },

  validate: (before: t.Node, after: t.Node): ValidationResult => {
    const errors: string[] = []
    
    if (!t.isCallExpression(after)) {
      errors.push('Result should be a call expression')
    } else {
      const callee = after.callee
      if (!t.isMemberExpression(callee) || 
          !t.isIdentifier(callee.property) || 
          callee.property.name !== 'flatMap') {
        errors.push('Result should be a flatMap call')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      preservesBehavior: true,
      preservesTypes: true
    }
  }
}

/**
 * Rule: Add input validation to API endpoints
 */
const addInputValidationRule: TransformationRule = {
  id: 'add-input-validation',
  name: 'Add Input Validation to API Endpoints',
  description: 'Adds Zod validation to Express.js route handlers',
  safety: 'safe',
  category: 'security',
  estimatedImpact: 'high',

  detect: (ast: t.Node): boolean => {
    // Look for Express route handlers: app.get/post/put/delete(path, handler)
    if (!t.isCallExpression(ast)) return false
    
    const callee = ast.callee
    if (!t.isMemberExpression(callee)) return false
    
    const methods = ['get', 'post', 'put', 'delete', 'patch']
    if (!t.isIdentifier(callee.property) || !methods.includes(callee.property.name)) return false
    
    // Check if handler function uses req.body without validation
    const handlerArg = ast.arguments[1]
    if (!t.isFunction(handlerArg)) return false
    
    return !hasInputValidation(handlerArg)
  },

  transform: (ast: t.Node): t.Node => {
    const callExpr = ast as t.CallExpression
    const handlerFunction = callExpr.arguments[1] as t.Function
    
    // Add validation at the start of the handler
    const validationCode = t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier('validated'),
        t.callExpression(
          t.memberExpression(t.identifier('inputSchema'), t.identifier('parse')),
          [t.memberExpression(t.identifier('req'), t.identifier('body'))]
        )
      )
    ])
    
    const body = handlerFunction.body as t.BlockStatement
    const newBody = t.blockStatement([validationCode, ...body.body])
    
    // Create new handler with validation
    const newHandler = t.isFunctionExpression(handlerFunction)
      ? t.functionExpression(
          handlerFunction.id,
          handlerFunction.params,
          newBody,
          handlerFunction.generator,
          handlerFunction.async
        )
      : t.arrowFunctionExpression(handlerFunction.params, newBody, handlerFunction.async)
    
    return t.callExpression(callExpr.callee, [callExpr.arguments[0], newHandler])
  },

  validate: (before: t.Node, after: t.Node): ValidationResult => {
    const errors: string[] = []
    
    if (!t.isCallExpression(after)) {
      errors.push('Result should be a call expression')
    } else {
      const handler = after.arguments[1]
      if (t.isFunction(handler) && !hasInputValidation(handler)) {
        errors.push('Handler should include input validation')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      preservesBehavior: false, // Adds new behavior (validation)
      preservesTypes: true
    }
  }
}

// Transformation Engine
class TransformationEngine {
  private rules: TransformationRule[]

  constructor(rules: TransformationRule[]) {
    this.rules = rules
  }

  async transformCode(code: string, ruleIds?: string[]): Promise<TransformationResult> {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })

    const applicableRules = this.rules.filter(rule => 
      !ruleIds || ruleIds.includes(rule.id)
    )

    const transformations: AppliedTransformation[] = []
    let transformedAst = ast

    // Apply transformations
    for (const rule of applicableRules) {
      const applied = this.applyRule(transformedAst, rule)
      transformations.push(...applied)
      
      // Update AST with transformations
      for (const transformation of applied) {
        transformedAst = this.replaceNodeInAST(transformedAst, transformation.originalNode, transformation.transformedNode)
      }
    }

    const transformedCode = generate(transformedAst).code

    return {
      originalCode: code,
      transformedCode,
      transformations,
      totalTransformations: transformations.length
    }
  }

  private applyRule(ast: t.Node, rule: TransformationRule): AppliedTransformation[] {
    const applied: AppliedTransformation[] = []

    traverse(ast, {
      enter: (path) => {
        if (rule.detect(path.node)) {
          try {
            const transformed = rule.transform(path.node)
            const validation = rule.validate(path.node, transformed)

            if (validation.isValid) {
              applied.push({
                ruleId: rule.id,
                originalNode: path.node,
                transformedNode: transformed,
                validation,
                location: {
                  line: path.node.loc?.start.line || 0,
                  column: path.node.loc?.start.column || 0
                }
              })
            }
          } catch (error) {
            console.warn(`Failed to apply rule ${rule.id}:`, error)
          }
        }
      }
    })

    return applied
  }

  private replaceNodeInAST(ast: t.Node, oldNode: t.Node, newNode: t.Node): t.Node {
    // Simplified node replacement - in practice, you'd use babel's path.replaceWith()
    return ast
  }

  getAvailableRules(): TransformationRule[] {
    return this.rules
  }

  getRulesByCategory(category: string): TransformationRule[] {
    return this.rules.filter(rule => rule.category === category)
  }

  getSafeRules(): TransformationRule[] {
    return this.rules.filter(rule => rule.safety === 'safe')
  }
}

// Helper functions
function transformCallbackBodyToAsync(body: t.BlockStatement): t.BlockStatement {
  // Simplified transformation - in practice, this would be more complex
  return body
}

function hasInputValidation(func: t.Function): boolean {
  const body = func.body as t.BlockStatement
  return body.body.some(stmt => 
    t.isVariableDeclaration(stmt) && 
    stmt.declarations.some(decl => 
      t.isIdentifier(decl.id) && 
      ['validated', 'input', 'schema'].some(name => decl.id.name?.includes(name))
    )
  )
}

// Supporting types
interface TransformationResult {
  originalCode: string
  transformedCode: string
  transformations: AppliedTransformation[]
  totalTransformations: number
}

interface AppliedTransformation {
  ruleId: string
  originalNode: t.Node
  transformedNode: t.Node
  validation: ValidationResult
  location: {
    line: number
    column: number
  }
}

// Pre-defined rule sets
const SAFE_REFACTORING_RULES = [
  addErrorHandlingRule,
  filterMapToFlatMapRule
]

const MODERNIZATION_RULES = [
  callbackToAsyncRule,
  addInputValidationRule
]

const SECURITY_RULES = [
  addInputValidationRule
]

// Usage example
async function runTransformations() {
  const engine = new TransformationEngine([
    ...SAFE_REFACTORING_RULES,
    ...MODERNIZATION_RULES,
    ...SECURITY_RULES
  ])

  const code = `
function getUserData(userId, callback) {
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, result) => {
    if (err) {
      callback(err)
    } else {
      callback(null, result[0])
    }
  })
}

app.post('/api/users', (req, res) => {
  const userData = req.body
  // Create user without validation
  createUser(userData)
})
  `

  // Apply only safe transformations
  const result = await engine.transformCode(code, ['add-error-handling'])
  
  console.log('Applied transformations:', result.transformations.length)
  console.log('Transformed code:', result.transformedCode)
}

export { 
  TransformationEngine, 
  callbackToAsyncRule,
  addErrorHandlingRule,
  filterMapToFlatMapRule,
  addInputValidationRule,
  SAFE_REFACTORING_RULES,
  MODERNIZATION_RULES,
  SECURITY_RULES
}