import { Controller, Post, Get, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PluginRegistryService } from './core/plugin-registry.service';

@Controller('plugins')
export class PluginController {
  constructor(private readonly pluginRegistry: PluginRegistryService) {}

  /**
   * Execute a plugin by name
   */
  @Post(':pluginName/execute')
  async executePlugin(
    @Param('pluginName') pluginName: string,
    @Body() input: any
  ) {
    try {
      const result = await this.pluginRegistry.executePlugin(pluginName, input);
      return {
        success: true,
        data: result,
        pluginName,
        executedAt: new Date()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error.message,
          pluginName,
          executedAt: new Date()
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * List all available plugins
   */
  @Get()
  async listPlugins() {
    const plugins = this.pluginRegistry.getAllPlugins();
    
    return {
      success: true,
      count: plugins.length,
      plugins: plugins.map(plugin => ({
        name: plugin.metadata.name,
        version: plugin.metadata.version,
        description: plugin.metadata.description,
        category: plugin.metadata.category,
        author: plugin.metadata.author
      }))
    };
  }

  /**
   * Get plugin information
   */
  @Get(':pluginName')
  async getPlugin(@Param('pluginName') pluginName: string) {
    const plugin = this.pluginRegistry.getPlugin(pluginName);
    
    if (!plugin) {
      throw new HttpException(
        { success: false, error: `Plugin ${pluginName} not found` },
        HttpStatus.NOT_FOUND
      );
    }

    const stats = this.pluginRegistry.getPluginStats(pluginName);

    return {
      success: true,
      plugin: {
        metadata: plugin.metadata,
        schema: {
          request: plugin.schema.request.name,
          response: plugin.schema.response.name
        },
        validationRules: plugin.validationRules.map(rule => ({
          name: rule.name,
          message: rule.message
        })),
        stats: stats?.getSnapshot()
      }
    };
  }

  /**
   * Health check for all plugins
   */
  @Get('health/status')
  async getHealthStatus() {
    const healthReports = await this.pluginRegistry.getHealthStatus();
    
    const overallHealth = healthReports.every(report => report.isHealthy);
    
    return {
      success: true,
      overallHealth,
      plugins: healthReports
    };
  }

  /**
   * Health check for specific plugin
   */
  @Get(':pluginName/health')
  async getPluginHealth(@Param('pluginName') pluginName: string) {
    const plugin = this.pluginRegistry.getPlugin(pluginName);
    
    if (!plugin) {
      throw new HttpException(
        { success: false, error: `Plugin ${pluginName} not found` },
        HttpStatus.NOT_FOUND
      );
    }

    try {
      const isHealthy = await plugin.healthCheck();
      
      return {
        success: true,
        pluginName,
        isHealthy,
        checkedAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        pluginName,
        isHealthy: false,
        error: error.message,
        checkedAt: new Date()
      };
    }
  }
}