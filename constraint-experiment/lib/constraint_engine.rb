# Ruby-based constraint specification system
# Leverages Ruby's expressiveness for readable, maintainable architectural rules

require 'ast'
require 'parser/current'
require 'json'

class ConstraintEngine
  def initialize
    @rules = []
    @violations = []
  end

  def rule(id, description = nil, &block)
    @rules << Rule.new(id, description, block)
  end

  def check_file(file_path)
    source = File.read(file_path)
    @violations = []
    
    # Parse different file types appropriately
    case File.extname(file_path)
    when '.rb'
      check_ruby_file(source, file_path)
    when '.ts', '.js'
      check_typescript_file(source, file_path)
    when '.py'
      check_python_file(source, file_path)
    else
      check_generic_file(source, file_path)
    end
    
    @violations
  end

  def check_project(project_path)
    all_violations = []
    
    Dir.glob("#{project_path}/**/*.{rb,ts,js,py,java,go}").each do |file|
      next if file.include?('node_modules') || file.include?('.git')
      violations = check_file(file)
      all_violations.concat(violations)
    end
    
    all_violations
  end

  def report_violations(violations = @violations)
    violations.group_by(&:severity).each do |severity, group|
      puts "\n#{severity.upcase} (#{group.size}):"
      group.each do |violation|
        puts "  #{violation.file}:#{violation.line} - #{violation.message}"
        puts "    Rule: #{violation.rule_id}"
        puts "    Fix: #{violation.suggestion}" if violation.suggestion
      end
    end
  end

  private

  def check_ruby_file(source, file_path)
    begin
      ast = Parser::CurrentRuby.parse(source)
      context = RubyContext.new(source, file_path)
      
      @rules.each do |rule|
        rule.apply(ast, context).each do |violation|
          @violations << violation
        end
      end
    rescue Parser::SyntaxError => e
      @violations << Violation.new(
        rule_id: 'syntax_error',
        file: file_path,
        line: e.diagnostic.location.line,
        message: "Syntax error: #{e.message}",
        severity: :error
      )
    end
  end

  def check_typescript_file(source, file_path)
    # For demo - in practice, use a proper TS parser
    context = GenericContext.new(source, file_path)
    
    @rules.each do |rule|
      rule.apply(source, context).each do |violation|
        @violations << violation
      end
    end
  end

  def check_generic_file(source, file_path)
    context = GenericContext.new(source, file_path)
    
    @rules.each do |rule|
      # Apply pattern-based rules
      rule.apply(source, context).each do |violation|
        @violations << violation
      end
    end
  end
end

class Rule
  attr_reader :id, :description

  def initialize(id, description, block)
    @id = id
    @description = description
    @block = block
    @matchers = []
    @conditions = []
    @exceptions = []
    @suggestion = nil
    @severity = :warning
    @autofix = nil
  end

  def apply(ast_or_source, context)
    violations = []
    
    # Create a DSL context for the rule
    rule_context = RuleDSL.new(ast_or_source, context)
    rule_context.instance_eval(&@block)
    
    # Collect violations from the rule context
    rule_context.violations.each do |violation|
      violation.rule_id = @id
      violations << violation
    end
    
    violations
  end
end

class RuleDSL
  attr_reader :violations

  def initialize(ast_or_source, file_context)
    @ast_or_source = ast_or_source
    @file_context = file_context
    @violations = []
    @current_severity = :warning
    @current_suggestion = nil
  end

  # DSL methods for creating readable rules

  def severity(level)
    @current_severity = level
  end

  def suggest(message)
    @current_suggestion = message
  end

  def forbid(description)
    ForbiddenPattern.new(description, self)
  end

  def require_that(description)
    RequiredPattern.new(description, self)
  end

  def when_file(pattern)
    return unless @file_context.file_matches?(pattern)
    yield
  end

  def when_not_in(directories)
    return if @file_context.in_directory?(directories)
    yield
  end

  def contains(pattern)
    case pattern
    when String
      @file_context.source.include?(pattern)
    when Regex
      @file_context.source.match?(pattern)
    else
      false
    end
  end

  def has_class(name)
    case @ast_or_source
    when String
      @ast_or_source.match?(/class\s+#{name}/)
    else
      # AST-based check would go here
      false
    end
  end

  def has_method(name)
    case @ast_or_source
    when String
      @ast_or_source.match?(/def\s+#{name}/)
    else
      false
    end
  end

  def imports_from(pattern)
    case @ast_or_source
    when String
      @ast_or_source.match?(/(?:require|import).*#{pattern}/)
    else
      false
    end
  end

  def violation!(message)
    @violations << Violation.new(
      file: @file_context.path,
      line: @file_context.current_line || 1,
      message: message,
      severity: @current_severity,
      suggestion: @current_suggestion
    )
  end

  # Pattern matching helpers
  def each_line
    @file_context.source.each_line.with_index(1) do |line, line_number|
      @file_context.current_line = line_number
      yield line, line_number
    end
  end

  def find_pattern(regex)
    matches = []
    each_line do |line, line_number|
      if line.match?(regex)
        matches << { line: line_number, content: line.strip }
      end
    end
    matches
  end
end

class ForbiddenPattern
  def initialize(description, dsl)
    @description = description
    @dsl = dsl
  end

  def pattern(regex)
    matches = @dsl.find_pattern(regex)
    unless matches.empty?
      matches.each do |match|
        @dsl.violation!("Forbidden pattern: #{@description} (found: #{match[:content]})")
      end
    end
    self
  end

  def in_files(pattern)
    # Only check files matching the pattern
    return self unless @dsl.instance_variable_get(:@file_context).file_matches?(pattern)
    yield self if block_given?
    self
  end
end

class RequiredPattern
  def initialize(description, dsl)
    @description = description
    @dsl = dsl
  end

  def pattern(regex)
    unless @dsl.instance_variable_get(:@ast_or_source).match?(regex)
      @dsl.violation!("Required pattern missing: #{@description}")
    end
    self
  end
end

class Violation
  attr_accessor :rule_id, :file, :line, :message, :severity, :suggestion

  def initialize(rule_id: nil, file:, line:, message:, severity: :warning, suggestion: nil)
    @rule_id = rule_id
    @file = file
    @line = line
    @message = message
    @severity = severity
    @suggestion = suggestion
  end

  def to_h
    {
      rule_id: @rule_id,
      file: @file,
      line: @line,
      message: @message,
      severity: @severity,
      suggestion: @suggestion
    }
  end
end

class RubyContext
  attr_reader :source, :path
  attr_accessor :current_line

  def initialize(source, path)
    @source = source
    @path = path
    @current_line = nil
  end

  def file_matches?(pattern)
    case pattern
    when String
      @path.include?(pattern)
    when Regex
      @path.match?(pattern)
    else
      false
    end
  end

  def in_directory?(directories)
    Array(directories).any? { |dir| @path.include?(dir) }
  end
end

class GenericContext
  attr_reader :source, :path
  attr_accessor :current_line

  def initialize(source, path)
    @source = source
    @path = path
    @current_line = nil
  end

  def file_matches?(pattern)
    case pattern
    when String
      @path.include?(pattern)
    when Regex
      @path.match?(pattern)
    else
      false
    end
  end

  def in_directory?(directories)
    Array(directories).any? { |dir| @path.include?(dir) }
  end
end