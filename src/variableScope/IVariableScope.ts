import { ITemplateVariable } from '~/templateVariable/ITemplateVariable';

export interface IVariableScope {
    variables: ITemplateVariable[];

    add(variable: ITemplateVariable | ITemplateVariable[]): void;

    remove(variable: ITemplateVariable): void;

    getVariableByName(name: string): ITemplateVariable;

    resolveValue<T = any>(name: string): T;

    validate(): void;

    spawnChildContext(): IVariableScope;

    destroyChildContexts(): void;

    destroy(): void;

    getAllVariables(): Record<string, ITemplateVariable>;

    getGlobalVariableByName(name: string): ITemplateVariable;

    setValuesFromObject(valuesMap: Record<string, any>): void;

    resolveVariable(name: string): ITemplateVariable;
}
