import { ConstraintRule } from '../core/types';
/**
 * NestJS Plugin Architecture Rules
 * Ported from Ruby with TypeScript improvements
 */
/**
 * Core plugin structure rules
 */
export declare const mustExtendBasePlugin: ConstraintRule;
export declare const mustHaveInjectableDecorator: ConstraintRule;
export declare const mustHaveMetadata: ConstraintRule;
export declare const mustHaveSchema: ConstraintRule;
export declare const mustHaveValidationRules: ConstraintRule;
export declare const mustImplementExecuteMethod: ConstraintRule;
export declare const mustImplementHealthCheck: ConstraintRule;
/**
 * Import and dependency rules
 */
export declare const mustImportRequiredModules: ConstraintRule;
/**
 * Naming convention rules
 */
export declare const pluginFileNaming: ConstraintRule;
export declare const pluginClassNaming: ConstraintRule;
export declare const metadataCategoryValidation: ConstraintRule;
/**
 * Security rules
 */
export declare const noConsoleLogging: ConstraintRule;
export declare const noHardcodedSecrets: ConstraintRule;
/**
 * Testing rules
 */
export declare const mustHaveTestFile: ConstraintRule;
/**
 * Export all NestJS plugin rules as a rule set
 */
export declare const nestjsPluginRules: ConstraintRule[];
//# sourceMappingURL=nestjs-plugin-rules.d.ts.map