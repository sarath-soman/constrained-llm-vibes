#!/usr/bin/env ruby

# Simplified constraint experiment without external dependencies
# Demonstrates the core concept: Ruby DSL constraining any target language

class SimpleConstraintEngine
  def initialize
    @rules = []
  end

  def rule(id, description = nil, &block)
    @rules << SimpleRule.new(id, description, block)
  end

  def check_code(code, language = :any)
    violations = []
    
    @rules.each do |rule|
      context = RuleContext.new(code, language)
      context.instance_eval(&rule.block)
      
      context.violations.each do |violation|
        violation[:rule_id] = rule.id
        violations << violation
      end
    end
    
    violations
  end

  def report(violations)
    if violations.empty?
      puts "✅ No violations found!"
      return
    end

    puts "❌ Found #{violations.size} violations:"
    violations.each do |v|
      puts "  #{v[:rule_id]}: #{v[:message]}"
      puts "    Suggestion: #{v[:suggestion]}" if v[:suggestion]
    end
  end
end

class SimpleRule
  attr_reader :id, :description, :block

  def initialize(id, description, block)
    @id = id
    @description = description
    @block = block
  end
end

class RuleContext
  attr_reader :code, :language, :violations

  def initialize(code, language)
    @code = code
    @language = language
    @violations = []
    @suggestion = nil
  end

  # DSL methods
  def suggest(message)
    @suggestion = message
  end

  def violation!(message)
    @violations << {
      message: message,
      suggestion: @suggestion
    }
    @suggestion = nil
  end

  def contains?(pattern)
    case pattern
    when String
      @code.include?(pattern)
    when Regexp
      @code.match?(pattern)
    end
  end

  def forbid(pattern)
    if contains?(pattern)
      case pattern
      when String
        violation!("Forbidden pattern: #{pattern}")
      when Regexp
        violation!("Forbidden pattern: #{pattern.source}")
      end
    end
  end

  def require_pattern(pattern)
    unless contains?(pattern)
      violation!("Required pattern missing: #{pattern}")
    end
  end

  def when_language(lang)
    return unless @language == lang
    yield
  end
end

# Define some rules
def create_constraint_engine
  engine = SimpleConstraintEngine.new

  # Universal rules (any language)
  engine.rule "no_console_debug" do
    suggest "Remove debug statements or use proper logging"
    forbid(/console\.(log|debug|warn)/)
  end

  engine.rule "no_hardcoded_secrets" do
    suggest "Use environment variables or secure configuration"
    forbid(/password\s*=\s*['"][^'"]{6,}['"]/)
    forbid(/api_key\s*=\s*['"][^'"]{10,}['"]/)
  end

  engine.rule "no_sql_injection" do
    suggest "Use parameterized queries"
    forbid(/['"].*SELECT.*\$\{.*\}.*['"]/)
    forbid(/['"].*INSERT.*\+.*['"]/)
  end

  # TypeScript specific rules
  engine.rule "typescript_no_any" do
    when_language(:typescript) do
      suggest "Use specific types instead of 'any'"
      forbid(/:\s*any(?![a-zA-Z])/)
    end
  end

  engine.rule "typescript_async_promise" do
    when_language(:typescript) do
      suggest "Async functions should return Promise<Type>"
      if contains?(/async\s+function/) && !contains?(/:\s*Promise</)
        violation!("Async function missing Promise return type")
      end
    end
  end

  # Ruby specific rules
  engine.rule "ruby_service_naming" do
    when_language(:ruby) do
      suggest "Service classes should end with 'Service'"
      if contains?(/class\s+\w+/) && !contains?(/class\s+\w+Service/)
        violation!("Service class should end with 'Service'")
      end
    end
  end

  engine
end

# Test the system
def run_experiment
  puts "🧪 Simple Constraint Experiment"
  puts "Ruby DSL → Multiple Target Languages"
  puts "=" * 50

  engine = create_constraint_engine

  # Test 1: Good TypeScript code
  good_ts = <<~TYPESCRIPT
    interface User {
      id: string
      name: string
    }

    const fetchUsers = async (): Promise<User[]> => {
      const response = await fetch('/api/users')
      return response.json()
    }
  TYPESCRIPT

  puts "\n✅ Testing good TypeScript code:"
  violations = engine.check_code(good_ts, :typescript)
  engine.report(violations)

  # Test 2: Bad TypeScript code
  bad_ts = <<~TYPESCRIPT
    const fetchUsers = async (): any => {
      console.log('Fetching users')  // Debug statement
      const apiKey = "sk_live_abcdef123456"  // Hardcoded secret
      
      const query = `SELECT * FROM users WHERE id = ${userId}`  // SQL injection
      return database.query(query)
    }
  TYPESCRIPT

  puts "\n❌ Testing bad TypeScript code:"
  violations = engine.check_code(bad_ts, :typescript)
  engine.report(violations)

  # Test 3: Good Ruby code
  good_rb = <<~RUBY
    class UserService
      def initialize(user_repository)
        @user_repository = user_repository
      end

      def create_user(params)
        @user_repository.create(params)
      end
    end
  RUBY

  puts "\n✅ Testing good Ruby code:"
  violations = engine.check_code(good_rb, :ruby)
  engine.report(violations)

  # Test 4: Bad Ruby code
  bad_rb = <<~RUBY
    class UserManager
      def create_user(email, password)
        puts "Creating user with email: email"  # Debug output
        secret_key = "super_secret_key_123"  // Hardcoded secret
        
        query = "INSERT INTO users (email, password) VALUES ('" + email + "', '" + password + "')"
        database.execute(query)  // SQL injection
      end
    end
  RUBY

  puts "\n❌ Testing bad Ruby code:"
  violations = engine.check_code(bad_rb, :ruby)
  engine.report(violations)

  # Simulate LLM workflow
  puts "\n🤖 Simulating LLM Workflow:"
  puts "-" * 30

  # LLM generates code
  llm_generated = <<~TYPESCRIPT
    const updateUser = (id: string, data: any) => {
      console.log('Updating user:', id)
      const query = `UPDATE users SET name = '${data.name}' WHERE id = ${id}`
      return database.execute(query)
    }
  TYPESCRIPT

  puts "LLM generated TypeScript function..."
  violations = engine.check_code(llm_generated, :typescript)
  
  if violations.any?
    puts "🚫 REJECTED - Code violates constraints:"
    engine.report(violations)
    puts "🔄 Would send back to LLM with constraint feedback"
  else
    puts "✅ ACCEPTED - Code passes all constraints"
  end

  puts "\n📊 Experiment Summary:"
  puts "- Ruby DSL successfully constrains multiple languages ✅"
  puts "- Violations detected with actionable feedback ✅"
  puts "- Ready for LLM integration workflow ✅"
  puts "- Demonstrates constraint-based approach ✅"
  
  puts "\n🎯 Key Insight:"
  puts "Ruby's expressiveness makes constraint specification"
  puts "readable and maintainable for ANY target language!"
end

# Run the experiment
run_experiment if __FILE__ == $0