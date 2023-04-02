import { ICliRenderer } from '~/cliRenderer/ICliRenderer';
import { ITemplate } from '~/template/ITemplate';
import inquirer, { Answers, DistinctQuestion, QuestionCollection } from 'inquirer';
import { ITemplateVariable } from '~/templateVariable/ITemplateVariable';
import { IVariableScope } from '~/variableScope/IVariableScope';
import { TemplateTreeRenderer } from '~/templateTreeRenderer/TemplateTreeRenderer';
import { assert } from '@dawiidio/tools';

type Client = typeof inquirer;

interface ITemplateSelection {
    selectedTemplateId: string;
}

export class TerminalCliRenderer implements ICliRenderer {
    protected client: Client | undefined = inquirer;

    public selectedTemplate: ITemplate | undefined;

    constructor(protected templateTreeRenderer: TemplateTreeRenderer) {}

    async runTemplateSelectionUi(): Promise<ITemplate> {
        const {
            selectedTemplateId,
        } = await (this.client as Client).prompt<ITemplateSelection>(this.getTemplateSelectionFields([...this.templateTreeRenderer.templates.values()]));

        const selectedTemplate = this.templateTreeRenderer.templates.find(({ id }) => id === selectedTemplateId);

        assert(selectedTemplate, `No template found for id ${selectedTemplateId}`);

        this.selectedTemplate = selectedTemplate;

        return selectedTemplate;
    }

    async runVariablesUiForSelectedTemplate<T extends Record<string, any> = Record<string, any>>(): Promise<T> {
        assert(this.selectedTemplate, `No template selected`);

        const { scope } = this.templateTreeRenderer.getBranchForTemplateId(this.selectedTemplate.id as string);

        assert(scope, `No variable scope found for template ${this.selectedTemplate.name}`);

        const values = await (this.client as Client).prompt<T>(this.createClientUiForVariableScope(scope));

        scope.assignValuesObjectFromTop(values);

        return values;
    }

    protected createClientUiForVariableScope<T extends Answers = Answers>(ctx: IVariableScope): QuestionCollection<T> {
        return ctx.collectAllBranchVariables()
            .filter((variable) => !variable.ui.hidden)
            .sort((variableA, variableB) => {
                //todo check sorting
                return variableA.index - variableB.index;
            })
            .map<DistinctQuestion<T>>((variable) => this.createClientUiForVariable<T>(variable, ctx));
    }

    protected createClientUiForVariable<T extends Answers = Answers>(variable: ITemplateVariable, ctx: IVariableScope): DistinctQuestion<T> {
        return {
            name: variable.name,
            message: variable.ui.message,
            default: variable.defaultValue,
            type: variable.ui.type,
            choices: variable.ui.options,
            validate: (input) => {
                try {
                    variable.validate(input, variable, ctx);
                    return true;
                } catch (e) {
                    return e;
                }
            },
        } as DistinctQuestion<T>;
    }

    protected getTemplateSelectionFields<T extends Answers = Answers>(templates: ITemplate[]): QuestionCollection<T> {
        const choices = templates.map(({ id, name }) => ({
            value: id,
            name: name || id,
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

    protected updateIndexes() {
        // todo add automatic variable index updating by checking if it subscribes from another variable
    }
}
