import { LazyPipe } from '@dawiidio/tools';
import { ITemplateVariable, IVariableTransformer, IVariableUiDescriptor } from '~/templateVariable/ITemplateVariable.js';
import { IVariableScope } from '~/variableScope/IVariableScope.js';
import { ITemplateEngine } from '~/templateEngine/ITemplateEngine.js';

export interface IVariableProps<T = any> {
    name: string,

    defaultValue?: T | undefined | string;

    validate?: (value: T, variable: ITemplateVariable<T>, ctx: IVariableScope) => void;

    ui?: Partial<IVariableUiDescriptor>;

    multiple?: boolean;

    readonly?: boolean;

    overridable?: boolean;

    reactive?: boolean;
}

export class TemplateVariable<T = any> implements ITemplateVariable<T> {

    public defaultValue: T | undefined | string;

    public multiple = false;

    public name: string;

    public ui: IVariableUiDescriptor;

    public overridable: boolean;

    public readonly: boolean;

    public reactive: boolean;

    private lazyPipe = new LazyPipe<T, IVariableTransformer>();

    constructor({
                    validate,
                    defaultValue,
                    name,
                    ui,
                    multiple,
                    readonly = false,
                    overridable = true,
                    reactive = false,
                }: IVariableProps<T>) {
        this.name = name;
        this.validate = validate || this.validate;
        this.defaultValue = defaultValue;
        this.multiple = multiple || false;
        this.readonly = readonly;
        this.overridable = overridable;
        this.reactive = reactive;

        this.ui = {
            type: 'input',
            message: `Insert value for ${name} :`,
            hidden: false,
            options: [],
            index: 1000,
            ...(ui || {}),
        };
    }

    static isTemplateVariable(predicate: any): predicate is TemplateVariable {
        return predicate instanceof TemplateVariable;
    }

    public validate: (value: T, variable: ITemplateVariable<T>, ctx: IVariableScope) => void = () => {};

    pipe(...transformers: IVariableTransformer[]): this {
        this.lazyPipe.pipe(...transformers);

        return this;
    }

    transformValue(value: any, scope: IVariableScope): T {
        return this.lazyPipe.run(value, this, scope);
    }

    merge<T = any>({
                       name,
                       ui,
                       multiple,
                       lazyPipe,
                       defaultValue,
                       validate,
                       reactive
                   }: TemplateVariable<T>): TemplateVariable<T> {
        const variable = new TemplateVariable<T>({
            name: name || this.name,
            ui: {
                ...this.ui,
                ...ui,
                options: (ui.options || this.ui.options)
                    ? [
                        ...(this.ui.options || []),
                        ...(ui.options || []),
                    ]
                    : undefined,
            },
            // @ts-ignore
            validate: validate || this.validate,
            overridable: this.overridable,
            multiple: multiple || this.multiple,
            defaultValue: (defaultValue || this.defaultValue) as T,
            reactive: reactive || this.reactive,
        });

        // todo merge pipeline transformers
        variable.lazyPipe = lazyPipe;

        return variable;
    }

    clone(): ITemplateVariable<T> {
        return this.merge(this);
    }

    getDependencies(templateEngine: ITemplateEngine): string[] {
        return templateEngine.extractAllVariables(String(this.defaultValue || ''));
    }
}
