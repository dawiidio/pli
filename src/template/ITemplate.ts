import { ITemplateEngine } from '~/templateEngine/ITemplateEngine.js';
import { IOutputType } from '~/template/Template.js';
import { IStorage } from '~/storage/IStorage.js';
import { ITemplateEntry } from '~/templateEntry/ITemplateEntry.js';
import { IVariableScope } from '~/variableScope/IVariableScope.js';
import { ITemplateProps } from '~/template/ITemplateProps.js';

export interface ICollectVariablesResult {
    template: ITemplate;

    scope: IVariableScope;

    children: ICollectVariablesResult[];
}

export interface ITemplate {
    readonly id: string | undefined;

    readonly name: string | undefined;

    readonly props: ITemplateProps;

    collectVariables(templateEngine: ITemplateEngine, storage: IStorage, parent?: IVariableScope): ICollectVariablesResult[];

    render(templateEngine: ITemplateEngine, storage: IStorage, currentScope: IVariableScope): Promise<IOutputType>;

    resolveOutputMapping(templateEngine: ITemplateEngine, storage: IStorage, ctx: IVariableScope): IOutputType;

    merge(templateToMergeWith: ITemplate): ITemplate;

    clone(overrides: Partial<ITemplateProps>): ITemplate;

    getTemplateEntries(): ITemplateEntry[];

    setTemplateEntries(templateEntries: ITemplateEntry[]): void;

    getChildren(): ITemplate[];

    setChildren(children: ITemplate[]): void;
}
