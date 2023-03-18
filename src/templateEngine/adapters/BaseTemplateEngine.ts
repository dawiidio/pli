import { ITemplateEngine } from '~/templateEngine/ITemplateEngine';
import { VariableScope } from '~/variableScope/VariableScope';
import { assert } from '@dawiidio/tools';
import { ITemplateVariable } from '~/templateVariable/ITemplateVariable';

export class BaseTemplateEngine implements ITemplateEngine {
    static readonly globalVariableRegex = /\$([\w\d]+)\$/g;

    static getRegexpForVariable(name: string): RegExp {
        return new RegExp(`\\$(${name})\\$`, 'g');
    }

    extractAllVariables(text: string): string[] {
        const variables = text.match(BaseTemplateEngine.globalVariableRegex) || [];

        return [...new Set<string>(variables).values()].map(s => s.replaceAll('$', ''));
    }

    replaceVariable(text: string, variable: ITemplateVariable): string {
        const value = variable.getValue();

        assert(value !== undefined, `Variable ${variable.name} has no value to render`);

        return text.replaceAll(BaseTemplateEngine.getRegexpForVariable(variable.name), String(value));
    }

    renderTemplate(text: string, ctx: VariableScope): string {
        return Object.values(ctx.getAllVariables()).reduce(
            (acc, variable) => this.replaceVariable(acc, variable),
            text
        );
    }
}
