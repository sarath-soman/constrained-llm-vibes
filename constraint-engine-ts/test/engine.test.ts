import * as fs from 'fs';
import * as path from 'path';
import { ConstraintEngine } from '../src/core/engine';
import { createRule } from '../src/core/rule-builder';

describe('ConstraintEngine', () => {
  let engine: ConstraintEngine;
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(__dirname, 'fixtures');
    engine = new ConstraintEngine({ projectRoot: testDir });
  });

  describe('rule management', () => {
    it('should add rules', () => {
      const rule = createRule()
        .id('test-rule')
        .name('Test Rule')
        .description('A test rule')
        .validate(() => []);

      engine.addRule(rule);
      expect(engine.getRules()).toHaveLength(1);
      expect(engine.getRules()[0].id).toBe('test-rule');
    });

    it('should remove rules', () => {
      const rule = createRule()
        .id('test-rule')
        .name('Test Rule')
        .description('A test rule')
        .validate(() => []);

      engine.addRule(rule);
      engine.removeRule('test-rule');
      expect(engine.getRules()).toHaveLength(0);
    });
  });

  describe('file validation', () => {
    beforeAll(() => {
      // Create test fixture directory and files
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }

      // Good plugin file
      fs.writeFileSync(path.join(testDir, 'good.plugin.ts'), `
import { Injectable } from '@nestjs/common';
import { BaseActionPlugin } from '../core/base-plugin.abstract';
import { PluginMetadata, ActionSchema, ValidationRule } from '../core/plugin.interface';

@Injectable()
export class GoodPlugin extends BaseActionPlugin {
  readonly metadata: PluginMetadata = {
    name: 'good-plugin',
    version: '1.0.0',
    description: 'A good plugin',
    author: 'Test',
    category: 'utility'
  };

  readonly schema: ActionSchema = {
    request: Object as any,
    response: Object as any
  };

  readonly validationRules: ValidationRule[] = [];

  async execute(input: any): Promise<any> {
    return { success: true };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
      `);

      // Bad plugin file
      fs.writeFileSync(path.join(testDir, 'bad.plugin.ts'), `
export class BadPlugin {
  doSomething() {
    console.log('This is wrong');
  }
}
      `);
    });

    afterAll(() => {
      // Clean up test fixtures
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
    });

    it('should validate good plugin file', async () => {
      const rule = createRule()
        .id('test-extends')
        .name('Test Extends')
        .description('Must extend BaseActionPlugin')
        .validate((context) => {
          if (!context.content.includes('extends BaseActionPlugin')) {
            return [{
              ruleId: 'test-extends',
              severity: 'error' as const,
              message: 'Must extend BaseActionPlugin',
              file: context.file
            }];
          }
          return [];
        });

      engine.addRule(rule);
      
      const result = await engine.validateFile(path.join(testDir, 'good.plugin.ts'));
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should find violations in bad plugin file', async () => {
      const rule = createRule()
        .id('test-extends')
        .name('Test Extends')
        .description('Must extend BaseActionPlugin')
        .validate((context) => {
          if (!context.content.includes('extends BaseActionPlugin')) {
            return [{
              ruleId: 'test-extends',
              severity: 'error' as const,
              message: 'Must extend BaseActionPlugin',
              file: context.file
            }];
          }
          return [];
        });

      engine.addRule(rule);
      
      const result = await engine.validateFile(path.join(testDir, 'bad.plugin.ts'));
      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].message).toBe('Must extend BaseActionPlugin');
    });
  });

  describe('statistics', () => {
    it('should track validation statistics', async () => {
      const rule = createRule()
        .id('test-rule')
        .name('Test Rule')
        .description('A test rule')
        .validate(() => []);

      engine.addRule(rule);
      
      const stats = engine.getStats();
      expect(stats.filesProcessed).toBe(0);
      expect(stats.totalViolations).toBe(0);
    });
  });
});