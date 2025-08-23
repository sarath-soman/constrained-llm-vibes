import { Injectable, Logger } from '@nestjs/common';
import { IActionPlugin, IPluginRegistry } from './plugin.interface';
import { BaseActionPlugin } from './base-plugin.abstract';

/**
 * Plugin registry service - manages all plugins
 * Enforces constraints on plugin registration
 */
@Injectable()
export class PluginRegistryService implements IPluginRegistry {
  private readonly logger = new Logger(PluginRegistryService.name);
  private readonly plugins = new Map<string, IActionPlugin>();
  private readonly pluginStats = new Map<string, PluginStats>();

  /**
   * Register a plugin with validation
   * Only accepts plugins that follow our constraints
   */
  register(plugin: IActionPlugin): void {
    if (!this.validatePlugin(plugin)) {
      throw new Error(`Plugin validation failed: ${plugin.metadata?.name || 'unknown'}`);
    }

    const name = plugin.metadata.name;
    
    if (this.plugins.has(name)) {
      throw new Error(`Plugin ${name} is already registered`);
    }

    this.plugins.set(name, plugin);
    this.pluginStats.set(name, new PluginStats(name));
    
    this.logger.log(`Plugin registered: ${name} v${plugin.metadata.version}`);
    
    // Call lifecycle hook if implemented
    if ('onRegister' in plugin && typeof plugin.onRegister === 'function') {
      plugin.onRegister().catch(err => 
        this.logger.error(`Plugin ${name} onRegister hook failed: ${err.message}`)
      );
    }
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }

    // Call lifecycle hook if implemented
    if ('onUnregister' in plugin && typeof plugin.onUnregister === 'function') {
      plugin.onUnregister().catch(err => 
        this.logger.error(`Plugin ${name} onUnregister hook failed: ${err.message}`)
      );
    }

