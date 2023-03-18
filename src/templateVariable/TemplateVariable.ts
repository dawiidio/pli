import { IVariableScope } from '~/variableScope/IVariableScope';
import { LazyPipe } from '@dawiidio/tools';
import { ITemplateVariable, IVariableUiDescriptor, IVariableUiOption } from '~/templateVariable/ITemplateVariable';

export interface IVariableProps<T = any> {
    name: string,

    defaultValue?: T | undefined;

    validate?: (value: T, variable: ITemplateVariable<T>, ctx: IVariableScope) => void;

    options?: IVariableUiOption<T>[] | string[]

    ui?: Partial<IVariableUiDescriptor>;

    multiple?: boolean;

    readonly?: boolean;

    overridable?: boolean;
}

export class TemplateVariable<T = any> implements IVariableProps<T> {

    public defaultValue: T | undefined;

    public multiple = false;

    public name: string;

    public options: IVariableUiOption[];

    public ui: IVariableUiDescriptor;

    public overridable: boolean;

    public readonly: boolean;

    public validate: (value: T, variable: ITemplateVariable<T>, ctx: IVariableScope) => void = () => {};

    private value: T | undefined = undefined;

    private lazyPipe = new LazyPipe<T>();

    constructor({ validate, defaultValue, name, options = [], ui, multiple, readonly = false, overridable = true }: IVariableProps<T>) {
        this.name = name;
        this.validate = validate || this.validate;
        this.defaultValue = defaultValue;
        this.value = this.defaultValue;
        this.multiple = multiple || false;
        this.readonly = readonly;
        this.overridable = overridable;
        this.options = options?.map(option => {
            if (typeof option !== 'string')
                return option;

            return {
                value: option,
                label: option,
            };
        });

        this.ui = {
            type: 'input',
            message: `Insert value for ${name} :`,
            hidden: false,
            ...(ui || {})
        }
    }

    getValue(): T | undefined {
        return this.value;
    }

    pipe(...transformers: ((val: any) => any)[]): this {
        this.lazyPipe.pipe(...transformers);

        return this;
    }

    setValue(value: any): void {
        if (this.readonly)
            throw new Error(`Variable ${this.name} is readonly`);

        this.value = this.lazyPipe.run(value);
    }

    merge<T = any>({ name, ui, multiple, options, lazyPipe, defaultValue, validate, value }: TemplateVariable<T>): TemplateVariable<T> {
        const variable = new TemplateVariable<T>({
            name: name || this.name,
            ui: {
                ...this.ui,
                ...ui
            },
            // @ts-ignore
            validate: validate || this.validate,
            overridable: this.overridable,
            options: (options || this.options)
                ? [
                    ...(this.options || []),
                    ...(options || [])
                ]
                : undefined,
            multiple: multiple || this.multiple,
            defaultValue: (defaultValue || this.defaultValue) as T,
        });

        variable.value = value;
        // todo merge pipeline transformers
        variable.lazyPipe = lazyPipe;

        return variable;
    }
}
