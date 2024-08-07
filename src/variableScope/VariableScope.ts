import { assert, copyObjectWithin, EventEmitter } from '@dawiidio/tools';
import { getTemplateEngine } from '~/templateEngine/getTemplateEngine.js';
import { logger, PARENT_EVENTS_PREFIX } from '~/common.js';
import { randomUUID } from 'node:crypto';
import { SubscriptionScope } from '~/variableScope/SubscriptionScope.js';
import type { ITemplateEngine } from '~/templateEngine/ITemplateEngine.js';
import type { ITemplateVariable } from '~/templateVariable/ITemplateVariable.js';
import type { IVariableChangeEvent, IVariableScope } from '~/variableScope/IVariableScope.js';


export class VariableScope extends EventEmitter implements IVariableScope {

    public children = new Set<VariableScope>();

    public readonly id: string = randomUUID();

    protected variableNameToVariableMap = new Map<string, ITemplateVariable>();

    protected variableValues = new Map<string, any>();

    protected variableDefaultValues = new Map<string, any>();

    // todo pass engine in props
    protected templateEngine: ITemplateEngine = getTemplateEngine();

    protected subscriptionMiniScopes = new Map<string, SubscriptionScope>();

    constructor(public parent: VariableScope | undefined = undefined) {
        super();
        this.setupEvents();
    }

    /**
     * setup events to propagate events from parent to children,
     * the `reactive` option of TemplateVariable relies on those events
     *
     * When reactive is true, each scope takes event sent by its parent
     * and resends it to its children, but it resends changed event with itself
     * as scope in event. This way, children can be sure that in event is
     * their parent scope and not some higher scope.
     *
     */
    setupEvents() {
        this.on('*', (eventName: string, ev: IVariableChangeEvent) => {
            if (eventName.startsWith(PARENT_EVENTS_PREFIX) && ev.variable.reactive) {
                this.children.forEach((child) => {
                    child.trigger(eventName, {
                        ...ev,
                        scope: this,
                    });
                });
            }
            else if (ev.scope === this) {
                this.children.forEach((child) => {
                    child.trigger(`${PARENT_EVENTS_PREFIX}${eventName}`, ev);
                });
            }
        });
    }

    spawnChild(): VariableScope {
        const s = new VariableScope(this);

        this.addChild(s);

        return s;
    }

    addChild(scope: VariableScope) {
        if (scope === this) {
            throw new Error('Attempt to add scope as child to itself');
        }

        scope.parent = this;
        this.children.add(scope as VariableScope);
    }

    registerVariable(variable: ITemplateVariable): void {
        const { name, defaultValue } = variable;

        if (this.variableNameToVariableMap.has(name)) {
            throw new Error(`Variable "${name}" already registered in this scope`);
        }

        this.variableNameToVariableMap.set(name, variable);

        if (this.templateEngine.hasVariables(defaultValue)) {
            this.subscriptionMiniScopes.set(name, new SubscriptionScope(variable, this, this.templateEngine));
        }

        this.variableValues.set(name, defaultValue);
        this.variableDefaultValues.set(name, defaultValue);
        this.trigger(`${name}:change`, {
            variable,
            transformedValue: defaultValue,
            scope: this,
        } as IVariableChangeEvent);
    }

    bulkRegisterVariables(variables: ITemplateVariable[]): void {
        variables
            .sort((var1, var2) =>
                // we want to register variables with dependencies last
                this.templateEngine.hasVariables(var2.defaultValue) ? -1 : 1,
            )
            .forEach(variable => this.registerVariable(variable));
    }

    setVariableValue<T = any>(name: string, value: T) {
        let scope: VariableScope = this;

        if (!this.hasVariable(name)) {
            // should it be like this? maybe create new variable in current scope with the same name
            const temp = this.findFirstScopeFromBottomWithVariable(name);

            assert(temp, `Attempt to set non existing variable ${name}`);

            scope = temp;
        }

        const variable = scope.variableNameToVariableMap.get(name) as ITemplateVariable;

        if (variable.readonly)
            throw new Error(`Attempt to set value for readonly variable ${name}`);

        variable.validate(value, variable, this);
        const transformedValue = variable.transformValue(value, scope);
        scope.variableValues.set(name, transformedValue);
        scope.trigger(`${name}:change`, {
            variable,
            transformedValue,
            scope
        } as IVariableChangeEvent);
    }

    getVariableValue<T = any>(name: string, withFallback: boolean = true): T | undefined {
        let scope: VariableScope = this;

        if (this.variableValues.get(name) === undefined && withFallback) {
            const temp = this.findFirstScopeFromBottomWithNonNullableVariableValue(name);

            if (temp === undefined) {
                return undefined;
            }

            scope = temp;
        }

        return scope.variableValues.get(name) as T;
    }

