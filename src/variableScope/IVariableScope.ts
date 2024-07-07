import type { ITemplateVariable } from '~/templateVariable/ITemplateVariable.js';
import type { EventEmitter } from '@dawiidio/tools';

export interface IVariableChangeEvent {
    variable: ITemplateVariable;

    transformedValue: any;

    scope: IVariableScope;
}

export interface IVariableScope extends EventEmitter {
    readonly id: string;

    parent: IVariableScope | undefined;

    children: Set<IVariableScope>;

    spawnChild(): IVariableScope;

    addChild(scope: IVariableScope): void;

    registerVariable(variable: ITemplateVariable): void;

    bulkRegisterVariables(variables: ITemplateVariable[]): void

    setVariableValue<T = any>(name: string, value: T): void;

    getVariableValue<T = any>(name: string, withFallback?: boolean): T | undefined

    getVariable<T = any>(name: string): ITemplateVariable;

    hasVariable(name: string): boolean;

    collectAllBranchVariablesValues<T extends Record<string, any> = Record<string, any>>(): T;

    collectAllBranchVariables(variablesAcc?: ITemplateVariable[]): ITemplateVariable[];

    setVariableValueFromTop<T = any>(name: string, value: T): void;

    assignValuesFromObject(valuesObject: Record<string, any>): void;

    assignValuesObjectFromTop(valuesObject: Record<string, any>): void;

    findFirstScopesFromTopWithVariable(name: string): IVariableScope[];

    findFirstScopeFromBottomWithVariable(name: string): IVariableScope | undefined;

    getVariableFromTop<T = any>(name: string): ITemplateVariable;

    isRoot(): boolean;

    findFirstScopeFromBottomWithNonNullableVariableValue(name: string): IVariableScope | undefined;
}
