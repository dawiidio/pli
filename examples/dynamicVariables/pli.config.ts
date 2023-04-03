import { IConfig, ITemplateVariable, Template, TemplateVariable } from '../../lib/exports';
import { TemplateEntry } from '../../src/templateEntry/TemplateEntry';

const name = new TemplateVariable({
    name: 'NAME',
    defaultValue: 'Dawid',
});

const profession = new TemplateVariable({
    name: 'PROFESSION',
    defaultValue: 'programmer',
    ui: {
        type: 'list',
        options: [
            {
                value: 'programmer',
                label: 'Programmer',
            },
            {
                value: 'plumber',
                label: 'Plumber',
            },
            {
                value: 'teacher',
                label: 'Teacher',
            },
            {
                value: 'doctor',
                label: 'Doctor',
            }
        ]
    }
});

const results = new TemplateVariable({
    name: 'RESULTS',
    defaultValue: 'Hi! My name is $NAME$ and I am a $PROFESSION$', // you can use other variables in default value
    ui: {
        // if you will set hidden to true then variable will only react to other variables value changes and will be invisible in ui
        hidden: true
    }
});

const config: IConfig = {
    templates: [
        new Template({
            name: 'My readable name for template',
            id: '$NAME$.ts',
            variables: [
                name,
                profession,
                results,
            ],
        }),
        new Template({
            name: 'My second template',
            id: 'dynamic template',
            // variables are also reusable in other templates
            variables: [
                name,
            ],
            entries: [
                new TemplateEntry({
                    content: 'hi $NAME$',
                    dynamic: true,
                    source: 'test.ts',
                })
            ]
        }),
    ],
};

export default config;