    getVariable<T = any>(name: string): ITemplateVariable {
        let scope: VariableScope = this;

        if (!this.hasVariable(name)) {
            const temp = this.findFirstScopeFromBottomWithVariable(name);

            assert(temp, `Attempt to get value from unregistered in current branch variable: "${name}"`);

            scope = temp;
        }

        return scope.variableNameToVariableMap.get(name) as ITemplateVariable;
    }

    getVariableFromTop<T = any>(name: string): ITemplateVariable {
        let scope: VariableScope = this;

        if (!this.hasVariable(name)) {
            const temp = this.findFirstScopesFromTopWithVariable(name);

            assert(temp, `Attempt to get value from unregistered in current branch variable: "${name}"`);

            // todo this is clumsy way to get variable from top scope
            scope = temp[0];
        }

        if (!scope) {
            throw new Error(`Variable ${name} not found`);
        }

        return scope.variableNameToVariableMap.get(name) as ITemplateVariable;
    }

    hasVariable(name: string): boolean {
        return this.variableNameToVariableMap.has(name);
    }

    collectAllBranchVariablesValues<T extends Record<string, any> = Record<string, any>>(): T {
        const thisScopeVariables = Object.fromEntries(this.variableValues.entries());

        return [...this.children.values()].reduce((acc, scope) => {
            return {
                ...acc,
                // copy within, because we don't want to overwrite variables from parent scope
                ...copyObjectWithin(scope.collectAllBranchVariablesValues(), Object.keys(thisScopeVariables)),
            };
        }, thisScopeVariables as T);
    }

    collectAllBranchVariables(variablesAcc: ITemplateVariable[] = []): ITemplateVariable[] {
        const alreadyCollectedVariablesNames = variablesAcc.map(v => v.name);
        const thisScopeVariables = [...this.variableNameToVariableMap.values()]
            .filter(v => !alreadyCollectedVariablesNames.includes(v.name));

        const allCollected = [...variablesAcc, ...thisScopeVariables];

        logger.debug('Scope', this.id, 'collected vars >>>', [...this.variableNameToVariableMap.values()].map(v => `${v.name}:${this.getVariableValue(v.name)}`), 'isRoot:', this.isRoot());

        const mergedVariables = [...this.children.values()].reduce((acc, scope) => ([
            ...acc,
            // copy within, because we don't want to overwrite variables from parent scope
            ...scope.collectAllBranchVariables(allCollected),
        ]), thisScopeVariables);

        logger.debug('Scope', this.id, 'collected merged with children >>>', mergedVariables.map(v => v.name));

        return mergedVariables;
    }

    setVariableValueFromTop<T = any>(name: string, value: T) {
        const matches = this.findFirstScopesFromTopWithVariable(name);

        matches.forEach(match => match.setVariableValue(name, value));
    }

    findFirstScopesFromTopWithVariable(name: string): VariableScope[] {
        // first search for root scope
        const findRoot = (scope: VariableScope): VariableScope => {
            if (scope.parent) {
                return findRoot(scope.parent);
            }

            return scope;
        };

        // later start searching from root to bottom, because scope can have
        // many children, so we need to treat this structure as a tree and be
        // prepared for branching
        const findTopChildrenWithVariable = (scope: VariableScope): VariableScope[] => {
            if (scope.hasVariable(name)) {
                return [scope];
            }

            return [...scope.children.values()].flatMap(findTopChildrenWithVariable);
        };

        const root = findRoot(this);
        return findTopChildrenWithVariable(root);
    }

    findFirstScopeFromBottomWithVariable(name: string): VariableScope | undefined {
        let current: VariableScope = this;

        while (1) {
            if (current.hasVariable(name)) {
                return current;
            }

            if (current.parent) {
                current = current.parent;
            } else {
                return undefined;
            }
        }
    }

    findFirstScopeFromBottomWithNonNullableVariableValue(name: string): VariableScope | undefined {
        let current: VariableScope = this;

        while (1) {
            if (current.variableValues.get(name) !== undefined) {
                return current;
            }

            if (current.parent) {
                current = current.parent;
            } else {
                return undefined;
            }
        }
    }

    assignValuesFromObject(valuesObject: Record<string, any>): void {
        Object.entries(valuesObject).forEach(([name, value]) => {
            this.setVariableValue(name, value);
        });
    }

    assignValuesObjectFromTop(valuesObject: Record<string, any>): void {
        Object.entries(valuesObject).forEach(([name, value]) => {
            this.setVariableValueFromTop(name, value);
        });
    }

    isRoot(): boolean {
        return !this.parent;
    }
}
