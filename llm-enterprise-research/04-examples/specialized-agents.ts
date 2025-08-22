/**
 * Example specialized agents for LLM-assisted development
 * These agents have narrow, opinionated expertise areas
 */

interface AgentConfig {
  name: string
  domain: string
  expertise: string[]
  personality: string
  constraints: string[]
  outputFormat: 'critique' | 'suggestions' | 'code' | 'questions'
}

interface AgentContext {
  codebase: string
  file: string
  function?: string
  userIntent: string
  existingPatterns: Record<string, any>
}

interface AgentResponse {
  findings: string[]
  recommendations: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  followUpQuestions?: string[]
  codeExamples?: string[]
}

/**
 * Security-focused agent - paranoid but helpful
 */
class SecurityKris {
  private config: AgentConfig = {
    name: "SecurityKris",
    domain: "security-review",
    expertise: ["crypto", "auth", "data-privacy", "input-validation", "sql-injection", "xss"],
    personality: "paranoid-but-helpful",
    constraints: [
      "Always assume malicious input",
      "Zero trust architecture",
      "Defense in depth",
      "Fail securely"
    ],
    outputFormat: 'critique'
  }

  async reviewCode(code: string, context: AgentContext): Promise<AgentResponse> {
    const findings: string[] = []
    const recommendations: string[] = []
    let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low'

    // Crypto analysis
    if (this.hasCryptoOperations(code)) {
      const cryptoIssues = this.analyzeCrypto(code)
      findings.push(...cryptoIssues.findings)
      recommendations.push(...cryptoIssues.recommendations)
      maxSeverity = this.escalateSeverity(maxSeverity, cryptoIssues.severity)
    }

    // Authentication analysis
    if (this.hasAuthLogic(code)) {
      const authIssues = this.analyzeAuth(code)
      findings.push(...authIssues.findings)
      recommendations.push(...authIssues.recommendations)
      maxSeverity = this.escalateSeverity(maxSeverity, authIssues.severity)
    }

    // Input validation analysis
    const inputIssues = this.analyzeInputValidation(code)
    findings.push(...inputIssues.findings)
    recommendations.push(...inputIssues.recommendations)
    maxSeverity = this.escalateSeverity(maxSeverity, inputIssues.severity)

    // Data exposure analysis
    const dataIssues = this.analyzeDataExposure(code)
    findings.push(...dataIssues.findings)
    recommendations.push(...dataIssues.recommendations)
    maxSeverity = this.escalateSeverity(maxSeverity, dataIssues.severity)

    return {
      findings,
      recommendations,
      severity: maxSeverity,
      confidence: 0.85,
      followUpQuestions: [
        "What's the threat model for this component?",
        "Who can access this endpoint/function?",
        "What happens if this fails in production?"
      ],
      codeExamples: this.generateSecureExamples(context)
    }
  }

  private hasCryptoOperations(code: string): boolean {
    return /crypto|encrypt|decrypt|hash|bcrypt|jwt|password/.test(code)
  }

  private hasAuthLogic(code: string): boolean {
    return /auth|login|token|session|permission|role/.test(code)
  }

  private analyzeCrypto(code: string) {
    const findings: string[] = []
    const recommendations: string[] = []
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

    if (code.includes('md5') || code.includes('sha1')) {
      findings.push("Using deprecated hash algorithms (MD5/SHA1)")
      recommendations.push("Use SHA-256 or better for hashing")
      severity = 'high'
    }

    if (code.includes('Math.random()') && code.includes('password')) {
      findings.push("Using Math.random() for password generation")
      recommendations.push("Use crypto.randomBytes() for cryptographic randomness")
      severity = 'critical'
    }

    return { findings, recommendations, severity }
  }

  private analyzeAuth(code: string) {
    const findings: string[] = []
    const recommendations: string[] = []
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

    if (code.includes('password') && !code.includes('hash')) {
      findings.push("Password handling without apparent hashing")
      recommendations.push("Ensure passwords are properly hashed before storage")
      severity = 'critical'
    }

    return { findings, recommendations, severity }
  }

