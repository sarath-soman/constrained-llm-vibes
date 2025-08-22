/**
 * Main entry point for constraint engine
 */

// Core exports
export { ConstraintEngine } from './core/engine';
export { createRule, ValidationHelpers, ConstraintRuleBuilder } from './core/rule-builder';
export type {
  ConstraintRule,
  ValidationResult,
  ValidationContext,
  PluginValidationContext,
  Violation,
  EngineOptions,
  EngineStats,
  RuleSet,
  PluginMetadata
} from './core/types';

// Rule sets
export { simplePluginRules } from './rules/simple-plugin-rules';