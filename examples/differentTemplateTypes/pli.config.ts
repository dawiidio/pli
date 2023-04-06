import { IConfig, ITemplateVariable, IVariableScope, Template, TemplateVariable } from '@dawiidio/pli';

// when you have template file but you want to change or add some variables
const staticTemplate = new Template({
    name: 'Static template',
    id: 'test.ts',
    variables: [
        new TemplateVariable({
            name: 'TEST',
            defaultValue: 'MyTestName',
        }),
    ],
});

const config: IConfig = {
    templates: [
        staticTemplate,
        //
        new Template({
            name: 'Hybrid template',
            // you can provide existing template id
            id: '$NAME$.ts',
            variables: [
                new TemplateVariable({
                    name: 'NAME',
                    defaultValue: 'MyNewName',
                }),
            ],
            // and here provide additional entries or templates
            entries: [
                new TemplateEntry({
                    source: '$DIRNAME$/$NAME$.ts',
                })
            ],
        }),
        new Template({
            name: 'Dynamic template',
            // in case of dynamic templates you must provide unique id which doesn't matach any template in templates directory
            id: 'newId',
            variables: [
                new TemplateVariable({
                    name: 'NAME',
                    defaultValue: 'Name',
                }),
            ],
            entries: [
                // you can dynamically pick files from many templates and combine them into new template
                new TemplateEntry({
                    source: '$DIRNAME$/$NAME$.ts',
                }),
                // or you can create template entry complitly on the fly by marking it "dynamic" in props. Filename
                // provided in the source field will be filename of the output file
                new TemplateEntry({
                    source: '$NAME$DynamicFile.ts',
                    content: `export const $NAME$ = 'My Dynamic template';`,
                    dynamic: true,
                }),
                // you can also use existing template as entry
                staticTemplate,
            ],
        }),
    ],
};

export default config;
