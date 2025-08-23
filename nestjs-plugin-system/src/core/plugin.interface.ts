import { Type } from '@nestjs/common';

/**
 * Base metadata for all plugins
 * LLMs must include this exact structure
 */
export interface PluginMetadata {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  readonly category: 'business' | 'utility' | 'integration' | 'auth';
  readonly dependencies?: string[];
}

/**
 * Request/Response schemas for type safety
 * LLMs must define these interfaces
 */
export interface ActionSchema {
  readonly request: Type<any>;
  readonly response: Type<any>;
}

/**
 * Validation rules that LLMs must implement
 */
export interface ValidationRule {
  readonly name: string;
  readonly message: string;
  validate(input: any): boolean | Promise<boolean>;
}

/**
 * Core plugin interface - ALL LLM-generated actions must implement this
 * This is our constraint boundary
 */
export interface IActionPlugin {
  readonly metadata: PluginMetadata;
  readonly schema: ActionSchema;
  readonly validationRules: ValidationRule[];
  
  /**
   * Execute the plugin action
   * LLMs must implement this with proper error handling
   */
  execute(input: any): Promise<any>;
  
  /**
   * Validate input before execution
   * LLMs cannot override this - it's enforced by the framework
   */
  validateInput(input: any): Promise<boolean>;
  
  /**
   * Health check for the plugin
   * LLMs must implement this for monitoring
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Plugin registration interface
 * Framework uses this to discover and register plugins
 */
export interface IPluginRegistry {
  register(plugin: IActionPlugin): void;
  unregister(name: string): void;
  getPlugin(name: string): IActionPlugin | undefined;
  getAllPlugins(): IActionPlugin[];
  validatePlugin(plugin: IActionPlugin): boolean;
}

/**
 * Plugin lifecycle hooks
 * LLMs can optionally implement these
 */
export interface IPluginLifecycle {
  onRegister?(): Promise<void>;
  onUnregister?(): Promise<void>;
  onApplicationStart?(): Promise<void>;
  onApplicationShutdown?(): Promise<void>;
}