import { describe, expect, it } from 'vitest';
import { VariableScope } from './VariableScope';
import { TemplateVariable } from '../templateVariable/TemplateVariable';

describe('VariableScope', () => {
    it('should register variable', async () => {
        const scope = new VariableScope();
        const variable = new TemplateVariable({
            name: 'TEST'
        })

        scope.registerVariable(variable);

        expect(scope.hasVariable('TEST')).toBeTruthy();
    });

    it('should throw on attempt to register existing variable', async () => {
        const scope = new VariableScope();
        const variable = new TemplateVariable({
            name: 'TEST'
        })

        scope.registerVariable(variable);

        expect(() => scope.registerVariable(variable)).toThrow();
    });

    it('should set value to variable', async () => {
        const scope = new VariableScope();
        const variable = new TemplateVariable({
            name: 'TEST'
        })

        scope.registerVariable(variable);
        scope.setVariableValue('TEST', 'My value')

        expect(scope.getVariableValue('TEST')).toBe('My value');
    });

    it('should set value to variable and run transformers on it', async () => {
        const scope = new VariableScope();
        const variable = new TemplateVariable({
            name: 'TEST',
        });

        variable.pipe(
            (value: string) => parseInt(value),
            (value: number) => value*2
        )

        scope.registerVariable(variable);
        scope.setVariableValue('TEST', '22')

        expect(scope.getVariableValue('TEST')).toBe(44);
    });

    it('should run validate function on variable and throw error on attempt to set wrong value', async () => {
        const scope = new VariableScope();
        const variable = new TemplateVariable({
            name: 'TEST',
            validate: (value, variable, ctx) => {
                if (!Number.isSafeInteger(variable.transformValue(value)))
                    throw new Error(`Invalid value "${value}" for variable ${variable.name}`);
            }
        })

        variable.pipe(
            (value: string) => parseInt(value),
            (value: number) => value*2
        )

        scope.registerVariable(variable);

        expect(() => scope.setVariableValue('TEST', 'wrong value')).toThrowError('Invalid value "wrong value" for variable TEST');
    });

    it('should register listeners for variable which has other valid variable name as defaultValue, and other variable is in the same scope', async () => {
        const scope = new VariableScope();
        const variable1 = new TemplateVariable({
            name: 'VAR1',
        });
        const variable2 = new TemplateVariable({
            name: 'VAR2',
            defaultValue: '$VAR1$',
        });

        scope.registerVariable(variable1);
        scope.registerVariable(variable2);
        scope.setVariableValue('VAR1', 'new value');

        expect(scope.getVariableValue('VAR2')).toBe('new value');
    });

    it('should throw error when detects attempt to circular variable subscription in the same scope', async () => {
        const scope = new VariableScope();
        const variable1 = new TemplateVariable({
            name: 'VAR1',
            defaultValue: '$VAR1$'
        });

        expect(() => {
            scope.registerVariable(variable1);
        }).toThrowError('Circular reference detected in subscription from default value interpolation for variable: "VAR1"');
    });

    it('should extract and register listeners for variable which has other valid variable name as defaultValue, and the other variable is in the higher scope', async () => {
        const parentScope = new VariableScope();
        const childScope = parentScope.spawnChild();

        const variable1 = new TemplateVariable({
            name: 'VAR1',
        });
        const variable2 = new TemplateVariable({
            name: 'VAR2',
            defaultValue: '$VAR1$',
        });

        parentScope.registerVariable(variable1);
        childScope.registerVariable(variable2);

        parentScope.setVariableValue('VAR1', 'new value');

        expect(childScope.getVariableValue('VAR2')).toBe('new value');
    });

    it.todo('should extract and register listeners for variable which has other valid variable name as defaultValue, and the other variable is in the same scope', async () => {
        const parentScope = new VariableScope();
        const childScope = parentScope.spawnChild();

        const variable1 = new TemplateVariable({
            name: 'VAR1',
        });
        const variable2 = new TemplateVariable({
            name: 'VAR2',
            defaultValue: '$VAR1$',
        });

        parentScope.registerVariable(variable1);
        childScope.registerVariable(variable2);

        parentScope.setVariableValue('VAR1', 'new value');

        expect(childScope.getVariableValue('VAR2')).toBe('new value');
    });

    it('should extract and register listeners for variable which has other valid variable names as defaultValue, and defaultValue has more sophisticated pattern than only variable names', async () => {
        const parentScope = new VariableScope();
        const childScope = parentScope.spawnChild();

        const variable1 = new TemplateVariable({
            name: 'VAR1',
        });
        const variable2 = new TemplateVariable({
            name: 'VAR2',
        });
        const variable3 = new TemplateVariable({
            name: 'VAR3',
            defaultValue: '($VAR1$)[$VAR2$]',
        });

        parentScope.registerVariable(variable1);
        childScope.registerVariable(variable2);
        childScope.registerVariable(variable3);

        parentScope.setVariableValue('VAR1', '22');
        childScope.setVariableValue('VAR2', '41');

        //fixme: this test is not working
        expect(childScope.getVariableValue('VAR3')).toBe('(22)[41]');
    });

    it('should resolve value if some variable is available in higher scope', async () => {
        const parentScope = new VariableScope();
        const childScope = parentScope.spawnChild();

        const variable1 = new TemplateVariable({
            name: 'VAR1',
            defaultValue: 12
        });

        parentScope.registerVariable(variable1);

        expect(childScope.getVariableValue('VAR1')).toBe(12);
    });

    it('should set value to the first variable found in higher scopes', async () => {
        const parentScope = new VariableScope();
        const childScope = parentScope.spawnChild();

        const variable1 = new TemplateVariable({
            name: 'VAR1',
            defaultValue: 12
        });

        parentScope.registerVariable(variable1);

        childScope.setVariableValue('VAR1', 88);

        expect(childScope.getVariableValue('VAR1')).toBe(88);
    });

    it('should collect all variables from scope and child scopes', async () => {
        const parentScope = new VariableScope();
        const childScope1 = parentScope.spawnChild();
        const childScope2 = childScope1.spawnChild();

        const variable1 = new TemplateVariable({
            name: 'VAR1',
            defaultValue: 1
        });
        const variable2 = new TemplateVariable({
            name: 'VAR2',
            defaultValue: 2
        });
        const variable2_1 = new TemplateVariable({
            name: 'VAR2',
            defaultValue: 8
        });
        const variable3 = new TemplateVariable({
            name: 'VAR3',
            defaultValue: 3
        });

        parentScope.registerVariable(variable1);
        childScope1.registerVariable(variable2);
        childScope2.registerVariable(variable3);
        childScope2.registerVariable(variable2_1);

        expect(childScope1.collectAllBranchVariablesValues()).toEqual(expect.objectContaining({
            'VAR2': 2,
            'VAR3': 3,
        }));
    });

    it('should set value to the first variable found in the lower scopes', async () => {
        const parentScope = new VariableScope();
        const childScope = parentScope.spawnChild();

        const variable1 = new TemplateVariable({
            name: 'VAR1',
            defaultValue: 12
        });

        childScope.registerVariable(variable1);

        parentScope.setVariableValueFromTop('VAR1', 88);

        expect(childScope.getVariableValue('VAR1')).toBe(88);
    });

    it('should find all scopes with variable starting from top', async () => {
        const parentScope = new VariableScope();
        const childScope1 = parentScope.spawnChild();
        const childScope1_1 = childScope1.spawnChild();
        const childScope1_2 = childScope1.spawnChild();
        const childScope2 = parentScope.spawnChild();

        const variable1 = new TemplateVariable({
            name: 'VAR1',
            defaultValue: 12
        });

        childScope2.registerVariable(variable1);
        childScope1_2.registerVariable(variable1);

        const matches = parentScope.findFirstScopesFromTopWithVariable('VAR1');

        expect(matches?.length).toBe(2);
        expect(matches).toEqual(expect.arrayContaining([
            childScope2,
            childScope1_2
        ]))
    });

    it('should find first scope with variable starting from bottom', async () => {
        const rootScope = new VariableScope();
        const childScope1 = rootScope.spawnChild();
        const childScope1_1 = childScope1.spawnChild();
        childScope1.spawnChild();
        rootScope.spawnChild();

        const variable1 = new TemplateVariable({
            name: 'VAR1',
            defaultValue: 12
        });

        rootScope.registerVariable(variable1);

        childScope1_1.findFirstScopeFromBottomWithVariable('VAR1');
        const match = rootScope.findFirstScopeFromBottomWithVariable('VAR1');

        expect(match).not.toBeUndefined();
        expect(match === rootScope).toBeTruthy();
    });

    it('should get variable by name', async () => {
        const scope = new VariableScope();
        const variable1 = new TemplateVariable({
            name: 'VAR1',
            defaultValue: 12
        });
        const variable2 = new TemplateVariable({
            name: 'VAR2',
            defaultValue: 12
        });

        scope.registerVariable(variable1);
        scope.registerVariable(variable2);

        expect(scope.getVariable('VAR1')).toBe(variable1);
        expect(scope.getVariable('VAR2')).toBe(variable2);
    });

    it('should add child scope', async () => {
        const scope = new VariableScope();
        const childScope = new VariableScope();
        const variable1 = new TemplateVariable({
            name: 'VAR1',
            defaultValue: 12
        });

        childScope.registerVariable(variable1);
        scope.addChild(childScope);

        const obj = scope.collectAllBranchVariablesValues();

        expect(obj.hasOwnProperty('VAR1')).toBeTruthy();
    });

    it('should assign values object starting from top', async () => {
        const scope = new VariableScope();
        const childScope = new VariableScope();
        const variable1 = new TemplateVariable({
            name: 'VAR1',
            defaultValue: 12
        });

        childScope.registerVariable(variable1);
        scope.addChild(childScope);

        scope.assignValuesObjectFromTop({
            VAR1: 88
        });

        const obj = scope.collectAllBranchVariablesValues();

        expect(obj.VAR1).toBe(88);
    });

    it('should find variable starting from root node', async () => {
        const scope = new VariableScope();
        const childScope1 = scope.spawnChild();
        const childScope2 = childScope1.spawnChild();
        const variable1 = new TemplateVariable({
            name: 'VAR1',
            defaultValue: 12
        });

        childScope2.registerVariable(variable1);

        expect(scope.getVariableFromTop('VAR1')).toBe(variable1);
    });

    it('should should resolve value from parent', async () => {
        const rootScope = new VariableScope();
        const childScope1 = rootScope.spawnChild();
        const childScope2 = childScope1.spawnChild();
        const variable1 = new TemplateVariable({
            name: 'VAR1',
            defaultValue: 'test'
        });
        const variable2 = new TemplateVariable({
            name: 'VAR1',
            defaultValue: undefined
        });

        rootScope.registerVariable(variable1);
        childScope2.registerVariable(variable2);

        expect(childScope2.getVariableValue('VAR1')).toBe('test');
    });

    it('should throw error on attempt to add scope it\'s parent', async () => {
        const scope = new VariableScope();

        expect(() => scope.addChild(scope)).toThrowError();
    });
});
