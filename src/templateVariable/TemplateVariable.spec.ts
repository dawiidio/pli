import { describe, expect, it } from 'vitest';
import { TemplateVariable } from './TemplateVariable';

describe('Variable', () => {
    it('should transform value in pipe to valid type and resolve variable with the same value and type', async () => {
        const variable = new TemplateVariable<string>({
            name: 'foo',
        });

        variable.pipe((val: string) => parseFloat(val));

        variable.setValue('24.53');

        expect(variable.getValue()).toBe(24.53);
    });
});