  private analyzeInputValidation(code: string) {
    const findings: string[] = []
    const recommendations: string[] = []
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

    if (code.includes('req.body') && !code.includes('validate')) {
      findings.push("Request body used without apparent validation")
      recommendations.push("Add input validation using Zod or similar")
      severity = 'medium'
    }

    if (code.includes('sql') && code.includes('${')) {
      findings.push("Potential SQL injection via template strings")
      recommendations.push("Use parameterized queries or query builders")
      severity = 'critical'
    }

    return { findings, recommendations, severity }
  }

  private analyzeDataExposure(code: string) {
    const findings: string[] = []
    const recommendations: string[] = []
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

    if (code.includes('console.log') && code.includes('password')) {
      findings.push("Potential password logging")
      recommendations.push("Remove or sanitize sensitive data from logs")
      severity = 'high'
    }

    return { findings, recommendations, severity }
  }

  private escalateSeverity(current: string, newSeverity: string): 'low' | 'medium' | 'high' | 'critical' {
    const levels = ['low', 'medium', 'high', 'critical']
    const currentLevel = levels.indexOf(current)
    const newLevel = levels.indexOf(newSeverity)
    return levels[Math.max(currentLevel, newLevel)] as 'low' | 'medium' | 'high' | 'critical'
  }

  private generateSecureExamples(context: AgentContext): string[] {
    return [
      "// Secure password hashing\nconst hashedPassword = await bcrypt.hash(password, 12)",
      "// Input validation\nconst validated = UserSchema.parse(req.body)",
      "// Parameterized query\nconst user = await db.query('SELECT * FROM users WHERE id = $1', [userId])"
    ]
  }
}

/**
 * Chaos engineering agent - creatively destructive
 */
class ChaosDancer {
  private config: AgentConfig = {
    name: "ChaosDancer", 
    domain: "failure-modes",
    expertise: ["edge-cases", "user-weaponization", "system-limits", "failure-scenarios"],
    personality: "creatively-destructive",
    constraints: [
      "Assume users will break everything",
      "Murphy's law applies",
      "If it can fail, it will fail",
      "Optimize for chaos resistance"
    ],
    outputFormat: 'questions'
  }

  async analyzeFeature(code: string, context: AgentContext): Promise<AgentResponse> {
    const findings: string[] = []
    const recommendations: string[] = []

    // How will users weaponize this?
    const weaponization = this.predictUserWeaponization(code, context)
    findings.push(...weaponization.findings)
    recommendations.push(...weaponization.recommendations)

    // What edge cases aren't handled?
    const edgeCases = this.findUnhandledEdgeCases(code)
    findings.push(...edgeCases.findings)
    recommendations.push(...edgeCases.recommendations)

    // What happens under load?
    const scalingIssues = this.identifyBottlenecks(code)
    findings.push(...scalingIssues.findings)
    recommendations.push(...scalingIssues.recommendations)

    // What external dependencies can fail?
    const dependencyRisks = this.analyzeDependencyRisks(code)
    findings.push(...dependencyRisks.findings)
    recommendations.push(...dependencyRisks.recommendations)

    return {
      findings,
      recommendations,
      severity: 'medium',
      confidence: 0.7,
      followUpQuestions: [
        "What happens if this takes 10x longer than expected?",
        "How would a malicious user abuse this feature?",
        "What if the database is readonly?",
        "What if this gets 1000x more traffic?",
        "What happens when external APIs are down?",
        "How does this behave with corrupt data?",
        "What if users send garbage input?"
      ]
    }
  }

