import { TemplateVariable } from '~/templateVariable/TemplateVariable';
import { VariableScope } from '~/variableScope/VariableScope';
import { ITemplateEngine } from '~/templateEngine/ITemplateEngine';
import { assert } from '@dawiidio/tools';
import { ITemplate } from '~/template/ITemplate';
import { GlobalBuiltinVariables } from '~/common';
import { ITemplateVariable } from '~/templateVariable/ITemplateVariable';
import { IStorage } from '~/storage/IStorage';
import { IVariableScope } from '~/variableScope/IVariableScope';

export type IBaseTemplateTypes = Template | ITemplateEntry;

export type IOutputType = Record<string, string>;

export interface ITemplateProps {

    templates: IBaseTemplateTypes[] | IBaseTemplateTypes;

    outputDirectory?: string,

    output?: IOutputType;

    variables?: Array<ITemplateVariable>;

    name?: string

    id?: string
}

export interface ITemplateEntry {
    source: string;

    content: string;

    renderedContent?: string;

    variables?: ITemplateVariable[];

    destination?: string;
}

export class Template implements ITemplate {
    #declaredVariables: ITemplateVariable[] = [];

    #stringTemplates: ITemplateEntry[];

    #childTemplates: ITemplate[];

    constructor(
        public readonly props: ITemplateProps,
    ) {
        const templates = Array.isArray(this.props.templates)
            ? [...this.props.templates]
            : [this.props.templates];

        this.#declaredVariables = this.props.variables || [];
        this.#stringTemplates = templates.filter<ITemplateEntry>((t): t is ITemplateEntry => !Template.isTemplate(t));
        this.#childTemplates = templates.filter<Template>((t): t is Template => Template.isTemplate(t));
    }

    get id() {
        return this.props.id;
    }

    get name() {
        return this.props.name;
    }

    static isTemplate(predicate: any): predicate is Template {
        return predicate instanceof Template;
    }

    static createDefaultVariableDescriptor(name: string): ITemplateVariable {
        return new TemplateVariable({
            name,
        });
    }

    collectVariables(templateEngine: ITemplateEngine, storage: IStorage, parent?: VariableScope): VariableScope {
        const ctx = parent ? parent.spawnChildContext() : new VariableScope();
        const cwd = ctx.resolveValue(GlobalBuiltinVariables.CWD);
        const outputDir = this.props.outputDirectory || '';

        const extractedVariables: ITemplateVariable[] = this.#stringTemplates
            .flatMap(entry => {
                const variables = [
                    ...templateEngine.extractAllVariables(entry.content),
                    ...templateEngine.extractAllVariables(this.getPathTemplateToResolve(entry.source)),
                ]
                    .map(variableName => Template.createDefaultVariableDescriptor(variableName));

                entry.variables = variables;

                return variables;
            });

        const mergedVariables = extractedVariables.map((variable) => {
            const match = this.#declaredVariables.find(v => variable.name === v.name);

            if (!match)
                return variable;

            return match.merge(variable);
        });

        ctx.add([
            ...mergedVariables,
            new TemplateVariable({
                name: GlobalBuiltinVariables.CWD,
                defaultValue: storage.join(cwd, outputDir),
                ui: {
                    message: `Output directory`
                },
            }),
        ]);

        this.#childTemplates.forEach(c => c.collectVariables(templateEngine, storage, ctx));

        return ctx;
    }

    async render(templateEngine: ITemplateEngine, storage: IStorage, scopeMapping: Map<ITemplate, IVariableScope>): Promise<IOutputType> {
        const currentScope = scopeMapping.get(this);

        assert(currentScope, `Scope for template ${this.id} not found`);

        const renderedStringTemplates = this.#stringTemplates
            .map(template => ({
                ...template,
                renderedContent: templateEngine.renderTemplate(template.content, currentScope),
            }));

        const resolvedOutput = this.resolveOutputMapping(templateEngine, storage, currentScope);
        const childOutputs = await Promise.all(this.#childTemplates.map(child => child.render(templateEngine, storage, scopeMapping)));
        const mergedChildOutputs = childOutputs.reduce((acc, o) => ({
            ...acc,
            ...o,
        }), {});

        const output = Object.entries(resolvedOutput).reduce((acc, [originalPath, resolvedPath]) => {
            const template = renderedStringTemplates.find(({ source }) => source === originalPath);

            assert(template, `Template for path ${originalPath} not found!`);

            return {
                ...acc,
                [resolvedPath]: template.renderedContent,
            };
        }, {} as IOutputType);

        return {
            ...mergedChildOutputs,
            ...output,
        };
    }

    resolveOutputMapping(templateEngine: ITemplateEngine, storage: IStorage, ctx: IVariableScope): IOutputType {
        return this.#stringTemplates.reduce((acc, { source }) => {
            const cwd = ctx.resolveValue(GlobalBuiltinVariables.CWD);
            const rootCwd = ctx.resolveValue(GlobalBuiltinVariables.ROOT_CWD);
            const td = ctx.resolveValue(GlobalBuiltinVariables.TEMPLATES_DIRECTORY);

            const resolvedVal = templateEngine.renderTemplate(
                storage.join(rootCwd, cwd, this.getPathTemplateToResolve(source).replace(td, '')),
                ctx,
            );

            return {
                ...acc,
                [source]: resolvedVal,
            };
        }, {});
    }

    merge(templateToMergeWith: Template): Template {
        const stringTemplates = this.#stringTemplates.map((t) => {
            const foundTemplate = templateToMergeWith.#stringTemplates.find(({ source }) => source === t.source);

            return {
                ...t,
                ...(foundTemplate || {}),
            };
        });

        const childTemplates = this.#childTemplates.map((t) => {
            const foundChild = templateToMergeWith.#childTemplates.find(({ id }) => id === t.id);

            return foundChild ? t.merge(foundChild) : t;
        });

        const declaredVariables = this.#declaredVariables.map((v) => {
            const foundVariable = templateToMergeWith.#declaredVariables.find(({ name }) => name === v.name);

            return foundVariable ? v.merge(foundVariable) : v;
        });

        const template = new Template({
            templates: [],
            id: templateToMergeWith.id,
            name: templateToMergeWith.name,
            output: {
                ...(this.props.output || {}),
                ...(templateToMergeWith.props.output || {}),
            },
        });

        template.#childTemplates = childTemplates;
        template.#stringTemplates = stringTemplates;
        template.#declaredVariables = declaredVariables;

        return template;
    }

    protected getPathTemplateToResolve(originalPath: string): string {
        const { output } = this.props;
        const outputObject: IOutputType = (output || {}) as IOutputType;

        return outputObject[originalPath] || originalPath;
    }
}
