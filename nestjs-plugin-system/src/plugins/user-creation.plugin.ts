import { Injectable } from '@nestjs/common';
import { BaseActionPlugin } from '../core/base-plugin.abstract';
import { PluginMetadata, ActionSchema, ValidationRule } from '../core/plugin.interface';

/**
 * Request interface for user creation
 * LLMs must define this structure
 */
interface UserCreationRequest {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: 'admin' | 'user' | 'guest';
}

/**
 * Response interface for user creation
 * LLMs must define this structure
 */
interface UserCreationResponse {
  readonly userId: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: string;
  readonly createdAt: Date;
  readonly isActive: boolean;
}

/**
 * Example plugin following our constrained architecture
 * LLMs must follow this exact pattern
 */
@Injectable()
export class UserCreationPlugin extends BaseActionPlugin {
  readonly metadata: PluginMetadata = {
    name: 'user-creation',
    version: '1.0.0',
    description: 'Creates new users with proper validation and role assignment',
    author: 'System',
    category: 'business'
  };

  readonly schema: ActionSchema = {
    request: Object as any, // UserCreationRequest interface
    response: Object as any  // UserCreationResponse interface
  };

  readonly validationRules: ValidationRule[] = [
    {
      name: 'email_format',
      message: 'Email must be in valid format',
      validate: (input: UserCreationRequest) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input.email);
      }
    },
    {
      name: 'name_length',
      message: 'First and last name must be at least 2 characters',
      validate: (input: UserCreationRequest) => {
        return input.firstName.length >= 2 && input.lastName.length >= 2;
      }
    },
    {
      name: 'valid_role',
      message: 'Role must be admin, user, or guest',
      validate: (input: UserCreationRequest) => {
        return ['admin', 'user', 'guest'].includes(input.role);
      }
    }
  ];

  /**
   * Execute user creation
   * LLMs must implement business logic here
   */
  async execute(input: UserCreationRequest): Promise<UserCreationResponse> {
    try {
      // Simulate user creation logic
      // In real implementation, this would interact with database
      const userId = this.generateUserId();
      const fullName = `${input.firstName} ${input.lastName}`;
      
      // Business logic: users start as inactive, admins start as active
      const isActive = input.role === 'admin';
      
      return {
        userId,
        email: input.email,
        fullName,
        role: input.role,
        createdAt: new Date(),
        isActive
      };
    } catch (error) {
      throw new Error(`User creation failed: ${error.message}`);
    }
  }

  /**
   * Health check implementation
   * LLMs must implement this
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simulate health checks
      // In real implementation, check database connectivity, external services, etc.
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Private helper method
   * LLMs can implement helper methods as needed
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}