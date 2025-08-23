#!/usr/bin/env ruby

# Simple plugin validator without external dependencies
# Validates NestJS plugins against our architectural constraints

class PluginValidator
  def initialize
    @violations = []
  end

  def validate_project(project_path)
    plugin_files = Dir.glob("#{project_path}/src/plugins/**/*.plugin.ts")
    
    if plugin_files.empty?
      puts "✅ No plugin files found to validate"
      return true
    end

    plugin_files.each do |file|
      validate_plugin_file(file)
    end

    report_results
    @violations.empty?
  end

  private

  def validate_plugin_file(file_path)
    content = File.read(file_path)
    filename = File.basename(file_path)
    
    puts "🔍 Validating #{filename}..."

    # Core structure validations
    validate_extends_base_plugin(content, filename)
    validate_injectable_decorator(content, filename)
    validate_metadata_property(content, filename)
    validate_schema_property(content, filename)
    validate_validation_rules_property(content, filename)
    validate_execute_method(content, filename)
    validate_health_check_method(content, filename)
    
    # Import validations
    validate_required_imports(content, filename)
    
    # Naming validations
    validate_file_naming(file_path)
    validate_class_naming(content, filename)
    
    # Security validations
    validate_no_console_logs(content, filename)
    validate_no_hardcoded_secrets(content, filename)
    
    # Check for corresponding test file
    validate_test_file_exists(file_path)
  end

  def validate_extends_base_plugin(content, filename)
    unless content.match?(/extends BaseActionPlugin/)
      add_violation(filename, "Plugin must extend BaseActionPlugin")
    end
  end

  def validate_injectable_decorator(content, filename)
    unless content.match?(/@Injectable\(\)/)
      add_violation(filename, "Plugin must have @Injectable() decorator")
    end
  end

  def validate_metadata_property(content, filename)
    unless content.match?(/readonly metadata: PluginMetadata/)
      add_violation(filename, "Plugin must have 'readonly metadata: PluginMetadata' property")
    end

    # Validate required metadata fields
    required_fields = %w[name version description author category]
    required_fields.each do |field|
      unless content.match?(/#{field}:/)
        add_violation(filename, "Plugin metadata missing required field: #{field}")
      end
    end

    # Validate category values
    if content.match?(/category:\s*['"]([^'"]+)['"]/)
      category = content.match(/category:\s*['"]([^'"]+)['"]/)[1]
      valid_categories = %w[business utility integration auth]
      unless valid_categories.include?(category)
        add_violation(filename, "Invalid category '#{category}'. Must be: #{valid_categories.join(', ')}")
      end
    end
  end

  def validate_schema_property(content, filename)
    unless content.match?(/readonly schema: ActionSchema/)
      add_violation(filename, "Plugin must have 'readonly schema: ActionSchema' property")
    end

    unless content.match?(/interface.*Request/) && content.match?(/interface.*Response/)
      add_violation(filename, "Plugin must define Request and Response interfaces")
    end
  end

  def validate_validation_rules_property(content, filename)
    unless content.match?(/readonly validationRules: ValidationRule\[\]/)
      add_violation(filename, "Plugin must have 'readonly validationRules: ValidationRule[]' property")
    end
  end

  def validate_execute_method(content, filename)
    unless content.match?(/async execute\(/)
      add_violation(filename, "Plugin must have async execute() method")
    end

    unless content.match?(/execute.*Promise</)
      add_violation(filename, "execute() method must return Promise")
    end
  end

  def validate_health_check_method(content, filename)
    unless content.match?(/async healthCheck\(\)/)
      add_violation(filename, "Plugin must have async healthCheck() method")
    end

    unless content.match?(/healthCheck.*Promise<boolean>/)
      add_violation(filename, "healthCheck() method must return Promise<boolean>")
    end
  end

  def validate_required_imports(content, filename)
    unless content.match?(/import.*Injectable.*@nestjs\/common/)
      add_violation(filename, "Must import Injectable from @nestjs/common")
    end

    unless content.match?(/import.*BaseActionPlugin/)
      add_violation(filename, "Must import BaseActionPlugin")
    end

    unless content.match?(/import.*PluginMetadata.*ActionSchema.*ValidationRule/)
      add_violation(filename, "Must import PluginMetadata, ActionSchema, and ValidationRule")
    end
  end

  def validate_file_naming(file_path)
    unless file_path.match?(/\.plugin\.ts$/)
      add_violation(File.basename(file_path), "Plugin files must end with .plugin.ts")
    end
  end

  def validate_class_naming(content, filename)
    class_matches = content.scan(/class\s+(\w+)/)
    class_matches.each do |class_name_array|
      class_name = class_name_array[0]
      unless class_name.end_with?('Plugin')
        add_violation(filename, "Plugin class '#{class_name}' must end with 'Plugin'")
      end
    end
  end

  def validate_no_console_logs(content, filename)
    if content.match?(/console\.(log|warn|error|debug)/)
      add_violation(filename, "Use Logger service instead of console logging")
    end
  end

  def validate_no_hardcoded_secrets(content, filename)
    if content.match?(/(?:api_key|password|secret|token)\s*[:=]\s*['"][^'"\n]{8,}['"]/)
      add_violation(filename, "No hardcoded secrets or credentials allowed")
    end
  end

  def validate_test_file_exists(plugin_file_path)
    test_file_path = plugin_file_path.sub(/\.plugin\.ts$/, '.plugin.spec.ts')
    unless File.exist?(test_file_path)
      add_violation(File.basename(plugin_file_path), "Missing test file: #{File.basename(test_file_path)}")
    end
  end

  def add_violation(filename, message)
    @violations << { file: filename, message: message }
  end

  def report_results
    puts "\n" + "="*60
    
    if @violations.empty?
      puts "✅ All plugins pass architectural constraints!"
      puts "🚀 Ready for LLM-generated code."
    else
      puts "❌ Found #{@violations.size} architectural violations:"
      puts ""
      
      @violations.group_by { |v| v[:file] }.each do |file, violations|
        puts "📄 #{file}:"
        violations.each do |violation|
          puts "   • #{violation[:message]}"
        end
        puts ""
      end
      
      puts "🔧 Fix these violations before proceeding."
    end
    
    puts "="*60
  end
end

# Run validation if called directly
if __FILE__ == $0
  project_path = ARGV[0] || '.'
  
  puts "🔧 NestJS Plugin Architecture Validator"
  puts "📂 Scanning: #{project_path}"
  puts ""
  
  validator = PluginValidator.new
  success = validator.validate_project(project_path)
  
  exit(success ? 0 : 1)
end