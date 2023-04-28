import { IVariableChangeEvent, IVariableScope } from '~/variableScope/IVariableScope';
import { ITemplateEngine } from '~/templateEngine/ITemplateEngine';
import { PARENT_EVENTS_PREFIX } from '~/common';
import { ITemplateEngineContext } from '~/templateEngine/ITemplateEngineContext';
import { OffListener } from '@dawiidio/tools';
import { ITemplateVariable } from '~/templateVariable/ITemplateVariable';

export class SubscriptionScope implements ITemplateEngineContext {
    private subscribedVariablesNames = new Set<string>();

    private offListeners = new Map<string, OffListener>();

    private variablesValues = new Map<string, any>();

    constructor(
        public variable: ITemplateVariable,
        public scope: IVariableScope,
        private templateEngine: ITemplateEngine,
    ) {
        this.extractVariablesToSubscribe();
        this.initializeLocalValues();
        this.setupSubscribers();
    }

    getVariableValue<T = any>(name: string): T | undefined {
        return this.variablesValues.get(name);
    }

    private extractVariablesToSubscribe() {
        this.subscribedVariablesNames = new Set(this.templateEngine.extractAllVariables(this.variable.defaultValue));
    }

    private setupSubscribers() {
        this.subscribedVariablesNames.forEach((name) => {
            if (this.offListeners.has(name)) {
                this.offListeners.get(name)?.();
                this.offListeners.delete(name);
            }

            let eventName = (!this.scope.hasVariable(name) || this.variable.name === name)
                ? `${PARENT_EVENTS_PREFIX}${name}:change`
                : `${name}:change`;

            const off = this.scope.on(eventName, (evName, { transformedValue }: IVariableChangeEvent) => {
                this.variablesValues.set(name, transformedValue);
                this.updateVariableValueInScope();
            });

            this.offListeners.set(name, off);
        });
    }

    private initializeLocalValues() {
        this.variablesValues = new Map([...this.subscribedVariablesNames.values()].map((name) => ([
            name,
            this.scope.getVariableValue(name),
        ])));
    }

    private updateVariableValueInScope() {
        this.scope.setVariableValue(
            this.variable.name,
            this.templateEngine.renderTemplate(this.variable.defaultValue, this),
        );
    }
}
