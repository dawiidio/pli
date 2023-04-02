import { ITemplateEngine } from '~/templateEngine/ITemplateEngine';
import { IOutputType } from '~/template/Template';
import { IStorage } from '~/storage/IStorage';
import { ITemplateEntry } from '~/templateEntry/ITemplateEntry';
import { IVariableScope } from '~/variableScope/IVariableScope';
import { ITemplateProps } from '~/template/ITemplateProps';

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
