import { Module } from '@nestjs/common';
import { PluginRegistryService } from './core/plugin-registry.service';
import { UserCreationPlugin } from './plugins/user-creation.plugin';
import { EmailNotificationPlugin } from './plugins/email-notification.plugin';
import { PluginController } from './plugin.controller';

@Module({
  imports: [],
  controllers: [PluginController],
  providers: [
    PluginRegistryService,
    UserCreationPlugin,
    EmailNotificationPlugin,
  ],
})
export class AppModule {}