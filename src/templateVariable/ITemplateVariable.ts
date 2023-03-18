import { IVariableScope } from '~/variableScope/IVariableScope';

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
}

export interface ITemplateVariable<T = any> {
    name: string,

    defaultValue?: T | undefined;

    validate: (value: T, variable: ITemplateVariable<T>, ctx: IVariableScope) => void;

    options?: IVariableUiOption<T>[] | string[]

    ui: IVariableUiDescriptor;

    multiple?: boolean;

    readonly?: boolean;

    overridable?: boolean;

    getValue(): T | undefined;

    setValue(value: any): void;

    merge(variable: ITemplateVariable): ITemplateVariable;
}
