import { IVariableScope } from '~/variableScope/IVariableScope';
import { assert } from '@dawiidio/tools';
import { ITemplateVariable } from '~/templateVariable/ITemplateVariable';

export class VariableScope implements IVariableScope {
    protected variablesMap = new Map<string, ITemplateVariable>();
    protected children = new Set<VariableScope>();

    constructor(
        protected parent?: VariableScope,
    ) {
    }

    get variables(): ITemplateVariable[] {
        return [...this.variablesMap.values()];
    }

    add(variable: ITemplateVariable | ITemplateVariable[]) {
        const variables = Array.isArray(variable) ? variable : [variable];

        variables.forEach(v => {
            let match: ITemplateVariable | undefined = undefined;

            try {
                match = this.resolveVariable(v.name);
            } catch {
            }

            if (match && !match.overridable)
                throw new Error(`Variable ${v.name} was set as non overridable, so you can't overwrite it in lower scopes`);

            this.variablesMap.set(v.name, v);
        });
    }

    remove(variable: ITemplateVariable) {
        this.variablesMap.delete(variable.name);
    }

    getVariableByName(name: string): ITemplateVariable {
        const variable = this.variablesMap.get(name);

        assert(variable, `Variable ${name} not found`);

        return variable;
    }

    getGlobalVariableByName(name: string): ITemplateVariable {
        const variable = this.getAllVariables()[name];

        assert(variable, `Variable ${name} not found`);

        return variable;
    }

    resolveValue<T = any>(name: string): T {
        const variable = this.variablesMap.get(name);
        const value = variable?.getValue();

        if (!variable) {
            if (!this.parent)
                throw new Error(`Unknown variable ${name}`);

            return this.parent.resolveValue(name);
        }

        if (value === undefined && this.parent) {
            return this.parent.resolveValue(name);
        }

        return value;
    }

    resolveVariable(name: string): ITemplateVariable {
        const variable = this.variablesMap.get(name);

        if (!variable) {
            if (!this.parent)
                throw new Error(`Unknown variable ${name}`);

            return this.parent.resolveVariable(name);
        }

        return variable;
    }

    validate() {
        //todo
    }

    spawnChildContext(): VariableScope {
        const ctx = new VariableScope(this);

        this.children.add(ctx);

        return ctx;
    }

    destroyChildContexts(): void {
        this.children.forEach(c => c.destroy());
        this.children = new Set();
    }

    destroy() {
        this.destroyChildContexts();
        this.variablesMap = new Map();
        this.parent?.children?.delete(this);
    }

    getAllVariables(): Record<string, ITemplateVariable> {
        const entries = this.variablesMap.entries();

        const childVariables = [...this.children.values()].reduce((acc, scope) => ({
            ...acc,
            ...scope.getAllVariables(),
        }), {} as Record<string, ITemplateVariable>);

        return {
            ...childVariables,
            ...Object.fromEntries([...entries]),
        };
    }

    setValuesFromObject(valuesMap: Record<string, any>): void {
        Object.entries(valuesMap).forEach(([name, value]) => {
            this.getVariableByName(name).setValue(value);
        });
    }
}
