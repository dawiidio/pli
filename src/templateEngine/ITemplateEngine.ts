import { ITemplateEngineContext } from '~/templateEngine/ITemplateEngineContext.js';

export interface ITemplateEngine {
    extractAllVariables(text: string): string[];

    replaceVariable(text: string, variableName: string, value: any): string;

    renderTemplate(text: string, ctx: ITemplateEngineContext, throwOnUndefined?: boolean): string;

    getVariableTemplateForName(name: string): string;

    hasVariables(template: string): boolean;
}
