import { describe, expect, it } from 'vitest';
import { TemplateVariable } from './TemplateVariable.js';

describe('TemplateVariable', () => {
    it('should transform value in pipe to valid type and resolve variable with the same value and type', async () => {
        const variable = new TemplateVariable<string>({
            name: 'foo',
        });

        variable.pipe((val: string) => parseFloat(val));

        const value = variable.transformValue('24.53');

        expect(value).toBe(24.53);
    });
});
