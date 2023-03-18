import { ITemplateVariable } from '~/templateVariable/ITemplateVariable';
import { IVariableScope } from '~/variableScope/IVariableScope';

export interface ITemplateEngine {
    extractAllVariables(text: string): string[];

    replaceVariable(text: string, variable: ITemplateVariable): string;

    renderTemplate(text: string, ctx: IVariableScope): string;
}
