#!/usr/bin/env ruby

require_relative '../../../constraint-experiment/lib/constraint_engine'

# NestJS Plugin Architecture Constraints
# Ensures LLMs generate plugins that follow our exact patterns

engine = ConstraintEngine.new

# ==========================================
# PLUGIN STRUCTURE CONSTRAINTS
# ==========================================

engine.rule "must_extend_base_plugin", "All plugins must extend BaseActionPlugin" do
  severity :error
  suggest "Extend BaseActionPlugin class: class YourPlugin extends BaseActionPlugin"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if has_class(/Plugin/) && !contains(/extends BaseActionPlugin/)
      violation! "Plugin class must extend BaseActionPlugin"
    end
  end
end

engine.rule "must_have_metadata", "Plugins must define readonly metadata property" do
  severity :error
  suggest "Add: readonly metadata: PluginMetadata = { name: '...', version: '...', ... }"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if has_class(/Plugin/) && !contains(/readonly metadata: PluginMetadata/)
      violation! "Plugin missing readonly metadata property"
    end
  end
end

engine.rule "must_have_schema", "Plugins must define readonly schema property" do
  severity :error
  suggest "Add: readonly schema: ActionSchema = { request: RequestType, response: ResponseType }"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if has_class(/Plugin/) && !contains(/readonly schema: ActionSchema/)
      violation! "Plugin missing readonly schema property"
    end
  end
end

engine.rule "must_have_validation_rules", "Plugins must define validation rules" do
  severity :error
  suggest "Add: readonly validationRules: ValidationRule[] = [...]"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if has_class(/Plugin/) && !contains(/readonly validationRules: ValidationRule/)
      violation! "Plugin missing readonly validationRules property"
    end
  end
end

engine.rule "must_implement_execute", "Plugins must implement execute method" do
  severity :error
  suggest "Add: async execute(input: any): Promise<any> { ... }"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if has_class(/Plugin/) && !has_method(/execute/)
      violation! "Plugin missing execute method"
    end
  end
end

engine.rule "must_implement_health_check", "Plugins must implement healthCheck method" do
  severity :error
  suggest "Add: async healthCheck(): Promise<boolean> { return true; }"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if has_class(/Plugin/) && !has_method(/healthCheck/)
      violation! "Plugin missing healthCheck method"
    end
  end
end

# ==========================================
# PLUGIN METADATA CONSTRAINTS
# ==========================================

