import { IVariableScope } from '~/variableScope/IVariableScope';
import { ITemplateEngine } from '~/templateEngine/ITemplateEngine';

export type IVariableUiType = 'input' |
    'number' |
    'confirm' |
    'list' |
    'rawlist' |
    'checkbox' |
    'password' |
    'expand' |
    'editor';

export interface IVariableUiOption<T = any> {
    value?: T;

    label: string;

    key?: string;
}

export interface IVariableUiDescriptor {
    type: IVariableUiType;

    message: string;

    hidden: boolean;

    options: IVariableUiOption[];

    /**
     * The index of the variable in UI, higher index means the variable will be asked earlier
     * value relies on amount of variables it depends on, each variable subtracts n from index
     */
    index: number
}

export type IVariableTransformer<T = any, R = any> = (val: T, variable: ITemplateVariable, scope: IVariableScope) => R;

export interface ITemplateVariable<T = any> {
    name: string,

    defaultValue?: T | undefined | string;

    validate: (value: T, variable: ITemplateVariable<T>, ctx: IVariableScope) => void;

    ui: IVariableUiDescriptor;

    multiple?: boolean;

    readonly?: boolean;

    /**
     * @preserve
     */
    overridable?: boolean;

    /**
     * If true, the variable will be updated when a parent scope variable changes
     *
     * it means that transformer will be called again
     *
     * todo maybe same mechanism should be for variables with dependencies passed in `defaultValue` as variable names
     */
    reactive?: boolean;

    merge(variable: ITemplateVariable): ITemplateVariable;

    pipe(...transformers: IVariableTransformer<T>[]): ITemplateVariable

    transformValue(value: any, scope: IVariableScope): T;

    clone(): ITemplateVariable<T>;

    getDependencies(templateEngine: ITemplateEngine): string[];
}
