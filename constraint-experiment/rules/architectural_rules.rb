#!/usr/bin/env ruby

require_relative '../lib/constraint_engine'

# Load architectural rules for the project
# This file demonstrates Ruby's expressiveness for constraint specification

engine = ConstraintEngine.new

# Database access constraints
engine.rule "no_direct_database_imports", "Prevent direct database imports outside model layer" do
  severity :error
  suggest "Import from the model layer instead"
  
  when_not_in(['app/models', 'db/migrate', 'lib/tasks']) do
    forbid("direct database imports").pattern(/require.*['"](?:pg|mysql2|sqlite3|activerecord)['"]/)
    forbid("direct ActiveRecord usage").pattern(/ActiveRecord::Base/)
  end
end

# Security constraints
engine.rule "no_raw_sql", "Prevent SQL injection vulnerabilities" do
  severity :error
  suggest "Use ActiveRecord methods or prepared statements"
  
  forbid("raw SQL execution").pattern(/(?:execute|exec_query|select_all)\s*\(\s*['"].*#\{/)
  forbid("string interpolation in SQL").pattern(/['"].*SELECT.*#\{.*\}.*['"]/)
end

# Authentication constraints  
engine.rule "endpoints_must_authenticate", "API endpoints must include authentication" do
  severity :error
  suggest "Add before_action :authenticate_user! or mark as public"
  
  when_file(/controllers/) do
    each_line do |line, line_number|
      if line.match?(/def\s+(?:create|update|destroy|show|index)/) && 
         !contains(/before_action.*authenticate/) &&
         !contains(/skip_before_action.*authenticate/)
        violation! "Endpoint lacks authentication"
      end
    end
  end
end

# Naming conventions
engine.rule "service_class_naming", "Service classes should follow naming conventions" do
  severity :warning
  suggest "Service classes should end with 'Service'"
  
  when_file(/app\/services/) do
    unless has_class(/\w+Service$/)
      violation! "Service class should end with 'Service'"
    end
  end
end

# Error handling
engine.rule "rescue_without_reraise", "Rescue blocks should handle or reraise errors" do
  severity :warning
  suggest "Handle the error appropriately or reraise it"
  
  find_pattern(/rescue\s+\w+/).each do |match|
    # Check if the rescue block has proper handling
    violation! "Rescue block may be swallowing errors" 
  end
end

# Performance constraints
engine.rule "n_plus_one_prevention", "Prevent N+1 query patterns" do
  severity :warning
  suggest "Use includes, joins, or preload to avoid N+1 queries"
  
  # Look for loops that make database calls
  forbid("potential N+1 queries").pattern(/(?:each|map|select)\s*\{.*\.(?:find|where|first)/)
end

# Testing requirements
engine.rule "controllers_must_have_tests", "Controllers must have corresponding tests" do
  severity :warning
  suggest "Create a test file in spec/controllers/"
  
  when_file(/app\/controllers\/(.+)_controller\.rb/) do
    controller_name = file_context.path.match(/app\/controllers\/(.+)_controller\.rb/)[1]
    test_file = "spec/controllers/#{controller_name}_controller_spec.rb"
    
    unless File.exist?(test_file)
      violation! "Controller missing corresponding test file: #{test_file}"
    end
  end
end

# Architecture boundaries
engine.rule "layered_architecture", "Enforce layered architecture boundaries" do
  severity :error
  suggest "Follow the dependency flow: Controllers -> Services -> Models"
  
  when_file(/app\/models/) do
    if imports_from(/controllers|services/)
      violation! "Models should not depend on controllers or services"
    end
  end
  
  when_file(/app\/controllers/) do
    if contains(/User\.create|Post\.update/) && !contains(/service/)
      violation! "Controllers should delegate business logic to services"
    end
  end
end

# Configuration management
engine.rule "no_hardcoded_secrets", "No hardcoded secrets or API keys" do
  severity :error
  suggest "Use environment variables or encrypted credentials"
  
  forbid("API keys").pattern(/(?:api_key|password|secret|token)\s*=\s*['"][^'"\n]{8,}['"]/)
  forbid("hardcoded URLs").pattern(/https?:\/\/[^\s'"]+\.(?:com|org|net)/)
end

# Documentation requirements
engine.rule "public_methods_documented", "Public methods should be documented" do
  severity :warning
  suggest "Add documentation comments for public methods"
  
  when_file(/app\/services|app\/models/) do
    each_line do |line, line_number|
      if line.match?(/def\s+\w+/) && !line.match?(/def\s+self\./) 
        # Check if previous line has documentation
        prev_line = source.lines[line_number - 2]&.strip
        unless prev_line&.start_with?('#')
          violation! "Public method lacks documentation"
        end
      end
    end
  end
end

if __FILE__ == $0
  # Run the validation
  project_path = ARGV[0] || '.'
  
  puts "Running architectural validation on #{project_path}..."
  violations = engine.check_project(project_path)
  
  if violations.empty?
    puts "✅ No architectural violations found!"
  else
    puts "❌ Found #{violations.size} violations:"
    engine.report_violations(violations)
    
    # Exit with error code if there are errors
    exit 1 if violations.any? { |v| v.severity == :error }
  end
end