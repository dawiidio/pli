import { ITemplate } from '~/template/ITemplate';
import { ITemplateEngine } from '~/templateEngine/ITemplateEngine';
import { IVariableScope } from '~/variableScope/IVariableScope';
import { IStorage } from '~/storage/IStorage';

export const createVariableScopesForTemplates = async (templates: ITemplate[], templateEngine: ITemplateEngine, storage: IStorage, rootScope?: IVariableScope) => {
    const mappingEntries = await Promise.all(templates.map(async (template): Promise<[ITemplate, IVariableScope]> => {
        const ctx = template.collectVariables(templateEngine, storage, rootScope);
        return [template, ctx];
    }));

    return new Map<ITemplate, IVariableScope>(mappingEntries);
};
