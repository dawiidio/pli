import { IConfig, ITemplateVariable, IVariableScope, Template, TemplateVariable } from '@dawiidio/pli';

const parent = new TemplateVariable({
    name: 'PARENT',
});

const child = new TemplateVariable({
    name: 'CHILD',
    // variable child will be now listen for changes in PARENT and update it's own value
    defaultValue: parent,
    ui: {
        // if you will set hidden to true then variable will only react to it's parent value changes and will be invisible in ui
        hidden: true
    }
});

// child variable can still transform it's own value without affecting parent
child.pipeValue(
    (val: string) => val.toUpperCase()
)

const config: IConfig = {
    templates: [
        new Template({
            name: 'My readable name for template',
            id: '$NAME$.ts',
            variables: [
                parent,
                child,
            ],
        }),
    ],
};

export default config;
