import { ICliRenderer } from '~/cliRenderer/ICliRenderer';
import { ITemplate } from '~/template/ITemplate';
import inquirer, { Answers, DistinctQuestion, QuestionCollection } from 'inquirer';
import { ITemplateVariable, IVariableUiDescriptor } from '~/templateVariable/ITemplateVariable';
import { IVariableScope } from '~/variableScope/IVariableScope';
import { TemplateTreeRenderer } from '~/templateTreeRenderer/TemplateTreeRenderer';
import { assert } from '@dawiidio/tools';
import { ITemplateEngine } from '~/templateEngine/ITemplateEngine';
import { getTemplateEngine } from '~/templateEngine/getTemplateEngine';
import { BuiltinVariables } from '~/common';

type Client = typeof inquirer;

interface ITemplateSelection {
    selectedTemplateId: string;
}

const VARIABLE_SORT_INDEX_STEP = 10;
const DEFAULT_VARIABLE_INDEX = 1000;

export class TerminalCliRenderer implements ICliRenderer {
    protected client: Client | undefined = inquirer;

    public selectedTemplate: ITemplate | undefined;

    constructor(protected templateTreeRenderer: TemplateTreeRenderer, protected templateEngine: ITemplateEngine = getTemplateEngine('base')) {}

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

        assert(scope, `No variable scope found for template ${this.selectedTemplate.id}`);

        // todo move it maybe some place closer to the Template, because for sure it can be set earlier than here
        scope.setVariableValue(BuiltinVariables.CWD, this.selectedTemplate.props.defaultOutputDirectoryPath);

        const values = await (this.client as Client).prompt<T>(this.createClientUiForVariableScope(scope));

        scope.assignValuesObjectFromTop(values);

        return values;
    }

    protected createClientUiForVariableScope<T extends Answers = Answers>(ctx: IVariableScope): QuestionCollection<T> {
        this.updateIndexes(ctx);

        return ctx.collectAllBranchVariables()
            .filter((variable) => !variable.ui.hidden)
            .sort((variableA, variableB) => (variableB.ui?.index || DEFAULT_VARIABLE_INDEX) - (variableA.ui?.index || DEFAULT_VARIABLE_INDEX))
            .map<DistinctQuestion<T>>((variable) => this.createClientUiForVariable<T>(variable, ctx));
    }

    protected createClientUiForVariable<T extends Answers = Answers>(variable: ITemplateVariable, ctx: IVariableScope): DistinctQuestion<T> {
        return {
            name: variable.name,
            message: variable.ui.message,
            default: ctx.getVariableValue(variable.name) || variable.defaultValue,
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

    protected updateIndexes(ctx: IVariableScope) {
        // todo move this method to variable scope and remove templateEngine from this class
        // todo variable shouldn't update it's index, it should be context dependent and be kept there - variable is just a config holder
        for (const variable of ctx.collectAllBranchVariables()) {
            const dependencies = variable.getDependencies(this.templateEngine);
            const ui = variable.ui as IVariableUiDescriptor;
            ui.index += dependencies.length * (-VARIABLE_SORT_INDEX_STEP);

            dependencies.forEach((variableName) => {
                try {
                    const variable = ctx.getVariableFromTop(variableName);
                    const ui2 = variable.ui as IVariableUiDescriptor;
                    ui2.index += VARIABLE_SORT_INDEX_STEP;
                }
                catch (e) {
                    throw new Error(`Variable "${variableName}" passed in variable's "${variable.name}" defaultValue doesn't exist in current branch. Original message: ${(e as Error).message}`);
                }
            });
        }
    }
}
