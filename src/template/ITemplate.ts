import { ITemplateEngine } from '~/templateEngine/ITemplateEngine';
import { IOutputType } from '~/template/Template';
import { IVariableScope } from '~/variableScope/IVariableScope';
import { IStorage } from '~/storage/IStorage';

export interface ITemplate {
    id: string | undefined;

    name: string | undefined;

    collectVariables(templateEngine: ITemplateEngine, storage: IStorage, parent?: IVariableScope): IVariableScope;

    render(templateEngine: ITemplateEngine, storage: IStorage, scopeMapping: Map<ITemplate, IVariableScope>): Promise<IOutputType>;

    resolveOutputMapping(templateEngine: ITemplateEngine, storage: IStorage, ctx: IVariableScope): IOutputType;

    merge(templateToMergeWith: ITemplate): ITemplate;
}
