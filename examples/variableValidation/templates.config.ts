import { IConfig, ITemplateVariable, IVariableScope, Template, TemplateVariable } from '@dawiidio/pli';

const variable = new TemplateVariable({
    name: 'VALUE',
    validate: (val: any, variable: ITemplateVariable, scope: IVariableScope) => {
        // transform value manually in case if transform pipeline was set
        const numberValue = variable.transformValue(val);

        if (!Number.isSafeInteger(numberValue))
            throw new Error(`Value ${val} couldn't be transformed`);

        // you can alo check some values from variable scope
        const name = scope.resolveValue('NAME');
        // do something with name variable...
    },
});

variable.pipe(
    (val: string) => parseInt(val),
    (val: number) => val * 2,
);

const config: IConfig = {
    templates: [
        new Template({
            name: 'My readable name for template',
            id: '$NAME$.ts',
            variables: [
                variable,
            ],
        }),
    ],
};

export default config;