  private predictUserWeaponization(code: string, context: AgentContext) {
    const findings: string[] = []
    const recommendations: string[] = []

    if (code.includes('upload') || code.includes('file')) {
      findings.push("File upload functionality can be weaponized")
      recommendations.push("Implement file type validation, size limits, virus scanning")
    }

    if (code.includes('search') || code.includes('filter')) {
      findings.push("Search functionality can be used for resource exhaustion")
      recommendations.push("Add pagination, query complexity limits, rate limiting")
    }

    if (code.includes('for') || code.includes('map') || code.includes('forEach')) {
      findings.push("Loops can be exploited with large datasets")
      recommendations.push("Add iteration limits, use streaming for large datasets")
    }

    return { findings, recommendations }
  }

  private findUnhandledEdgeCases(code: string) {
    const findings: string[] = []
    const recommendations: string[] = []

    if (code.includes('parseInt') && !code.includes('isNaN')) {
      findings.push("parseInt without NaN checking")
      recommendations.push("Handle NaN results from parseInt")
    }

    if (code.includes('array[0]') && !code.includes('length')) {
      findings.push("Array access without length checking")
      recommendations.push("Check array length before accessing elements")
    }

    return { findings, recommendations }
  }

  private identifyBottlenecks(code: string) {
    const findings: string[] = []
    const recommendations: string[] = []

    if (code.includes('await') && code.includes('for')) {
      findings.push("Sequential async operations in loop")
      recommendations.push("Consider Promise.all() for parallel execution")
    }

    if (code.includes('JSON.parse') && !code.includes('try')) {
      findings.push("JSON parsing without error handling")
      recommendations.push("Wrap JSON.parse in try-catch for malformed input")
    }

    return { findings, recommendations }
  }

  private analyzeDependencyRisks(code: string) {
    const findings: string[] = []
    const recommendations: string[] = []

    if (code.includes('fetch') || code.includes('axios')) {
      findings.push("External API dependency without apparent error handling")
      recommendations.push("Add timeout, retry logic, and fallback strategies")
    }

    if (code.includes('cache') && !code.includes('fallback')) {
      findings.push("Cache dependency without fallback")
      recommendations.push("Implement cache-miss fallback strategies")
    }

    return { findings, recommendations }
  }
}

/**
 * Performance optimization agent - obsessed with efficiency
 */
class PerformancePedant {
  private config: AgentConfig = {
    name: "PerformancePedant",
    domain: "performance-optimization", 
    expertise: ["algorithms", "database-queries", "caching", "memory-usage"],
    personality: "obsessively-efficient",
    constraints: [
      "Optimize for the 99th percentile",
      "Memory is precious",
      "Database calls are expensive", 
      "Premature optimization is evil, but so is premature pessimization"
    ],
    outputFormat: 'suggestions'
  }

  async optimizeCode(code: string, context: AgentContext): Promise<AgentResponse> {
    const findings: string[] = []
    const recommendations: string[] = []

    // Algorithm analysis
    const algoIssues = this.analyzeAlgorithmComplexity(code)
    findings.push(...algoIssues.findings)
    recommendations.push(...algoIssues.recommendations)

    // Database query analysis
    const dbIssues = this.analyzeDatabaseQueries(code)
    findings.push(...dbIssues.findings)
    recommendations.push(...dbIssues.recommendations)

    // Memory usage analysis  
    const memoryIssues = this.analyzeMemoryUsage(code)
    findings.push(...memoryIssues.findings)
    recommendations.push(...memoryIssues.recommendations)

    return {
      findings,
      recommendations,
      severity: 'low',
      confidence: 0.8,
      codeExamples: this.generateOptimizedExamples(code)
    }
  }

  private analyzeAlgorithmComplexity(code: string) {
    const findings: string[] = []
    const recommendations: string[] = []

    if (code.includes('nested loops') || (code.match(/for/g) || []).length >= 2) {
      findings.push("Potential O(n²) algorithm detected")
      recommendations.push("Consider using maps/sets for O(1) lookups instead of nested loops")
    }

    return { findings, recommendations }
  }

