#!/usr/bin/env ruby

require_relative '../lib/constraint_engine'

# Ruby DSL for TypeScript/JavaScript architectural constraints
# Demonstrates how Ruby's expressiveness can constrain any target language

engine = ConstraintEngine.new

# TypeScript/Node.js specific rules
engine.rule "no_any_type", "Avoid using 'any' type - be explicit" do
  severity :warning
  suggest "Use specific types instead of 'any'"
  
  forbid("any type usage").pattern(/:\s*any(?![a-zA-Z])/)
  forbid("any array").pattern(/any\[\]/)
end

engine.rule "async_functions_return_promise", "Async functions should have Promise return types" do
  severity :warning
  suggest "Add Promise<Type> return type annotation"
  
  find_pattern(/async\s+function\s+\w+\([^)]*\)(?!\s*:\s*Promise)/) do |matches|
    matches.each do |match|
      violation! "Async function missing Promise return type at line #{match[:line]}"
    end
  end
end

engine.rule "no_console_in_production", "Remove console.log from production code" do
  severity :error
  suggest "Use proper logging library or remove debug statements"
  
  when_not_in(['test', 'spec', '__tests__', 'debug']) do
    forbid("console statements").pattern(/console\.(log|warn|error|debug)/)
  end
end

engine.rule "imports_must_be_organized", "Organize imports properly" do
  severity :warning
  suggest "Group imports: external libraries first, then internal modules"
  
  # Check import organization
  each_line do |line, line_number|
    if line.match?(/^import.*from\s+['"]\./)  # relative import
      # Look for absolute imports after relative ones
      remaining_lines = source.lines[line_number..-1]
      if remaining_lines.any? { |l| l.match?(/^import.*from\s+['"][^.]/) }
        violation! "Relative imports should come after absolute imports"
      end
    end
  end
end

engine.rule "prefer_const_over_let", "Use const when variable is not reassigned" do
  severity :info
  suggest "Use const instead of let for variables that aren't reassigned"
  
  # Simple heuristic: let declarations without reassignment in same block
  find_pattern(/let\s+(\w+)\s*=/).each do |match|
    var_name = source.match(/let\s+(\w+)\s*=/)[1]
    # Check if variable is reassigned (simplified check)
    unless contains(/#{var_name}\s*=.*(?!==|!=|===|!==)/)
      violation! "Variable '#{var_name}' could be const instead of let"
    end
  end
end

# React-specific rules
engine.rule "react_hooks_order", "React hooks should follow consistent ordering" do
  severity :warning
  suggest "Order hooks: useState, useEffect, custom hooks, useCallback/useMemo"
  
  when_file(/\.(?:tsx|jsx)$/) do
    hook_order = ['useState', 'useEffect', 'useContext', 'useReducer', 'useCallback', 'useMemo']
    found_hooks = []
    
    each_line do |line, line_number|
      hook_order.each_with_index do |hook, index|
        if line.include?(hook)
          found_hooks << { hook: hook, line: line_number, order: index }
        end
      end
    end
    
    # Check if hooks are in order
    found_hooks.each_cons(2) do |current, next_hook|
      if current[:order] > next_hook[:order]
        violation! "Hook #{next_hook[:hook]} should come before #{current[:hook]}"
      end
    end
  end
end

engine.rule "no_default_export_functions", "Prefer named exports over default exports" do
  severity :info
  suggest "Use named exports for better IDE support and refactoring"
  
  forbid("default function export").pattern(/export\s+default\s+function/)
  forbid("default arrow export").pattern(/export\s+default\s+\([^)]*\)\s*=>/)
end

# Security rules for TypeScript
engine.rule "no_eval_usage", "Avoid eval() and Function() constructor" do
  severity :error
  suggest "Use safer alternatives to eval() and Function() constructor"
  
  forbid("eval usage").pattern(/\beval\s*\(/)
  forbid("Function constructor").pattern(/new\s+Function\s*\(/)
end

engine.rule "sql_injection_prevention", "Prevent SQL injection in database queries" do
  severity :error
  suggest "Use parameterized queries or ORM methods"
  
  # Template literals with variables in SQL-like strings
  forbid("SQL template injection").pattern(/`.*(?:SELECT|INSERT|UPDATE|DELETE).*\$\{/)
  forbid("String concatenation SQL").pattern(/['"].*(?:SELECT|INSERT|UPDATE|DELETE).*['"].*\+/)
end

# API/Express specific rules
engine.rule "middleware_error_handling", "Express middleware should handle errors" do
  severity :warning
  suggest "Add try-catch or pass errors to next() function"
  
  when_file(/routes|controllers|middleware/) do
    find_pattern(/\(req,\s*res(?:,\s*next)?\)\s*=>/) do |matches|
      matches.each do |match|
        # Check if the function has error handling
        unless contains(/try\s*\{|catch\s*\(|next\s*\(/)
          violation! "Express handler lacks error handling at line #{match[:line]}"
        end
      end
    end
  end
end

# Performance rules
engine.rule "avoid_nested_loops", "Avoid nested loops that could cause performance issues" do
  severity :warning
  suggest "Consider using more efficient algorithms or data structures"
  
  # Detect nested loops (simplified)
  nesting_level = 0
  each_line do |line, line_number|
    if line.match?(/(?:for|while)\s*\(/)
      nesting_level += 1
      if nesting_level > 2
        violation! "Deeply nested loop at line #{line_number} - consider refactoring"
      end
    elsif line.match?(/^\s*\}/)
      nesting_level = [nesting_level - 1, 0].max
    end
  end
end

# Testing rules
engine.rule "test_file_naming", "Test files should follow naming conventions" do
  severity :warning
  suggest "Name test files with .test.ts or .spec.ts suffix"
  
  when_file(/test|spec/) do
    unless file_matches?(/\.(test|spec)\.(ts|js|tsx|jsx)$/)
      violation! "Test file should have .test.ts or .spec.ts extension"
    end
  end
end

engine.rule "async_test_handling", "Async tests should be properly handled" do
  severity :error
  suggest "Use async/await or return Promise in test functions"
  
  when_file(/\.(test|spec)\./) do
    find_pattern(/(?:it|test)\s*\(\s*['"][^'"]*['"],\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{/) do |matches|
      matches.each do |match|
        # Check if async test returns Promise or uses await
        unless contains(/await\s+|return\s+.*Promise/)
          violation! "Async test should use await or return Promise"
        end
      end
    end
  end
end

if __FILE__ == $0
  # Test with TypeScript files
  if ARGV.empty?
    puts "Usage: ruby typescript_rules.rb <typescript_file_or_directory>"
    exit 1
  end
  
  target = ARGV[0]
  
  if File.directory?(target)
    violations = engine.check_project(target)
  else
    violations = engine.check_file(target)
  end
  
  if violations.empty?
    puts "✅ No TypeScript architectural violations found!"
  else
    puts "❌ Found #{violations.size} TypeScript violations:"
    engine.report_violations(violations)
    
    exit 1 if violations.any? { |v| v.severity == :error }
  end
end