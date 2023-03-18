import { describe, expect, it } from 'vitest';
import { VariableScope } from './VariableScope';
import { TemplateVariable } from '../templateVariable/TemplateVariable';

describe('VariableScope', () => {
    it('should throw error on attempt to resolve unset variable', async () => {
        const vs = new VariableScope();

        expect(() => vs.resolveValue('test')).toThrowError('Unknown variable test');
    });

    it('should resolve variable value to undefined', async () => {
        const scope = new VariableScope();
        const variable = new TemplateVariable<number>({
            name: 'foo',
        });

        scope.add(variable);

        expect(scope.resolveValue('foo')).toBeUndefined();
    });

    it('should resolve default value for variable', async () => {
        const scope = new VariableScope();
        const variable = new TemplateVariable<number>({
            name: 'foo',
            defaultValue: 42,
        });

        scope.add(variable);

        expect(scope.resolveValue('foo')).toBe(42);
    });

    it('should resolve variable to new value', async () => {
        const scope = new VariableScope();
        const variable = new TemplateVariable<number>({
            name: 'foo',
            defaultValue: 42,
        });

        scope.add(variable);

        variable.setValue(24);

        expect(scope.resolveValue('foo')).toBe(24);
    });

    it('should resolve variable to the one set in parent scope', async () => {
        const parentScope = new VariableScope();
        const childScope = parentScope.spawnChildContext();
        const variable = new TemplateVariable<number>({
            name: 'foo',
            defaultValue: 42,
        });

        parentScope.add(variable);

        expect(childScope.resolveValue('foo')).toBe(42);
    });

    it('should NOT resolve variable to the one in parent scope if same variable was declared in nearer scope', async () => {
        const parentScope = new VariableScope();
        const childScope = parentScope.spawnChildContext();
        const childVariable = new TemplateVariable<number>({
            name: 'foo',
            defaultValue: 88,
        });
        const parentVariable = new TemplateVariable<number>({
            name: 'foo',
            defaultValue: 42,
        });

        parentScope.add(parentVariable);
        childScope.add(childVariable);

        expect(childScope.resolveValue('foo')).toBe(88);
    });
});
