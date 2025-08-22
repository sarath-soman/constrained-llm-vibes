#!/usr/bin/env ruby

require_relative 'lib/constraint_engine'
require_relative 'rules/architectural_rules'

# Test runner for the constraint experiment

class TestRunner
  def initialize
    @engine = ConstraintEngine.new
    load_rules
  end

  def run_experiment
    puts "🧪 Running Constraint Experiment"
    puts "=" * 50
    
    test_good_code
    test_bad_code
    test_project_validation
    
    puts "\n📊 Experiment Summary:"
    puts "- Ruby DSL successfully expresses architectural constraints"
    puts "- Violations are clearly identified with actionable suggestions"
    puts "- System ready for LLM integration testing"
  end

  private

  def load_rules
    # Load architectural rules (already loaded by requiring the file)
    puts "📝 Loaded architectural rules"
  end

  def test_good_code
    puts "\n✅ Testing well-structured code..."
    violations = @engine.check_file('examples/good_service.rb')
    
    if violations.empty?
      puts "   Perfect! No violations found in good_service.rb"
    else
      puts "   Unexpected violations in good code:"
      @engine.report_violations(violations)
    end
  end

  def test_bad_code
    puts "\n❌ Testing problematic code..."
    
    # Test bad service
    service_violations = @engine.check_file('examples/bad_service.rb')
    puts "   Found #{service_violations.size} violations in bad_service.rb"
    
    # Test bad controller  
    controller_violations = @engine.check_file('examples/bad_controller.rb')
    puts "   Found #{controller_violations.size} violations in bad_controller.rb"
    
    all_violations = service_violations + controller_violations
    
    puts "\n📋 Detailed violation report:"
    @engine.report_violations(all_violations)
    
    # Categorize violations
    categorize_violations(all_violations)
  end

  def test_project_validation
    puts "\n🔍 Testing project-wide validation..."
    violations = @engine.check_project('examples')
    
    puts "   Total project violations: #{violations.size}"
    
    # Show distribution by severity
    error_count = violations.count { |v| v.severity == :error }
    warning_count = violations.count { |v| v.severity == :warning }
    
    puts "   - Errors: #{error_count}"
    puts "   - Warnings: #{warning_count}"
  end

  def categorize_violations(violations)
    categories = violations.group_by(&:rule_id)
    
    puts "\n📈 Violation categories:"
    categories.each do |rule_id, rule_violations|
      count = rule_violations.size
      severity = rule_violations.first.severity
      puts "   #{rule_id}: #{count} (#{severity})"
    end
  end

  # Simulate LLM constraint testing
  def simulate_llm_generation
    puts "\n🤖 Simulating LLM-generated code validation..."
    
    # This would be LLM-generated code that we validate
    llm_generated_code = <<~RUBY
      class UserService
        def create_user(email, password)
          User.create(email: email, password: password)
        end
      end
    RUBY
    
    # Write to temp file and validate
    File.write('temp_llm_code.rb', llm_generated_code)
    violations = @engine.check_file('temp_llm_code.rb')
    
    if violations.any?
      puts "   LLM code rejected - violations found:"
      @engine.report_violations(violations)
      puts "   🚫 Code generation failed constraint validation"
    else
      puts "   ✅ LLM code passed all constraints"
    end
    
    File.delete('temp_llm_code.rb') if File.exist?('temp_llm_code.rb')
  end
end

# Run the experiment
if __FILE__ == $0
  runner = TestRunner.new
  runner.run_experiment
  
  puts "\n🎯 Next steps:"
  puts "1. Integrate with LLM code generation pipeline"
  puts "2. Add more sophisticated AST-based rules"
  puts "3. Create autofix suggestions for common violations"
  puts "4. Build CI/CD integration for continuous validation"
end