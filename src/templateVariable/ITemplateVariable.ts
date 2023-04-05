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
}

export interface ITemplateVariable<T = any> {
    name: string,

    defaultValue?: T | undefined | string;

    validate: (value: T, variable: ITemplateVariable<T>, ctx: IVariableScope) => void;

    ui: IVariableUiDescriptor;

    index: number;

    multiple?: boolean;

    readonly?: boolean;

    overridable?: boolean;

    merge(variable: ITemplateVariable): ITemplateVariable;

    pipe(...transformers: ((val: any) => any)[]): ITemplateVariable

    transformValue(value: any): T;

    clone(): ITemplateVariable<T>;

    getDependencies(templateEngine: ITemplateEngine): string[];
}
