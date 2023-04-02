import { Template } from '@dawiidio/pli';
import { IConfig } from '@dawiidio/pli';
import { TemplateVariable } from '@dawiidio/pli';

const childTemplate = new Template({
    id: '$NAME$.ts',
});

const config: IConfig = {
    templates: [
        new Template({
            name: 'My readable name for template',
            id: 'test.ts',
            variables: [
                new TemplateVariable({
                    name: 'TEST',
                    defaultValue: 'lorem ipsum dolor',
                }),
            ],
            templates: [childTemplate]
        })
    ]
}

export default config;
