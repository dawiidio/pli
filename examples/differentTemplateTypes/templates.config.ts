import { TemplateVariable, TemplateEntry, IConfig, Template } from '@dawiidio/pli';

const config: IConfig = {
    templates: [
        new Template({
            name: 'Static template',
            id: 'test.ts',
            variables: [
                new TemplateVariable({
                    name: 'TEST',
                    defaultValue: 'lorem ipsum dolor',
                }),
            ],
        }),
        new Template({
            name: 'Hybrid template',
            // you can provide existing template id
            id: '$NAME$.ts',
            variables: [
                new TemplateVariable({
                    name: 'NAME',
                    defaultValue: 'MyName',
                }),
            ],
            // and here provide additional templates
            templates: [
                '$DIRNAME$/$NAME$.ts',
            ]
        }),
        new Template({
            name: 'Dynamic template',
            // in case of dynamic templates you must provide unique id which doesn't matach any template in templates directory
            id: 'newId',
            variables: [
                new TemplateVariable({
                    name: 'NAME',
                    defaultValue: 'MyName',
                }),
            ],
            templates: [
                // you can dynamically pick files from many templates and combine them into new template
                new TemplateEntry({
                    source: '$DIRNAME$/$NAME$.ts',
                }),
                // or you can create template entry complitly on the fly by marking it "dynamic" in props. Filename
                // provided in the source field will be filename of the output file
                new TemplateEntry({
                    source: '$NAME$DynamicFile.ts',
                    content: `export const $NAME$ = 'My Dynamic template';`,
                    dynamic: true
                }),
            ]
        })
    ]
}

export default config;