  private analyzeDatabaseQueries(code: string) {
    const findings: string[] = []
    const recommendations: string[] = []

    if (code.includes('map') && code.includes('await db')) {
      findings.push("N+1 query pattern detected")
      recommendations.push("Use batch queries or includes to reduce database round trips")
    }

    return { findings, recommendations }
  }

  private analyzeMemoryUsage(code: string) {
    const findings: string[] = []
    const recommendations: string[] = []

    if (code.includes('map') && code.includes('large')) {
      findings.push("Potential memory issue with large datasets")
      recommendations.push("Consider using streaming or pagination for large datasets")
    }

    return { findings, recommendations }
  }

  private generateOptimizedExamples(code: string): string[] {
    return [
      "// Use Map for O(1) lookups\nconst userMap = new Map(users.map(u => [u.id, u]))",
      "// Batch database operations\nconst users = await db.user.findMany({ where: { id: { in: userIds } } })",
      "// Stream large datasets\nfor await (const batch of getBatchedUsers()) { /* process batch */ }"
    ]
  }
}

/**
 * Agent orchestrator - coordinates multiple agents
 */
class AgentOrchestrator {
  private agents: Map<string, any> = new Map()

  constructor() {
    this.agents.set('security', new SecurityKris())
    this.agents.set('chaos', new ChaosDancer())
    this.agents.set('performance', new PerformancePedant())
  }

  async reviewCode(code: string, context: AgentContext): Promise<{
    securityReview: AgentResponse
    chaosAnalysis: AgentResponse  
    performanceReview: AgentResponse
    overallAssessment: AgentResponse
  }> {
    // Run all agents in parallel
    const [securityReview, chaosAnalysis, performanceReview] = await Promise.all([
      this.agents.get('security')!.reviewCode(code, context),
      this.agents.get('chaos')!.analyzeFeature(code, context),
      this.agents.get('performance')!.optimizeCode(code, context)
    ])

    // Synthesize overall assessment
    const overallAssessment = this.synthesizeAssessment([
      securityReview,
      chaosAnalysis, 
      performanceReview
    ])

    return {
      securityReview,
      chaosAnalysis,
      performanceReview,
      overallAssessment
    }
  }

  private synthesizeAssessment(reviews: AgentResponse[]): AgentResponse {
    const allFindings = reviews.flatMap(r => r.findings)
    const allRecommendations = reviews.flatMap(r => r.recommendations)
    
    const highestSeverity = reviews.reduce((max, review) => {
      const levels = ['low', 'medium', 'high', 'critical']
      return levels.indexOf(review.severity) > levels.indexOf(max) ? review.severity : max
    }, 'low' as 'low' | 'medium' | 'high' | 'critical')

    return {
      findings: [`Overall assessment: ${allFindings.length} issues found across security, chaos, and performance domains`],
      recommendations: [
        "Address critical security issues first",
        "Implement chaos testing for edge cases",
        "Profile performance in production-like environment",
        ...allRecommendations.slice(0, 3) // Top 3 recommendations
      ],
      severity: highestSeverity,
      confidence: 0.9
    }
  }
}

// Usage example
async function runAgentReview() {
  const code = `
    async function updateUserEmail(userId: string, email: string) {
      const user = await db.user.findUnique({ where: { id: userId } })
      await db.user.update({
        where: { id: userId },
        data: { email }
      })
      return user
    }
  `

  const context: AgentContext = {
    codebase: "enterprise-app",
    file: "user-service.ts", 
    function: "updateUserEmail",
    userIntent: "Allow users to update their email addresses",
    existingPatterns: {}
  }

  const orchestrator = new AgentOrchestrator()
  const review = await orchestrator.reviewCode(code, context)

  console.log('Security Review:', review.securityReview)
  console.log('Chaos Analysis:', review.chaosAnalysis)
  console.log('Performance Review:', review.performanceReview)
  console.log('Overall Assessment:', review.overallAssessment)
}

export { SecurityKris, ChaosDancer, PerformancePedant, AgentOrchestrator }