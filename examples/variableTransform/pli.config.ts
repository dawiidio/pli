import { IConfig, ITemplateVariable, IVariableScope, Template, TemplateVariable } from '@dawiidio/pli';

const variable = new TemplateVariable({
    name: 'VALUE',
});

// here we are using pipe to transform variable value
// piped value will be used in template
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
                variable
            ],
        })
    ]
}

export default config;
