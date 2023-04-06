import { IConfig, ITemplateVariable, IVariableScope, Template, TemplateVariable } from '@dawiidio/pli';

const childTemplate = new Template({
    id: '$NAME$.ts',
});

const config: IConfig = {
    templates: [
        new Template({
            name: 'My readable name for template',
            id: '$DIRNAME$',
            variables: [
                new TemplateVariable({
                    name: 'TEST',
                    defaultValue: 'lorem ipsum dolor',
                }),
            ],
            entries: [childTemplate]
        })
    ]
}

export default config;
