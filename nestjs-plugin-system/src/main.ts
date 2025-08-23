import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PluginRegistryService } from './core/plugin-registry.service';
import { UserCreationPlugin } from './plugins/user-creation.plugin';
import { EmailNotificationPlugin } from './plugins/email-notification.plugin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Register plugins
  const pluginRegistry = app.get(PluginRegistryService);
  const userCreationPlugin = app.get(UserCreationPlugin);
  const emailNotificationPlugin = app.get(EmailNotificationPlugin);
  
  pluginRegistry.register(userCreationPlugin);
  pluginRegistry.register(emailNotificationPlugin);
  
  console.log('🔧 NestJS Plugin System Starting...');
  console.log(`📦 Registered ${pluginRegistry.getAllPlugins().length} plugins`);
  
  await app.listen(3000);
  console.log('🚀 Plugin system running on http://localhost:3000');
  console.log('📖 API endpoints:');
  console.log('   GET  /plugins - List all plugins');
  console.log('   GET  /plugins/:name - Get plugin details');
  console.log('   POST /plugins/:name/execute - Execute plugin');
  console.log('   GET  /plugins/health/status - Health check all');
  console.log('   GET  /plugins/:name/health - Health check specific plugin');
}

bootstrap();