    this.plugins.delete(name);
    this.pluginStats.delete(name);
    this.logger.log(`Plugin unregistered: ${name}`);
  }

  /**
   * Get a specific plugin
   */
  getPlugin(name: string): IActionPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): IActionPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Validate plugin against our constraints
   * This is where we enforce the architecture
   */
  validatePlugin(plugin: IActionPlugin): boolean {
    try {
      // Must extend BaseActionPlugin
      if (!(plugin instanceof BaseActionPlugin)) {
        this.logger.error('Plugin must extend BaseActionPlugin');
        return false;
      }

      // Validate metadata
      if (!this.validateMetadata(plugin.metadata)) {
        return false;
      }

      // Validate schema
      if (!this.validateSchema(plugin.schema)) {
        return false;
      }

      // Validate validation rules
      if (!this.validateValidationRules(plugin.validationRules)) {
        return false;
      }

      // Validate required methods
      if (!this.validateRequiredMethods(plugin)) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Plugin validation error: ${error.message}`);
      return false;
    }
  }

  /**
   * Execute a plugin safely
   */
  async executePlugin(name: string, input: any): Promise<any> {
    const plugin = this.getPlugin(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }

    if (!(plugin instanceof BaseActionPlugin)) {
      throw new Error(`Plugin ${name} is not a valid BaseActionPlugin`);
    }

    const stats = this.pluginStats.get(name);
    const startTime = Date.now();

    try {
      const result = await plugin.safeExecute(input);
      
      // Update stats
      if (stats) {
        stats.recordSuccess(Date.now() - startTime);
      }
      
      return result;
    } catch (error) {
      // Update stats
      if (stats) {
        stats.recordFailure(Date.now() - startTime);
      }
      
      throw error;
    }
  }

  /**
   * Get plugin statistics
   */
  getPluginStats(name: string): PluginStats | undefined {
    return this.pluginStats.get(name);
  }

  /**
   * Get health status of all plugins
   */
  async getHealthStatus(): Promise<PluginHealthReport[]> {
    const reports: PluginHealthReport[] = [];
    
    for (const [name, plugin] of this.plugins) {
      try {
        const isHealthy = await plugin.healthCheck();
        const stats = this.pluginStats.get(name);
        
        reports.push({
          name,
          version: plugin.metadata.version,
          isHealthy,
          lastChecked: new Date(),
          stats: stats?.getSnapshot()
        });
      } catch (error) {
        reports.push({
          name,
          version: plugin.metadata.version,
          isHealthy: false,
          lastChecked: new Date(),
          error: error.message
        });
      }
    }
    
    return reports;
  }

  private validateMetadata(metadata: any): boolean {
    if (!metadata || typeof metadata !== 'object') {
      this.logger.error('Plugin metadata is required');
      return false;
    }

    const required = ['name', 'version', 'description', 'author', 'category'];
    for (const field of required) {
      if (!metadata[field] || typeof metadata[field] !== 'string') {
        this.logger.error(`Plugin metadata.${field} is required and must be a string`);
        return false;
      }
    }

    const validCategories = ['business', 'utility', 'integration', 'auth'];
    if (!validCategories.includes(metadata.category)) {
      this.logger.error(`Plugin category must be one of: ${validCategories.join(', ')}`);
      return false;
    }

    return true;
  }

  private validateSchema(schema: any): boolean {
    if (!schema || typeof schema !== 'object') {
      this.logger.error('Plugin schema is required');
      return false;
    }

    if (!schema.request || !schema.response) {
      this.logger.error('Plugin schema must have request and response types');
      return false;
    }

    return true;
  }

  private validateValidationRules(rules: any): boolean {
    if (!Array.isArray(rules)) {
      this.logger.error('Plugin validationRules must be an array');
      return false;
    }

    for (const rule of rules) {
      if (!rule.name || !rule.message || typeof rule.validate !== 'function') {
        this.logger.error('Each validation rule must have name, message, and validate function');
        return false;
      }
    }

    return true;
  }

  private validateRequiredMethods(plugin: any): boolean {
    const required = ['execute', 'healthCheck'];
    for (const method of required) {
      if (typeof plugin[method] !== 'function') {
        this.logger.error(`Plugin must implement ${method} method`);
        return false;
      }
    }

    return true;
  }
}

/**
 * Plugin statistics tracking
 */
class PluginStats {
  private executionCount = 0;
  private successCount = 0;
  private failureCount = 0;
  private totalExecutionTime = 0;
  private lastExecuted: Date | null = null;
  private lastSuccess: Date | null = null;
  private lastFailure: Date | null = null;

  constructor(private readonly pluginName: string) {}

  recordSuccess(executionTime: number): void {
    this.executionCount++;
    this.successCount++;
    this.totalExecutionTime += executionTime;
    this.lastExecuted = new Date();
    this.lastSuccess = new Date();
  }

  recordFailure(executionTime: number): void {
    this.executionCount++;
    this.failureCount++;
    this.totalExecutionTime += executionTime;
    this.lastExecuted = new Date();
    this.lastFailure = new Date();
  }

  getSnapshot(): PluginStatsSnapshot {
    return {
      pluginName: this.pluginName,
      executionCount: this.executionCount,
      successCount: this.successCount,
      failureCount: this.failureCount,
      successRate: this.executionCount > 0 ? this.successCount / this.executionCount : 0,
      averageExecutionTime: this.executionCount > 0 ? this.totalExecutionTime / this.executionCount : 0,
      lastExecuted: this.lastExecuted,
      lastSuccess: this.lastSuccess,
      lastFailure: this.lastFailure
    };
  }
}

export interface PluginStatsSnapshot {
  pluginName: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecuted: Date | null;
  lastSuccess: Date | null;
  lastFailure: Date | null;
}

export interface PluginHealthReport {
  name: string;
  version: string;
  isHealthy: boolean;
  lastChecked: Date;
  stats?: PluginStatsSnapshot;
  error?: string;
}