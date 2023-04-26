import { describe, expect, it } from 'vitest';
import { Template } from './Template';
import { getTemplateEngine } from '../templateEngine/getTemplateEngine';
import { getStorage } from '../storage/getStorage';
import { createRootScope, DEFAULT_TEMPLATES_DIRNAME, BuiltinVariables } from '../common';
import { TemplateEntry } from '../templateEntry/TemplateEntry';
import { TemplateTreeRenderer } from '../templateTreeRenderer/TemplateTreeRenderer';
import { TemplateVariable } from '../templateVariable/TemplateVariable';
import { IVariableScope } from '../variableScope/IVariableScope';

//todo uncomment
describe('Template', () => {
    const cwd = '';
    const rootCwd = 'test';
    const storage = getStorage('fs');
    const engine = getTemplateEngine('base');
    const rootScopeDefaults = {
        [BuiltinVariables.ROOT_CWD]: rootCwd,
        [BuiltinVariables.TEMPLATES_DIRECTORY]: DEFAULT_TEMPLATES_DIRNAME,
        [BuiltinVariables.CWD]: cwd,
    };

    const getRootScope = () => {
        return createRootScope({
            [BuiltinVariables.ROOT_CWD]: rootCwd,
            [BuiltinVariables.TEMPLATES_DIRECTORY]: DEFAULT_TEMPLATES_DIRNAME,
            [BuiltinVariables.CWD]: cwd,
        });
    };

    it('should extract variables from string template', async () => {
        const template = new Template({
            id: 'template',
            entries: [
                new TemplateEntry({
                    source: '/tmp/path/file.ts',
                    content: `function $NAME$() { return 'Function $NAME$, $OTHER_VARIABLE$'; }`,
                }),
            ],
        });
        const templateTreeRenderer = new TemplateTreeRenderer([template], engine, storage, rootScopeDefaults);
        templateTreeRenderer.collectVariables();
        const scope = templateTreeRenderer.getBranchForTemplateId(template.id);
        const variableValues = scope.scope.collectAllBranchVariablesValues();

        expect(Object.keys(variableValues)).toHaveLength(5);
        expect(variableValues).toEqual(expect.objectContaining({
            NAME: undefined,
            OTHER_VARIABLE: undefined
        }));
    });

    it('should throw error on interpolating paths when variable is undefined', async () => {
        const template = new Template({
            id: 'x',
            entries: [
                new TemplateEntry({
                    source: '/tmp/$NAME$/file.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                }),
            ],
        });
        const templateTreeRenderer = new TemplateTreeRenderer([template], engine, storage, rootScopeDefaults);
        templateTreeRenderer.collectVariables();
        const { scope } = templateTreeRenderer.getBranchForTemplateId(template.id);

        console.log(
            'path without variable',
            template.resolveOutputMapping(engine, storage, scope)
        );

        expect(() => template.resolveOutputMapping(engine, storage, scope)).toThrowError('Variable NAME is undefined');
    });

    it('should throw error when TemplateEntry still has empty content field on collecting variables phase', async () => {
        const template = new Template({
            id: 'x',
            entries: [
                new TemplateEntry({
                    source: '/tmp/$NAME$/file.ts',
                    content: ``,
                }),
            ],
        });
        const engine = getTemplateEngine('base');
        const rootScope = getRootScope();

        expect(() => template.collectVariables(engine, storage, rootScope)).toThrowError('Entry /tmp/$NAME$/file.ts has no content to extract variables from');
    });

    it('should interpolate paths with variables from context', async () => {
        const template = new Template({
            id: 'x',
            entries: [
                new TemplateEntry({
                    source: '/tmp/$NAME$/file.ts',
                    content: `Test test`,
                    dynamic: true,
                }),
            ],
        });
        const templateTreeRenderer = new TemplateTreeRenderer([template], engine, storage, rootScopeDefaults);
        templateTreeRenderer.collectVariables();
        const { scope: rootScope } = templateTreeRenderer.getBranchForTemplateId(template.id);

        const childScope = [...rootScope.children.values()].at(0) as IVariableScope;

        childScope?.setVariableValue('NAME', 'dirname');

        expect(template.resolveOutputMapping(engine, storage, childScope)).toStrictEqual(expect.objectContaining({
            '/tmp/$NAME$/file.ts': `${rootCwd}/tmp/dirname/file.ts`,
        }));
    });

    it('should render template', async () => {
        const template = new Template({
            id: 'x',
            entries: [
                new TemplateEntry({
                    source: '$NAME$.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                }),
            ],
        });
        const templateTreeRenderer = new TemplateTreeRenderer([template], engine, storage, rootScopeDefaults);
        templateTreeRenderer.collectVariables();
        const { scope } = templateTreeRenderer.getBranchForTemplateId(template.id);

        scope.setVariableValueFromTop('NAME', 'MyFunction');

        expect(await templateTreeRenderer.render(template.id)).toStrictEqual(expect.objectContaining({
            [`${rootCwd}/MyFunction.ts`]: `function MyFunction() { return 'Function MyFunction'; }`,
        }));
    });

    it('should render many entries with defaultOutputDirectoryPath set in config', async () => {
        const template = new Template({
            id: 'x',
            entries: [
                new TemplateEntry({
                    source: '$NAME$.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                }),
                new TemplateEntry({
                    source: '$NAME$.spec.ts',
                    content: `test('$NAME$ should do something', () => { expect($NAME$()).toBeString(); })`,
                }),
            ],
            defaultOutputDirectoryPath: 'tmp/$NAME$',
        });
        const templateTreeRenderer = new TemplateTreeRenderer([template], engine, storage, rootScopeDefaults);
        templateTreeRenderer.collectVariables();
        const { scope } = templateTreeRenderer.getBranchForTemplateId(template.id);

        scope.setVariableValueFromTop('NAME', 'MyFunction');

        expect(await templateTreeRenderer.render(template.id)).toStrictEqual(expect.objectContaining({
            [`${rootCwd}/tmp/MyFunction/MyFunction.ts`]: `function MyFunction() { return 'Function MyFunction'; }`,
            [`${rootCwd}/tmp/MyFunction/MyFunction.spec.ts`]: `test('MyFunction should do something', () => { expect(MyFunction()).toBeString(); })`,
        }));
    });

    it('should change output path to the one overwritten in output mapping', async () => {
        const template = new Template({
            id: 'x',
            entries: [
                new TemplateEntry({
                    source: '$NAME$.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                }),
            ],
            outputMapping: {
                '$NAME$.ts': '/tmp/$NEW_VARIABLE$/$NAME$.ts',
            },
        });
        const templateTreeRenderer = new TemplateTreeRenderer([template], engine, storage, rootScopeDefaults);
        templateTreeRenderer.collectVariables();
        const { scope } = templateTreeRenderer.getBranchForTemplateId(template.id);

        scope.setVariableValueFromTop('NAME', 'MyFunction')
        scope.setVariableValueFromTop('NEW_VARIABLE', 'lorem');

        expect(await templateTreeRenderer.render(template.id)).toStrictEqual(expect.objectContaining({
            [`${rootCwd}/tmp/lorem/MyFunction.ts`]: `function MyFunction() { return 'Function MyFunction'; }`,
        }));
    });

    it('should render with child template', async () => {
        const childTemplate = new Template({
            id: 'x',
            entries: [
                new TemplateEntry({
                    source: '$NAME$.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                }),
            ],
            // todo put this example to docs
            outputMapping: {
                '$NAME$.ts': 'tmp/$NAME$/$NAME$.ts',
            }
        });

        const parentTemplate = new Template({
            id: 'y',
            entries: [childTemplate],
        });

        const templateTreeRenderer = new TemplateTreeRenderer([parentTemplate], engine, storage, rootScopeDefaults);
        templateTreeRenderer.collectVariables();
        const { scope } = templateTreeRenderer.getBranchForTemplateId(parentTemplate.id);

        scope.setVariableValueFromTop('NAME', 'MyFunction');

        expect(await templateTreeRenderer.render(parentTemplate.id)).toStrictEqual(expect.objectContaining({
            [`${rootCwd}/tmp/MyFunction/MyFunction.ts`]: `function MyFunction() { return 'Function MyFunction'; }`,
        }));
    });

    it('should merge templates', async () => {
        const T1 = new Template({
            id: 'x',
            name: 'Name 1',
            entries: [
                new TemplateEntry({
                    source: '/tmp/$NAME$/$NAME$.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                }),
                new TemplateEntry({
                    source: '/tmp/dir/file1.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                }),
            ],
            variables: [
                new TemplateVariable({
                    name: 'NAME',
                    defaultValue: 't1 value'
                }),
                new TemplateVariable({
                    name: 'T1_VAR',
                    defaultValue: '1'
                }),
            ]
        });

        const T2 = new Template({
            id: 'x',
            entries: [
                new TemplateEntry({
                    source: '/tmp/$NAME$/$NAME$.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                }),
                new TemplateEntry({
                    source: '/tmp/dir/file2.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                }),
            ],
            variables: [
                new TemplateVariable({
                    name: 'NAME',
                    defaultValue: 't2 value'
                }),
                new TemplateVariable({
                    name: 'T2_VAR',
                    defaultValue: '2'
                }),
            ]
        });

        const merged = T1.merge(T2);

        expect(merged.variables).toHaveLength(3);
        expect(merged.variables.find(v => v.name === 'T2_VAR')?.defaultValue).toBe('2');
        expect(merged.variables.find(v => v.name === 'T1_VAR')?.defaultValue).toBe('1');
        expect(merged.variables.find(v => v.name === 'NAME')?.defaultValue).toBe('t2 value');
        expect(merged.getTemplateEntries()).toHaveLength(3);
        expect(merged.name).toEqual('Name 1');
    });

    it('should collect variables in parent from passed child template', async () => {
        const childTemplate = new Template({
            id: 'x',
            entries: [
                new TemplateEntry({
                    source: '/tmp/$NAME$/$NAME$.ts',
                    content: `function $NAME$() { return 'Function $NAME$'; }`,
                }),
            ],
            outputMapping: {
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
            id: 'y',
            entries: [childTemplate],
        });

        const templateTreeRenderer = new TemplateTreeRenderer([parentTemplate], engine, storage, rootScopeDefaults);
        templateTreeRenderer.collectVariables();

        expect(await templateTreeRenderer.render(parentTemplate.id)).toStrictEqual(expect.objectContaining({
            [`${rootCwd}/tmp/lorem/ipsum.ts`]: `function ipsum() { return 'Function ipsum'; }`,
        }));
    });
});
