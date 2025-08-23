import { Test, TestingModule } from '@nestjs/testing';
import { UserCreationPlugin } from './user-creation.plugin';

describe('UserCreationPlugin', () => {
  let plugin: UserCreationPlugin;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserCreationPlugin],
    }).compile();

    plugin = module.get<UserCreationPlugin>(UserCreationPlugin);
  });

  it('should be defined', () => {
    expect(plugin).toBeDefined();
  });

  it('should have correct metadata', () => {
    expect(plugin.metadata.name).toBe('user-creation');
    expect(plugin.metadata.version).toBe('1.0.0');
    expect(plugin.metadata.category).toBe('business');
  });

  it('should validate email format', async () => {
    const validInput = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user' as const
    };

    const invalidInput = {
      email: 'invalid-email',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user' as const
    };

    await expect(plugin.validateInput(validInput)).resolves.toBe(true);
    await expect(plugin.validateInput(invalidInput)).rejects.toThrow('Email must be in valid format');
  });

  it('should create user successfully', async () => {
    const input = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user' as const
    };

    const result = await plugin.execute(input);

    expect(result.email).toBe('test@example.com');
    expect(result.fullName).toBe('John Doe');
    expect(result.role).toBe('user');
    expect(result.userId).toContain('user_');
    expect(result.isActive).toBe(false); // users start inactive
  });

  it('should make admin users active by default', async () => {
    const input = {
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin' as const
    };

    const result = await plugin.execute(input);

    expect(result.isActive).toBe(true); // admins start active
  });

  it('should pass health check', async () => {
    const isHealthy = await plugin.healthCheck();
    expect(isHealthy).toBe(true);
  });
});