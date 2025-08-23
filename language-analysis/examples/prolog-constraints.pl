% Prolog Constraint Rules for Plugin Architecture
% Ultimate expressiveness - constraints as logical facts

% Define base architectural rules
plugin_rule(Class) :-
    extends_class(Class, 'BaseActionPlugin'),
    has_decorator(Class, 'Injectable'),
    defines_property(Class, metadata).

% Enhanced plugin rule with detailed constraints
valid_plugin(Class) :-
    plugin_rule(Class),
    has_execute_method(Class),
    has_health_check(Class),
    validates_input_schema(Class).

% Constraint checking predicates
extends_class(Class, BaseClass) :-
    contains_pattern(Class, extends_pattern(BaseClass)).

has_decorator(Class, Decorator) :-
    contains_pattern(Class, decorator_pattern(Decorator)).

defines_property(Class, Property) :-
    contains_pattern(Class, property_pattern(Property)).

has_execute_method(Class) :-
    contains_pattern(Class, method_pattern('execute')).

has_health_check(Class) :-
    contains_pattern(Class, method_pattern('healthCheck')).

validates_input_schema(Class) :-
    contains_pattern(Class, schema_validation_pattern).

% Pattern matching rules (would be implemented with actual parsing)
extends_pattern(BaseClass, Pattern) :-
    atom_concat('extends ', BaseClass, Pattern).

decorator_pattern(Decorator, Pattern) :-
    atom_concat('@', Decorator, Pattern).

property_pattern(Property, Pattern) :-
    atom_concat('readonly ', Property, Pattern).

method_pattern(Method, Pattern) :-
    atom_concat(Method, '(', Pattern).

schema_validation_pattern('validateInput').

% Main validation query
find_violations(Class, Violations) :-
    \+ valid_plugin(Class),
    findall(Rule, (plugin_constraint(Rule), \+ call(Rule, Class)), Violations).

% Define all plugin constraints
plugin_constraint(extends_class(_, 'BaseActionPlugin')).
plugin_constraint(has_decorator(_, 'Injectable')).
plugin_constraint(defines_property(_, metadata)).
plugin_constraint(has_execute_method(_)).
plugin_constraint(has_health_check(_)).

% Example query usage:
% ?- valid_plugin('MyActionPlugin').
% ?- find_violations('MyActionPlugin', Violations).

% Advanced: Multi-file dependency constraints
depends_on_module(Class, Module) :-
    contains_import(Class, Module).

circular_dependency(ClassA, ClassB) :-
    depends_on_module(ClassA, ClassB),
    depends_on_module(ClassB, ClassA).

% Architecture-level constraints
valid_architecture(Files) :-
    forall(member(File, Files), valid_plugin_file(File)),
    \+ exists_circular_dependencies(Files).

exists_circular_dependencies(Files) :-
    member(FileA, Files),
    member(FileB, Files),
    FileA \= FileB,
    circular_dependency(FileA, FileB).

% Token count: ~40 tokens for basic rule vs ~150 for TypeScript equivalent