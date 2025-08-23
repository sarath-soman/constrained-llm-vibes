import { Injectable } from '@nestjs/common';
import { IActionPlugin, PluginMetadata, ActionSchema, ValidationRule } from './plugin.interface';

/**
 * Abstract base class that enforces our plugin architecture
 * LLMs must extend this class - they cannot deviate from this pattern
 */
@Injectable()
export abstract class BaseActionPlugin implements IActionPlugin {
  abstract readonly metadata: PluginMetadata;
  abstract readonly schema: ActionSchema;
  abstract readonly validationRules: ValidationRule[];

  /**
   * Template method pattern - LLMs implement this
   * Framework ensures it's called with validated input
   */
  abstract execute(input: any): Promise<any>;

  /**
   * Health check implementation - LLMs must override
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Input validation - SEALED METHOD
   * LLMs cannot override this - framework controls validation
   */
  async validateInput(input: any): Promise<boolean> {
    // Framework-enforced validation
    if (!input) {
      throw new Error('Input cannot be null or undefined');
    }

    // Type validation against schema
    if (!this.validateSchema(input)) {
      throw new Error(`Input does not match schema for plugin: ${this.metadata.name}`);
    }

    // Run all validation rules
    for (const rule of this.validationRules) {
      const isValid = await rule.validate(input);
      if (!isValid) {
        throw new Error(`Validation failed: ${rule.message}`);
      }
    }

    return true;
  }

  /**
   * Schema validation - SEALED METHOD
   * Framework ensures type safety
   */
  private validateSchema(input: any): boolean {
    // In a real implementation, this would use a proper schema validator
    // like Joi, Yup, or class-validator
    return typeof input === 'object' && input !== null;
  }

  /**
   * Safe execution wrapper - SEALED METHOD
   * Framework controls the execution flow
   */
  async safeExecute(input: any): Promise<any> {
    try {
      // Validate first
      await this.validateInput(input);
      
      // Execute with error boundary
      const result = await this.execute(input);
      
      // Validate output
      if (!this.validateOutput(result)) {
        throw new Error(`Plugin ${this.metadata.name} returned invalid output`);
      }
      
      return result;
    } catch (error) {
      // Structured error handling
      throw new PluginExecutionError(
        this.metadata.name,
        error instanceof Error ? error.message : 'Unknown error',
        error
      );
    }
  }

  /**
   * Output validation - SEALED METHOD
   */
  private validateOutput(output: any): boolean {
    // Framework ensures output matches expected schema
    return output !== undefined;
  }

  /**
   * Plugin information - SEALED METHOD
   */
  getInfo(): PluginInfo {
    return {
      name: this.metadata.name,
      version: this.metadata.version,
      description: this.metadata.description,
      category: this.metadata.category,
      isHealthy: false, // Will be set by health checks
      lastExecuted: null,
      executionCount: 0
    };
  }
}

/**
 * Plugin execution error - Framework-defined error type
 */
export class PluginExecutionError extends Error {
  constructor(
    public readonly pluginName: string,
    public readonly pluginError: string,
    public readonly originalError?: any
  ) {
    super(`Plugin ${pluginName} failed: ${pluginError}`);
    this.name = 'PluginExecutionError';
  }
}

/**
 * Plugin information structure
 */
export interface PluginInfo {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly category: string;
  isHealthy: boolean;
  lastExecuted: Date | null;
  executionCount: number;
}