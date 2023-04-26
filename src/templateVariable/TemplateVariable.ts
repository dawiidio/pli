import { LazyPipe } from '@dawiidio/tools';
import { ITemplateVariable, IVariableUiDescriptor } from '~/templateVariable/ITemplateVariable';
import { IVariableScope } from '~/variableScope/IVariableScope';
import { ITemplateEngine } from '~/templateEngine/ITemplateEngine';

export interface IVariableProps<T = any> {
    name: string,

    defaultValue?: T | undefined | string;

    validate?: (value: T, variable: ITemplateVariable<T>, ctx: IVariableScope) => void;

    ui?: Partial<IVariableUiDescriptor>;

    multiple?: boolean;

    readonly?: boolean;

    overridable?: boolean;

    index?: number
}

export class TemplateVariable<T = any> implements ITemplateVariable<T> {

    public defaultValue: T | undefined | string;

    public multiple = false;

    public name: string;

    public ui: IVariableUiDescriptor;

    public index: number;

    public overridable: boolean;

    public readonly: boolean;

    private lazyPipe = new LazyPipe<T>();

    constructor({
                    validate,
                    defaultValue,
                    name,
                    ui,
                    multiple,
                    readonly = false,
                    overridable = true,
                    index = 500,
                }: IVariableProps<T>) {
        this.name = name;
        this.validate = validate || this.validate;
        this.defaultValue = defaultValue;
        this.multiple = multiple || false;
        this.readonly = readonly;
        this.index = index;
        this.overridable = overridable;

        this.ui = {
            type: 'input',
            message: `Insert value for ${name} :`,
            hidden: false,
            options: [],
            ...(ui || {}),
        };
    }

    static isTemplateVariable(predicate: any): predicate is TemplateVariable {
        return predicate instanceof TemplateVariable;
    }

    public validate: (value: T, variable: ITemplateVariable<T>, ctx: IVariableScope) => void = () => {
    };

    pipe(...transformers: ((val: any) => any)[]): this {
        this.lazyPipe.pipe(...transformers);

        return this;
    }

    transformValue(value: any): T {
        return this.lazyPipe.run(value);
    }

    merge<T = any>({
                       name,
                       ui,
                       multiple,
                       lazyPipe,
                       defaultValue,
                       validate,
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
