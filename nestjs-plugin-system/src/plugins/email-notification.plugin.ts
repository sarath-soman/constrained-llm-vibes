import { Injectable } from '@nestjs/common';
import { BaseActionPlugin } from '../core/base-plugin.abstract';
import { PluginMetadata, ActionSchema, ValidationRule } from '../core/plugin.interface';

/**
 * Request interface for email notifications
 */
interface EmailNotificationRequest {
  readonly to: string[];
  readonly subject: string;
  readonly body: string;
  readonly priority: 'low' | 'normal' | 'high';
  readonly templateId?: string;
  readonly templateData?: Record<string, any>;
}

/**
 * Response interface for email notifications
 */
interface EmailNotificationResponse {
  readonly messageId: string;
  readonly status: 'sent' | 'queued' | 'failed';
  readonly recipients: number;
  readonly sentAt: Date;
  readonly deliveryEstimate?: Date;
}

/**
 * Email notification plugin following constrained architecture
 */
@Injectable()
export class EmailNotificationPlugin extends BaseActionPlugin {
  readonly metadata: PluginMetadata = {
    name: 'email-notification',
    version: '1.2.0',
    description: 'Sends email notifications with template support and priority handling',
    author: 'System',
    category: 'utility'
  };

  readonly schema: ActionSchema = {
    request: Object as any, // EmailNotificationRequest interface
    response: Object as any  // EmailNotificationResponse interface
  };

  readonly validationRules: ValidationRule[] = [
    {
      name: 'recipients_not_empty',
      message: 'Must have at least one recipient',
      validate: (input: EmailNotificationRequest) => {
        return Array.isArray(input.to) && input.to.length > 0;
      }
    },
    {
      name: 'valid_email_addresses',
      message: 'All recipients must have valid email addresses',
      validate: (input: EmailNotificationRequest) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return input.to.every(email => emailRegex.test(email));
      }
    },
    {
      name: 'subject_not_empty',
      message: 'Subject cannot be empty',
      validate: (input: EmailNotificationRequest) => {
        return input.subject && input.subject.trim().length > 0;
      }
    },
    {
      name: 'body_or_template',
      message: 'Must provide either body text or template ID',
      validate: (input: EmailNotificationRequest) => {
        return (input.body && input.body.trim().length > 0) || 
               (input.templateId && input.templateId.trim().length > 0);
      }
    },
    {
      name: 'valid_priority',
      message: 'Priority must be low, normal, or high',
      validate: (input: EmailNotificationRequest) => {
        return ['low', 'normal', 'high'].includes(input.priority);
      }
    },
    {
      name: 'recipient_limit',
      message: 'Cannot send to more than 100 recipients at once',
      validate: (input: EmailNotificationRequest) => {
        return input.to.length <= 100;
      }
    }
  ];

  async execute(input: EmailNotificationRequest): Promise<EmailNotificationResponse> {
    try {
      // Simulate email sending logic
      const messageId = this.generateMessageId();
      
      // Determine status based on priority
      const status = this.determineInitialStatus(input.priority);
      
      // Calculate delivery estimate based on priority
      const deliveryEstimate = this.calculateDeliveryEstimate(input.priority);
      
      // In real implementation, this would integrate with email service
      // like SendGrid, AWS SES, etc.
      
      return {
        messageId,
        status,
        recipients: input.to.length,
        sentAt: new Date(),
        deliveryEstimate
      };
    } catch (error) {
      throw new Error(`Email notification failed: ${error.message}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // In real implementation, check email service connectivity
      // Check rate limits, authentication, etc.
      return true;
    } catch (error) {
      return false;
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  private determineInitialStatus(priority: string): 'sent' | 'queued' | 'failed' {
    // High priority emails send immediately
    // Normal priority emails may be queued
    // Low priority emails are always queued
    switch (priority) {
      case 'high':
        return 'sent';
      case 'normal':
        return Math.random() > 0.3 ? 'sent' : 'queued';
      case 'low':
        return 'queued';
      default:
        return 'queued';
    }
  }

  private calculateDeliveryEstimate(priority: string): Date {
    const now = new Date();
    const estimates = {
      high: 1, // 1 minute
      normal: 5, // 5 minutes
      low: 30 // 30 minutes
    };
    
    const delayMinutes = estimates[priority] || 5;
    return new Date(now.getTime() + (delayMinutes * 60 * 1000));
  }
}