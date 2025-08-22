"use strict";
/**
 * Main entry point for constraint engine
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplePluginRules = exports.ConstraintRuleBuilder = exports.ValidationHelpers = exports.createRule = exports.ConstraintEngine = void 0;
// Core exports
var engine_1 = require("./core/engine");
Object.defineProperty(exports, "ConstraintEngine", { enumerable: true, get: function () { return engine_1.ConstraintEngine; } });
var rule_builder_1 = require("./core/rule-builder");
Object.defineProperty(exports, "createRule", { enumerable: true, get: function () { return rule_builder_1.createRule; } });
Object.defineProperty(exports, "ValidationHelpers", { enumerable: true, get: function () { return rule_builder_1.ValidationHelpers; } });
Object.defineProperty(exports, "ConstraintRuleBuilder", { enumerable: true, get: function () { return rule_builder_1.ConstraintRuleBuilder; } });
// Rule sets
var simple_plugin_rules_1 = require("./rules/simple-plugin-rules");
Object.defineProperty(exports, "simplePluginRules", { enumerable: true, get: function () { return simple_plugin_rules_1.simplePluginRules; } });
//# sourceMappingURL=index.js.map