engine.rule "metadata_must_be_complete", "Plugin metadata must include all required fields" do
  severity :error
  suggest "Include: name, version, description, author, category in metadata"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if contains(/readonly metadata: PluginMetadata/)
      required_fields = %w[name version description author category]
      required_fields.each do |field|
        unless contains(/#{field}:/)
          violation! "Plugin metadata missing required field: #{field}"
        end
      end
    end
  end
end

engine.rule "metadata_category_must_be_valid", "Plugin category must be valid" do
  severity :error
  suggest "Use one of: 'business', 'utility', 'integration', 'auth'"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if contains(/category:/)
      valid_categories = %w[business utility integration auth]
      category_line = find_pattern(/category:\s*['"]([^'"]+)['"]/).first
      if category_line
        category = category_line[:content].match(/category:\s*['"]([^'"]+)['"]/)[1]
        unless valid_categories.include?(category)
          violation! "Invalid category '#{category}'. Must be: #{valid_categories.join(', ')}"
        end
      end
    end
  end
end

engine.rule "metadata_name_must_match_class", "Plugin metadata name should match class name" do
  severity :warning
  suggest "Ensure metadata.name reflects the plugin class name"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    class_match = find_pattern(/class\s+(\w+Plugin)/).first
    name_match = find_pattern(/name:\s*['"]([^'"]+)['"]/).first
    
    if class_match && name_match
      class_name = class_match[:content].match(/class\s+(\w+Plugin)/)[1]
      metadata_name = name_match[:content].match(/name:\s*['"]([^'"]+)['"]/)[1]
      
      # Convert class name to kebab-case for comparison
      expected_name = class_name.gsub(/([A-Z])/, '-\1').downcase.sub(/^-/, '').sub(/-plugin$/, '')
      
      unless metadata_name.include?(expected_name) || expected_name.include?(metadata_name)
        violation! "Plugin name '#{metadata_name}' doesn't match class '#{class_name}'"
      end
    end
  end
end

# ==========================================
# SCHEMA CONSTRAINTS
# ==========================================

engine.rule "schema_must_have_types", "Plugin schema must define request and response types" do
  severity :error
  suggest "Define interfaces: interface RequestType {} and interface ResponseType {}"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if contains(/readonly schema: ActionSchema/)
      unless contains(/interface.*Request/) && contains(/interface.*Response/)
        violation! "Plugin must define Request and Response interface types"
      end
    end
  end
end

engine.rule "request_type_must_be_interface", "Request type must be a TypeScript interface" do
  severity :error
  suggest "Define: interface YourPluginRequest { ... }"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if contains(/request:/) && !contains(/interface.*Request/)
      violation! "Plugin request type must be defined as an interface"
    end
  end
end

engine.rule "response_type_must_be_interface", "Response type must be a TypeScript interface" do
  severity :error
  suggest "Define: interface YourPluginResponse { ... }"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if contains(/response:/) && !contains(/interface.*Response/)
      violation! "Plugin response type must be defined as an interface"
    end
  end
end

# ==========================================
# VALIDATION RULES CONSTRAINTS
# ==========================================

engine.rule "validation_rules_must_be_array", "Validation rules must be an array" do
  severity :error
  suggest "Define as: readonly validationRules: ValidationRule[] = [...]"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if contains(/validationRules:/) && !contains(/ValidationRule\[\]/)
      violation! "validationRules must be typed as ValidationRule[]"
    end
  end
end

engine.rule "validation_rules_must_have_structure", "Each validation rule must have name, message, and validate" do
  severity :error
  suggest "Use: { name: 'ruleName', message: 'Error message', validate: (input) => boolean }"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if contains(/validationRules:.*\[/)
      # Check for proper validation rule structure
      unless contains(/name:/) && contains(/message:/) && contains(/validate:/)
        violation! "Validation rules must have name, message, and validate properties"
      end
    end
  end
end

# ==========================================
# METHOD IMPLEMENTATION CONSTRAINTS
# ==========================================

engine.rule "execute_must_be_async", "Execute method must be async" do
  severity :error
  suggest "Define as: async execute(input: any): Promise<any>"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if has_method(/execute/) && !contains(/async execute/)
      violation! "execute method must be async"
    end
  end
end

engine.rule "execute_must_return_promise", "Execute method must return Promise" do
  severity :error
  suggest "Method signature: async execute(input: any): Promise<any>"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if contains(/execute.*:/) && !contains(/Promise</)
      violation! "execute method must return Promise"
    end
  end
end

engine.rule "health_check_must_be_async", "Health check must be async" do
  severity :error
  suggest "Define as: async healthCheck(): Promise<boolean>"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if has_method(/healthCheck/) && !contains(/async healthCheck/)
      violation! "healthCheck method must be async"
    end
  end
end

engine.rule "health_check_must_return_boolean", "Health check must return Promise<boolean>" do
  severity :error
  suggest "Method signature: async healthCheck(): Promise<boolean>"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if contains(/healthCheck.*:/) && !contains(/Promise<boolean>/)
      violation! "healthCheck method must return Promise<boolean>"
    end
  end
end

# ==========================================
# NESTJS DECORATOR CONSTRAINTS
# ==========================================

engine.rule "plugin_must_be_injectable", "Plugin class must have @Injectable decorator" do
  severity :error
  suggest "Add @Injectable() decorator above class declaration"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if has_class(/Plugin/) && !contains(/@Injectable/)
      violation! "Plugin class must have @Injectable() decorator"
    end
  end
end

engine.rule "must_import_injectable", "Must import Injectable from @nestjs/common" do
  severity :error
  suggest "Add: import { Injectable } from '@nestjs/common';"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if contains(/@Injectable/) && !contains(/import.*Injectable.*@nestjs\/common/)
      violation! "Must import Injectable from @nestjs/common"
    end
  end
end

engine.rule "must_import_base_plugin", "Must import BaseActionPlugin" do
  severity :error
  suggest "Add: import { BaseActionPlugin } from '../core/base-plugin.abstract';"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if contains(/extends BaseActionPlugin/) && !contains(/import.*BaseActionPlugin/)
      violation! "Must import BaseActionPlugin"
    end
  end
end

# ==========================================
# FILE STRUCTURE CONSTRAINTS
# ==========================================

engine.rule "plugin_file_naming", "Plugin files must follow naming convention" do
  severity :warning
  suggest "Name files as: feature-name.plugin.ts"
  
  when_file(/src\/plugins\//) do
    unless file_context.path.match?(/\.plugin\.ts$/)
      violation! "Plugin files should end with .plugin.ts"
    end
  end
end

engine.rule "plugin_class_naming", "Plugin classes must end with 'Plugin'" do
  severity :error
  suggest "Name classes as: FeatureNamePlugin"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    class_matches = find_pattern(/class\s+(\w+)/)
    class_matches.each do |match|
      class_name = match[:content].match(/class\s+(\w+)/)[1]
      unless class_name.end_with?('Plugin')
        violation! "Plugin class '#{class_name}' must end with 'Plugin'"
      end
    end
  end
end

engine.rule "one_plugin_per_file", "Each file should contain only one plugin class" do
  severity :warning
  suggest "Split multiple plugins into separate files"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    plugin_classes = find_pattern(/class\s+\w*Plugin/)
    if plugin_classes.size > 1
      violation! "File contains #{plugin_classes.size} plugin classes, should be one per file"
    end
  end
end

# ==========================================
# ERROR HANDLING CONSTRAINTS
# ==========================================

engine.rule "execute_must_handle_errors", "Execute method must have proper error handling" do
  severity :warning
  suggest "Wrap execution in try-catch block or use proper error boundaries"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    if has_method(/execute/) && !contains(/try.*catch|throw new Error/)
      violation! "execute method should include error handling"
    end
  end
end

engine.rule "no_console_logging", "Use proper logging instead of console" do
  severity :warning
  suggest "Use Logger service: import { Logger } from '@nestjs/common'"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    forbid("console logging").pattern(/console\.(log|warn|error|debug)/)
  end
end

# ==========================================
# SECURITY CONSTRAINTS
# ==========================================

engine.rule "no_eval_or_function_constructor", "No eval() or Function constructor" do
  severity :error
  suggest "Use safe alternatives for dynamic code execution"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    forbid("eval usage").pattern(/eval\s*\(/)
    forbid("Function constructor").pattern(/new Function\s*\(/)
  end
end

engine.rule "no_hardcoded_secrets", "No hardcoded secrets or credentials" do
  severity :error
  suggest "Use environment variables or configuration service"
  
  when_file(/src\/plugins\/.*\.ts$/) do
    forbid("API keys").pattern(/(?:api_key|apikey|password|secret|token)\s*[:=]\s*['"][^'"\n]{8,}['"]/)
  end
end

# ==========================================
# TESTING CONSTRAINTS
# ==========================================

engine.rule "plugin_must_have_test", "Each plugin must have a corresponding test file" do
  severity :warning
  suggest "Create test file: feature-name.plugin.spec.ts"
  
  when_file(/src\/plugins\/(.+)\.plugin\.ts$/) do
    plugin_name = file_context.path.match(/src\/plugins\/(.+)\.plugin\.ts$/)[1]
    test_file = "src/plugins/#{plugin_name}.plugin.spec.ts"
    
    unless File.exist?(test_file)
      violation! "Plugin missing test file: #{test_file}"
    end
  end
end

if __FILE__ == $0
  # Run NestJS plugin validation
  project_path = ARGV[0] || '.'
  
  puts "🔧 Running NestJS plugin architecture validation on #{project_path}..."
  violations = engine.check_project(project_path)
  
  if violations.empty?
    puts "✅ All plugins follow the architecture constraints!"
  else
    puts "⚠️  Found #{violations.size} plugin architecture violations:"
    engine.report_violations(violations)
    
    # Exit with error code if there are errors
    exit 1 if violations.any? { |v| v.severity == :error }
  end
end