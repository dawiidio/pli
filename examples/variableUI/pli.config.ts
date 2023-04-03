import { IConfig, ITemplateVariable, IVariableScope, Template, TemplateVariable } from '../../lib/exports';

const variable = new TemplateVariable({
    name: 'VALUE',
    ui: {
        message: 'My list variable',
        // For more types look here https://github.com/SBoudrias/Inquirer.js#prompt-types
        type: 'list',
        hidden: false,
        options: [
            {
                value: 'option1',
                label: 'Option 1'
            },
            {
                value: 'option2',
                label: 'Option 2'
            }
        ],
    }
});


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
