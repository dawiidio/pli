import { describe, expect, it } from 'vitest';
import { Template } from './Template';
import { TemplateVariable } from '../templateVariable/TemplateVariable';
import { getTemplateEngine } from '../templateEngine/getTemplateEngine';


describe('Template', () => {
    it('should extract variables from string template', async () => {
        const template = new Template({
            templates: [
                {
                    source: '/tmp/path/file.ts',
                    content: `function $NAME$() { return 'Function $NAME$, $OTHER_VARIABLE$'; }`,
                },
            ],
        });
        const engine = getTemplateEngine('base');
        const ctx = template.collectVariables(engine);

        const variables = ctx.getAllVariables();

        expect(Object.keys(variables)).toHaveLength(2);
        expect(variables.NAME).not.toBeUndefined();
        expect(variables.OTHER_VARIABLE).not.toBeUndefined();
    });

    it('should throw error on interpolating paths when variable is undefined', async () => {
        const template = new Template({
            templates: [
                {
                    source: '/tmp/$NAME$/file.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                },
            ],
        });
        const engine = getTemplateEngine('base');
        const ctx = template.collectVariables(engine);

        expect(() => template.resolveOutputMapping(engine, ctx)).toThrowError('Variable NAME has no value to render');
    });

    it('should interpolate paths with variables from context', async () => {
        const template = new Template({
            templates: [
                {
                    source: '/tmp/$NAME$/file.ts',
                    content: ``,
                },
            ],
        });
        const engine = getTemplateEngine('base');
        const ctx = template.collectVariables(engine);

        ctx.getVariableByName('NAME').setValue('dirname');

        expect(template.resolveOutputMapping(engine, ctx)).toStrictEqual(expect.objectContaining({
            '/tmp/$NAME$/file.ts': '/tmp/dirname/file.ts',
        }));

    });

    it('should render template', async () => {
        const template = new Template({
            templates: [
                {
                    source: '/tmp/$NAME$/$NAME$.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                },
            ],
        });
        const engine = getTemplateEngine('base');
        const ctx = template.collectVariables(engine);

        ctx.getVariableByName('NAME').setValue('MyFunction');

        expect(await template.render(engine, ctx)).toStrictEqual(expect.objectContaining({
            '/tmp/MyFunction/MyFunction.ts': `function MyFunction() { return 'Function MyFunction'; }`,
        }));
    });

    it('should render many string templates', async () => {
        const template = new Template({
            templates: [
                {
                    source: '/tmp/$NAME$/$NAME$.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                },
                {
                    source: '/tmp/$NAME$/$NAME$.spec.ts',
                    content: `test('$NAME$ should do something', () => { expect($NAME$()).toBeString(); })`,
                },
            ],
        });
        const engine = getTemplateEngine('base');
        const ctx = template.collectVariables(engine);

        ctx.getVariableByName('NAME').setValue('MyFunction');

        expect(await template.render(engine, ctx)).toStrictEqual(expect.objectContaining({
            '/tmp/MyFunction/MyFunction.ts': `function MyFunction() { return 'Function MyFunction'; }`,
            '/tmp/MyFunction/MyFunction.spec.ts': `test('MyFunction should do something', () => { expect(MyFunction()).toBeString(); })`,
        }));
    });

    it('should change output path to the one overwritten in output mapping', async () => {
        const template = new Template({
            templates: [
                {
                    source: '/tmp/$NAME$/$NAME$.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                },
            ],
            output: {
                '/tmp/$NAME$/$NAME$.ts': '/tmp/$NEW_VARIABLE$/$NAME$.ts',
            },
        });
        const engine = getTemplateEngine('base');
        const ctx = template.collectVariables(engine);

        ctx.getVariableByName('NAME').setValue('MyFunction');
        ctx.getVariableByName('NEW_VARIABLE').setValue('lorem');

        expect(await template.render(engine, ctx)).toStrictEqual(expect.objectContaining({
            '/tmp/lorem/MyFunction.ts': `function MyFunction() { return 'Function MyFunction'; }`,
        }));
    });

    it('should render with child template', async () => {
        const childTemplate = new Template({
            templates: [
                {
                    source: '/tmp/$NAME$/$NAME$.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                },
            ],
            output: {
                '/tmp/$NAME$/$NAME$.ts': '/tmp/$NEW_VARIABLE$/$NAME$.ts',
            },
        });

        const parentTemplate = new Template({
            templates: [childTemplate],
        });

        const engine = getTemplateEngine('base');
        const ctx = parentTemplate.collectVariables(engine);

        ctx.getGlobalVariableByName('NAME').setValue('MyFunction');
        ctx.getGlobalVariableByName('NEW_VARIABLE').setValue('lorem');

        expect(await parentTemplate.render(engine, ctx)).toStrictEqual(expect.objectContaining({
            '/tmp/lorem/MyFunction.ts': `function MyFunction() { return 'Function MyFunction'; }`,
        }));
    });

    it('should get variables passed in template "variables" prop field', async () => {
        const childTemplate = new Template({
            templates: [
                {
                    source: '/tmp/$NAME$/$NAME$.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                },
            ],
            output: {
                '/tmp/$NAME$/$NAME$.ts': '/tmp/$NEW_VARIABLE$/$NAME$.ts',
            },
            variables: [
                new TemplateVariable({
                    name: 'NAME',
                    defaultValue: 'ipsum'
                }),
                new TemplateVariable({
                    name: 'NEW_VARIABLE',
                    defaultValue: 'lorem'
                }),
            ]
        });

        const parentTemplate = new Template({
            templates: [childTemplate],
        });

        const engine = getTemplateEngine('base');
        const ctx = parentTemplate.collectVariables(engine);

        expect(await parentTemplate.render(engine, ctx)).toStrictEqual(expect.objectContaining({
            '/tmp/lorem/ipsum.ts': `function ipsum() { return 'Function ipsum'; }`,
        }));
    });
});
