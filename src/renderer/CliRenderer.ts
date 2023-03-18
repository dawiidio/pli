import { IVariableScope } from '~/variableScope/IVariableScope';
import { IRenderer } from '~/renderer/IRenderer';
import { ITemplate } from '~/template/ITemplate';
import { assert } from '@dawiidio/tools';
import inquirer, { Answers, DistinctQuestion, QuestionCollection } from 'inquirer';
import { ITemplateVariable } from '~/templateVariable/ITemplateVariable';

type Client = typeof inquirer;

interface ITemplateSelection {
    selectedTemplateId: string;
}

export class CliRenderer implements IRenderer {
    protected client: Client | undefined = inquirer;
    protected templateIdToTemplateMapping = new Map<string, ITemplate>();

    constructor(protected templateToScopeMapping: Map<ITemplate, IVariableScope>) {
        this.templateIdToTemplateMapping = new Map([...templateToScopeMapping.keys()].map(template => ([
            template.id as string,
            template,
        ])));
    }

    async runTemplateSelectionUi(): Promise<ITemplate> {
        const {
            selectedTemplateId,
        } = await (this.client as Client).prompt<ITemplateSelection>(this.getTemplateSelectionFields());

        const selectedTemplate = this.templateIdToTemplateMapping.get(selectedTemplateId);

        assert(selectedTemplate, `No template found for id ${selectedTemplateId}`);

        return selectedTemplate;
    }

    async runVariablesUi<T extends Record<string, any> = Record<string, any>>(selectedTemplate: ITemplate): Promise<T> {
        const scope = this.templateToScopeMapping.get(selectedTemplate);

        assert(scope, `No variable scope found for template ${selectedTemplate.name}`);

        const values = await (this.client as Client).prompt<T>(this.createClientUiForVariableScope(scope));

        Object.entries(values).forEach(([variableName, value]) => {
            scope.getVariableByName(variableName).setValue(value);
        });

        return values;
    }

    protected createClientUiForVariableScope<T extends Answers = Answers>(ctx: IVariableScope): QuestionCollection<T> {
        const variables = ctx.getAllVariables();
        const variablesArr = Object.values(variables);

        return variablesArr
            .filter((variable) => !variable.ui.hidden)
            .map<DistinctQuestion<T>>((variable) => this.createClientUiForVariable<T>(variable, ctx));
    }

    protected createClientUiForVariable<T extends Answers = Answers>(variable: ITemplateVariable, ctx: IVariableScope): DistinctQuestion<T> {
        return {
            name: variable.name,
            message: variable.ui.message,
            default: variable.defaultValue,
            type: variable.ui.type,
            choices: variable.options,
            validate: (input) => {
                try {
                    variable.validate(input, variable, ctx);
                    variable.setValue(input);
                    return true;
                } catch (e) {
                    return e;
                }
            },
        } as DistinctQuestion<T>;
    }

    protected getTemplateSelectionFields<T extends Answers = Answers>(): QuestionCollection<T> {
        const choices = [...this.templateToScopeMapping.keys()].map(({ id, name }) => ({
            value: id,
            name: name || id
        }));

        return [
            {
                name: 'selectedTemplateId',
                message: 'Select template',
                type: 'list',
                choices,
            },
        ];
    }
}
