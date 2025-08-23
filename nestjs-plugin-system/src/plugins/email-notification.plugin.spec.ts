import { Test, TestingModule } from '@nestjs/testing';
import { EmailNotificationPlugin } from './email-notification.plugin';

describe('EmailNotificationPlugin', () => {
  let plugin: EmailNotificationPlugin;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailNotificationPlugin],
    }).compile();

    plugin = module.get<EmailNotificationPlugin>(EmailNotificationPlugin);
  });

  it('should be defined', () => {
    expect(plugin).toBeDefined();
  });

  it('should have correct metadata', () => {
    expect(plugin.metadata.name).toBe('email-notification');
    expect(plugin.metadata.category).toBe('utility');
  });

  it('should validate email addresses', async () => {
    const validInput = {
      to: ['test@example.com', 'user@domain.org'],
      subject: 'Test Subject',
      body: 'Test body content',
      priority: 'normal' as const
    };

    const invalidInput = {
      to: ['invalid-email', 'test@example.com'],
      subject: 'Test Subject',
      body: 'Test body content',
      priority: 'normal' as const
    };

    await expect(plugin.validateInput(validInput)).resolves.toBe(true);
    await expect(plugin.validateInput(invalidInput)).rejects.toThrow();
  });

  it('should require subject', async () => {
    const input = {
      to: ['test@example.com'],
      subject: '',
      body: 'Test body',
      priority: 'normal' as const
    };

    await expect(plugin.validateInput(input)).rejects.toThrow('Subject cannot be empty');
  });

  it('should require body or template', async () => {
    const validWithBody = {
      to: ['test@example.com'],
      subject: 'Test',
      body: 'Test body',
      priority: 'normal' as const
    };

    const validWithTemplate = {
      to: ['test@example.com'],
      subject: 'Test',
      body: '',
      templateId: 'welcome-email',
      priority: 'normal' as const
    };

    const invalid = {
      to: ['test@example.com'],
      subject: 'Test',
      body: '',
      priority: 'normal' as const
    };

    await expect(plugin.validateInput(validWithBody)).resolves.toBe(true);
    await expect(plugin.validateInput(validWithTemplate)).resolves.toBe(true);
    await expect(plugin.validateInput(invalid)).rejects.toThrow('Must provide either body text or template ID');
  });

  it('should send email successfully', async () => {
    const input = {
      to: ['test@example.com', 'user@example.com'],
      subject: 'Test Email',
      body: 'This is a test email',
      priority: 'high' as const
    };

    const result = await plugin.execute(input);

    expect(result.messageId).toContain('msg_');
    expect(result.recipients).toBe(2);
    expect(result.status).toMatch(/^(sent|queued|failed)$/);
    expect(result.sentAt).toBeInstanceOf(Date);
    expect(result.deliveryEstimate).toBeInstanceOf(Date);
  });

  it('should handle high priority emails', async () => {
    const input = {
      to: ['urgent@example.com'],
      subject: 'Urgent Email',
      body: 'This is urgent',
      priority: 'high' as const
    };

    const result = await plugin.execute(input);

    // High priority emails should be sent immediately
    expect(result.status).toBe('sent');
  });

  it('should enforce recipient limit', async () => {
    const tooManyRecipients = Array.from({ length: 101 }, (_, i) => `user${i}@example.com`);
    
    const input = {
      to: tooManyRecipients,
      subject: 'Test',
      body: 'Test body',
      priority: 'normal' as const
    };

    await expect(plugin.validateInput(input)).rejects.toThrow('Cannot send to more than 100 recipients at once');
  });

  it('should pass health check', async () => {
    const isHealthy = await plugin.healthCheck();
    expect(isHealthy).toBe(true);
  });
});