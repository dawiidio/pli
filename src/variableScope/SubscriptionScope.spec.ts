import { describe, expect, it } from 'vitest';
import { VariableScope } from './VariableScope';
import { TemplateVariable } from '../templateVariable/TemplateVariable';

describe('SubscriptionScope', () => {
    it('should subscribe to values', async () => {
        // given
        const parentScope = new VariableScope();
        const childScope = parentScope.spawnChild();
        const variable1 = new TemplateVariable({
            name: 'VAR1',
            defaultValue: '$VAR2$ $VAR3$',
        });
        const variable2 = new TemplateVariable({
            name: 'VAR2',
            defaultValue: '12',
        });
        const variable3 = new TemplateVariable({
            name: 'VAR3',
            defaultValue: '88',
        });

        // when
        parentScope.bulkRegisterVariables([variable3]);
        childScope.bulkRegisterVariables([variable1, variable2]);
        childScope.setVariableValue('VAR2', '67');

        // then
        expect(childScope.getVariableValue('VAR1')).toBe('67 88');
    });
});
