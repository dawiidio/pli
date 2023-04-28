import { TemplateVariable } from '~/templateVariable/TemplateVariable';
import { ITemplateEngine } from '~/templateEngine/ITemplateEngine';
import { assert, mergeArrays } from '@dawiidio/tools';
import { ICollectVariablesResult, ITemplate } from '~/template/ITemplate';
import { BuiltinVariables, checkForVariableDuplicates, removeVariableDuplicates, WithRequired } from '~/common';
import { ITemplateVariable } from '~/templateVariable/ITemplateVariable';
import { IStorage } from '~/storage/IStorage';
import { ITemplateEntry } from '~/templateEntry/ITemplateEntry';
import { TemplateEntry } from '~/templateEntry/TemplateEntry';
import { IVariableScope } from '~/variableScope/IVariableScope';
import { VariableScope } from '~/variableScope/VariableScope';
import { ITemplateProps } from '~/template/ITemplateProps';

export type IBaseTemplateTypes = ITemplate | ITemplateEntry;

export type IOutputType = Record<string, string>;

export class Template implements ITemplate {
    static isTemplate(predicate: any): predicate is Template {
        return predicate instanceof Template;
    }

    static createDefaultVariableDescriptor(name: string): ITemplateVariable {
        return new TemplateVariable({
            name,
        });
    }

    /**
     * template passed from user config can have paths or TemplateEntries
     * without content in props.templates. Because templates require
     *
     * @param template
     * @param storage
     */
    static async fetchTemplateEntriesContent(template: Template, storage: IStorage): Promise<void> {
        await Promise.all(template.templateEntries.map(async (entry) => {
            if (!entry.content && !entry.dynamic) {
                entry.content = await storage.read(entry.source);
            }
        }));

        await Promise.all(template.childTemplates.map((child) =>
            Template.fetchTemplateEntriesContent(child as Template, storage))
        );
    }

    variables: ITemplateVariable[] = [];

    private templateEntries: ITemplateEntry[] = [];

    private childTemplates: ITemplate[] = [];

    constructor(
        public readonly props: ITemplateProps,
    ) {
        let entries: IBaseTemplateTypes[] = [];

        if (this.props.entries) {
            entries = Array.isArray(this.props.entries)
                ? [...this.props.entries]
                : [this.props.entries];
        }

        for (const t of entries) {
            if (Template.isTemplate(t)) {
                this.childTemplates.push(t);
            } else if (TemplateEntry.isTemplateEntry(t)) {
                this.templateEntries.push(t);
            } else {
                throw new Error(`Unsupported value passed in entries field for template "${this.id}"`);
            }
        }

        this.variables = checkForVariableDuplicates(this.props.variables || []);
    }

    get id() {
        return this.props.id;
    }

    get name() {
        return this.props.name;
    }

    getTemplateEntries(): ITemplateEntry[] {
        return this.templateEntries;
    }

    setTemplateEntries(templateEntries: ITemplateEntry[]) {
        this.templateEntries = templateEntries;
    }

    /**
     * Template can be created by user in config, so we don't want them to pass
     * internals like e.g. storage or templateEngine in constructor to keep them
     * in instance, also Template describes static template properties
     * like variables, output structure and content of template files, later
     * instance of template can be run in different contexts with different
     * variable scopes, that's why we need to keep context of template and
     * scope separated and collect variables only in runtime, this gives us
     * more flexibility and allows to compose templates with many contexts
     * without affecting anything
     *
     * @param templateEngine
     * @param storage
     * @param parent
     */
    collectVariables(templateEngine: ITemplateEngine, storage: IStorage, parent?: IVariableScope): ICollectVariablesResult[] {
        const ctx = parent ? parent.spawnChild() : new VariableScope();
        const scopeCwd = this.props.defaultOutputDirectoryPath || ctx.getVariableValue(BuiltinVariables.CWD);

        const extractedVariables: ITemplateVariable[] = removeVariableDuplicates(this.templateEntries
            .flatMap((entry) => {
                if (!entry.content)
                    throw new Error(`Entry ${entry.source} has no content to extract variables from`);

                const stringVariables = new Set([
                    ...templateEngine.extractAllVariables(entry.content),
                    ...templateEngine.extractAllVariables(this.getEntryPathToResolve(entry, ctx, storage)),
                ]);

                const variables = [...stringVariables].map(v => Template.createDefaultVariableDescriptor(v));

                entry.variables = variables;

                return variables;
            }));

        const mergedVariables = mergeArrays<ITemplateVariable>(extractedVariables, this.variables, {
            findIndex: (variable1, variable2) => variable1.name === variable2.name,
            merge: (variable1, variable2) => variable1.merge(variable2),
        });

        ctx.bulkRegisterVariables([
            ...mergedVariables,
            new TemplateVariable({
                name: BuiltinVariables.CWD,
                defaultValue: scopeCwd,
                ui: {
                    message: `Output directory`,
                    index: 1000,
                },
            }),
        ]);

        const children = this.childTemplates.flatMap(t => t.collectVariables(templateEngine, storage, ctx));

        return [
            {
                template: this,
                scope: ctx,
                children
            }
        ];
    }

