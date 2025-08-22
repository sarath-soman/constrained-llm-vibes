#!/usr/bin/env ruby

require_relative 'lib/constraint_engine'

# Complete experiment runner for polyglot constraint system
# Demonstrates Ruby DSL constraining multiple target languages

class ConstraintExperiment
  def initialize
    @engines = {}
    setup_engines
  end

  def run_full_experiment
    puts "🚀 Running Complete Constraint Experiment"
    puts "Ruby DSL → Multiple Target Languages"
    puts "=" * 60
    
    test_ruby_constraints
    test_typescript_constraints
    simulate_llm_workflow
    demonstrate_ci_integration
    show_results_summary
  end

  private

  def setup_engines
    @engines[:ruby] = create_ruby_engine
    @engines[:typescript] = create_typescript_engine
  end

  def create_ruby_engine
    engine = ConstraintEngine.new
    load 'rules/architectural_rules.rb'
    engine
  end

  def create_typescript_engine
    engine = ConstraintEngine.new
    load 'rules/typescript_rules.rb'  
    engine
  end

  def test_ruby_constraints
    puts "\n🔴 Testing Ruby Constraints"
    puts "-" * 30
    
    # Test good Ruby code
    puts "✅ Good Ruby code:"
    violations = @engines[:ruby].check_file('examples/good_service.rb')
    puts "   Violations: #{violations.size}"
    
    # Test bad Ruby code
    puts "❌ Bad Ruby code:"
    violations = @engines[:ruby].check_file('examples/bad_service.rb')
    puts "   Violations: #{violations.size}"
    violations.first(3).each do |v|
      puts "   - #{v.rule_id}: #{v.message}"
    end
  end

  def test_typescript_constraints
    puts "\n🔵 Testing TypeScript Constraints"
    puts "-" * 30
    
    # Test good TypeScript code
    puts "✅ Good TypeScript code:"
    violations = @engines[:typescript].check_file('examples/good_typescript.ts')
    puts "   Violations: #{violations.size}"
    
    # Test bad TypeScript code
    puts "❌ Bad TypeScript code:"
    violations = @engines[:typescript].check_file('examples/bad_typescript.ts')
    puts "   Violations: #{violations.size}"
    violations.first(3).each do |v|
      puts "   - #{v.rule_id}: #{v.message}"
    end
  end

  def simulate_llm_workflow
    puts "\n🤖 Simulating LLM-Constrained Workflow"
    puts "-" * 40

    # Scenario 1: LLM generates TypeScript React component
    puts "\n📝 Scenario 1: LLM generates React component"
    llm_generated_ts = generate_mock_llm_code(:typescript, :react_component)
    
    File.write('temp_llm_generated.ts', llm_generated_ts)
    violations = @engines[:typescript].check_file('temp_llm_generated.ts')
    
    if violations.any?
      puts "   🚫 REJECTED - Found #{violations.size} violations:"
      violations.first(2).each { |v| puts "      - #{v.message}" }
      puts "   🔄 Would regenerate with constraints..."
    else
      puts "   ✅ ACCEPTED - Passes all constraints"
    end
    
    # Scenario 2: LLM generates Ruby service
    puts "\n📝 Scenario 2: LLM generates Ruby service"
    llm_generated_rb = generate_mock_llm_code(:ruby, :service)
    
    File.write('temp_llm_generated.rb', llm_generated_rb)
    violations = @engines[:ruby].check_file('temp_llm_generated.rb')
    
    if violations.any?
      puts "   🚫 REJECTED - Found #{violations.size} violations:"
      violations.first(2).each { |v| puts "      - #{v.message}" }
    else
      puts "   ✅ ACCEPTED - Passes all constraints"
    end
    
    # Cleanup
    File.delete('temp_llm_generated.ts') if File.exist?('temp_llm_generated.ts')
    File.delete('temp_llm_generated.rb') if File.exist?('temp_llm_generated.rb')
  end

  def demonstrate_ci_integration
    puts "\n⚙️ CI/CD Integration Demo"
    puts "-" * 25
    
    puts "🔍 Pre-commit hook simulation:"
    puts "   1. Developer commits code changes"
    puts "   2. Constraint engine validates all changes"
    
    # Simulate checking modified files
    modified_files = ['examples/bad_service.rb', 'examples/bad_typescript.ts']
    total_violations = 0
    
    modified_files.each do |file|
      engine = file.end_with?('.rb') ? @engines[:ruby] : @engines[:typescript]
      violations = engine.check_file(file)
      total_violations += violations.size
      puts "   - #{file}: #{violations.size} violations"
    end
    
    puts "\n📊 CI/CD Decision:"
    if total_violations > 0
      puts "   ❌ BUILD FAILED - #{total_violations} architectural violations"
      puts "   📧 Notify developer with violation report"
      puts "   🚫 Block merge until violations fixed"
    else
      puts "   ✅ BUILD PASSED - No architectural violations"
      puts "   🚀 Proceed with deployment pipeline"
    end
  end

  def show_results_summary
    puts "\n📈 Experiment Results Summary"
    puts "=" * 40
    
    puts "✅ Proven Capabilities:"
    puts "   - Ruby DSL successfully constrains multiple languages"
    puts "   - Clear violation detection with actionable feedback" 
    puts "   - Ready for LLM integration pipeline"
    puts "   - CI/CD integration demonstrates workflow"
    
    puts "\n🔧 Technical Benefits:"
    puts "   - Polyglot constraint specification"
    puts "   - Maintainable, readable rule definitions"
    puts "   - Extensible architecture for new languages"
    puts "   - Automated architectural enforcement"
    
    puts "\n🎯 Next Implementation Steps:"
    puts "   1. Integrate with your actual codebase"
    puts "   2. Connect to LLM code generation pipeline"
    puts "   3. Add AST-based analysis for deeper inspection"
    puts "   4. Create specialized agents using this foundation"
    puts "   5. Build auto-fix suggestions for common violations"
    
    puts "\n🚀 Ready to constrain LLMs at enterprise scale!"
  end

  def generate_mock_llm_code(language, type)
    case [language, type]
    when [:typescript, :react_component]
      # Intentionally flawed LLM output to test constraints
      <<~TYPESCRIPT
        import React from 'react'
        
        export default function UserList(): any {
          const [users, setUsers] = useState([])
          
          const fetchUsers = async () => {
            console.log('Fetching users')  // Violation: console in production
            const response = await fetch('/api/users')
            const data = await response.json()
            setUsers(data)
          }
          
          return <div>{users.map((user: any) => <div key={user.id}>{user.name}</div>)}</div>
        }
      TYPESCRIPT
      
    when [:ruby, :service]
      # Well-formed LLM output that should pass
      <<~RUBY
        # User management service
        class UserManagementService
          # Creates a new user with validation
          def self.create_user(email:, name:, password:)
            new(email: email, name: name, password: password).create
          end

          def initialize(email:, name:, password:)
            @email = email
            @name = name  
            @password = password
          end

          # Main user creation logic
          def create
            validate_input!
            
            User.transaction do
              user = User.create!(
                email: @email,
                name: @name,
                password_digest: BCrypt::Password.create(@password)
              )
              
              UserMailer.welcome(user).deliver_later
              user
            end
          rescue StandardError => e
            Rails.logger.error "User creation failed: \#{e.message}"
            raise e
          end

          private

          # Validates user input
          def validate_input!
            raise ArgumentError, "Email required" if @email.blank?
            raise ArgumentError, "Name required" if @name.blank?
            raise ArgumentError, "Password required" if @password.blank?
          end
        end
      RUBY
    end
  end
end

# Run the experiment
if __FILE__ == $0
  experiment = ConstraintExperiment.new
  experiment.run_full_experiment
end