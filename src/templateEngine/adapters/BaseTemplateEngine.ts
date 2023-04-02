import { ITemplateEngine } from '~/templateEngine/ITemplateEngine';
import { ITemplateEngineContext } from '~/templateEngine/ITemplateEngineContext';

export class BaseTemplateEngine implements ITemplateEngine {
    static readonly globalVariableRegex = /\$([\w\d]+)\$/g;

    static getRegexpForVariable(name: string): RegExp {
        return new RegExp(`\\$(${name})\\$`, 'g');
    }

    getVariableTemplateForName(name: string): string {
        return `$${name}$`;
    }

    extractAllVariables(text: string): string[] {
        const variables = text.match(BaseTemplateEngine.globalVariableRegex) || [];

        return [...new Set<string>(variables).values()].map(s => s.replaceAll('$', ''));
    }

    replaceVariable(text: string, variableName: string, value: any = ''): string {
        return text.replaceAll(BaseTemplateEngine.getRegexpForVariable(variableName), String(value));
    }

    renderTemplate(text: string, ctx: ITemplateEngineContext, throwOnUndefined = false): string {
        return this.extractAllVariables(text).reduce((acc, name) => {
            const value = ctx.getVariableValue(name);

            if (throwOnUndefined && (value === undefined || value === '')) {
                throw new Error(`Variable ${name} is undefined`);
            }

            return this.replaceVariable(acc, name, value);
        }, text);
    }

    hasVariables(template: string): boolean {
        return BaseTemplateEngine.globalVariableRegex.test(template);
    }
}