    /**
     * Render runs at the end of life cycle, when variables are collected,
     * filled with values from cli, and when all content of templates is fetched
     * from storage and ready to be transformed into output files.
     * Render method returns object with output files paths mapped to rendered
     * content, like this:
     *
     * {
     *     'path/to/output/file.ts': 'export class MyRenderedClass {}'
     * }
     *
     * Worth of note is also that since Template doesn't keep information
     * about Variables scope and each template creates its own scope on
     * collecting phase we need to pass to render method mapping of
     * Template -> VariableScope, thanks to this, each nested Template can get
     * its corresponding scope
     *
     * @param templateEngine
     * @param storage
     * @param currentScope
     */
    async render(templateEngine: ITemplateEngine, storage: IStorage, currentScope: IVariableScope): Promise<IOutputType> {
        const renderedEntriesTemplates = this.renderTemplateEntries(templateEngine, currentScope);
        const resolvedOutput = this.resolveOutputMapping(templateEngine, storage, currentScope);

        return Object.entries(resolvedOutput).reduce((acc, [originalPath, resolvedPath]) => {
            const template = renderedEntriesTemplates.find(({ source }) => source === originalPath);

            assert(template, `Template for path ${originalPath} not found!`);

            return {
                ...acc,
                [resolvedPath]: template.renderedContent,
            };
        }, {} as IOutputType);
    }

    /**
     * Allows variable usage in output paths, for example: if template name is
     * $NAME$.ts this method will resolve $NAME$ to it's value
     *
     * @param templateEngine
     * @param storage
     * @param scope
     */
    resolveOutputMapping(templateEngine: ITemplateEngine, storage: IStorage, scope: IVariableScope): IOutputType {
        return this.templateEntries.reduce((acc, entry) => {
            const cwd = scope.getVariableValue(BuiltinVariables.CWD);
            const rootCwd = scope.getVariableValue(BuiltinVariables.ROOT_CWD);
            const td = scope.getVariableValue(BuiltinVariables.TEMPLATES_DIRECTORY);

            const resolvedVal = templateEngine.renderTemplate(
                storage.join(rootCwd, cwd || '', this.getEntryPathToResolve(entry, scope, storage).replace(td, '')),
                scope,
                true,
            );

            return {
                ...acc,
                [entry.source]: resolvedVal,
            };
        }, {});
    }

    clone({ id, entries, name, outputMapping, variables, defaultOutputDirectoryPath }: Partial<ITemplateProps>): ITemplate {
        return new Template({
            id: id || `${this.id}_clone`,
            entries: entries || this.props.entries,
            outputMapping: outputMapping || this.props.outputMapping,
            variables: variables || this.props.variables,
            defaultOutputDirectoryPath: defaultOutputDirectoryPath || this.props.defaultOutputDirectoryPath,
            name: name || `${this.name}_clone`,
        });
    }

    merge(templateToMergeWith: Template): Template {
        if (templateToMergeWith.id !== this.id)
            throw new Error(`You can not merge two templates with different ID's. Current template id: "${this.id}", and template to merge with: "${templateToMergeWith.id}"`);

        const mergedTemplateEntries = mergeArrays<TemplateEntry>(this.templateEntries, templateToMergeWith.templateEntries || [], {
            merge: (entry1, entry2) => entry1.merge(entry2),
            findIndex: (entry1, entry2) => entry1.source === entry2.source,
        });

        const mergedChildTemplates = mergeArrays<ITemplate>(this.childTemplates, templateToMergeWith.childTemplates || [], {
            merge: (entry1, entry2) => entry1.merge(entry2),
            findIndex: (entry1, entry2) => entry1.id === entry2.id,
        });

        const mergedVariables = mergeArrays<ITemplateVariable>(this.variables, templateToMergeWith.variables || [], {
            merge: (entry1, entry2) => entry1.merge(entry2),
            findIndex: (entry1, entry2) => entry1.name === entry2.name,
        });

        return new Template({
            entries: [
                ...mergedChildTemplates,
                ...mergedTemplateEntries
            ],
            id: templateToMergeWith.id || this.id,
            name: templateToMergeWith.name || this.name,
            defaultOutputDirectoryPath: templateToMergeWith.props.defaultOutputDirectoryPath || this.props.defaultOutputDirectoryPath,
            outputMapping: {
                ...(this.props.outputMapping || {}),
                ...(templateToMergeWith.props.outputMapping || {}),
            },
            variables: mergedVariables,
        });
    }

    getChildren(): ITemplate[] {
        return this.childTemplates;
    }

    setChildren(children: ITemplate[]) {
        this.childTemplates = children;
    }

    protected renderTemplateEntries(templateEngine: ITemplateEngine, scope: IVariableScope): WithRequired<ITemplateEntry, 'renderedContent'>[] {
        return this.templateEntries
            .map(entry => entry.merge({
                renderedContent: templateEngine.renderTemplate(entry.content, scope),
            }) as WithRequired<ITemplateEntry, 'renderedContent'>);
    }

    protected getEntryPathToResolve(entry: ITemplateEntry, ctx: IVariableScope, storage: IStorage): string {
        const { outputMapping = {} } = this.props;
        const templatesDirectory = ctx.getVariableValue(BuiltinVariables.TEMPLATES_DIRECTORY);
        const fileFromTemplatesDirectory = entry.source.startsWith(templatesDirectory);

        if (!fileFromTemplatesDirectory && !outputMapping[entry.source] && !entry.dynamic) {
            return storage.basename(entry.source);
        }

        if (fileFromTemplatesDirectory) {
            const relativePath = entry.source.replace(`${templatesDirectory}${storage.sep}`, '');

            return outputMapping[entry.source] || outputMapping[relativePath] || entry.source;
        }

        return outputMapping[entry.source] || entry.source;
    }
}
