import { Template } from '@dawiidio/pli';
import { IConfig } from '@dawiidio/pli';
import { TemplateVariable } from '@dawiidio/pli';

const config: IConfig = {
    templates: [
        new Template({
            name: 'My readable name for template',
            id: '$NAME$.ts',
            variables: [
                new TemplateVariable({
                    name: 'RETURN_TEXT',
                    defaultValue: 'lorem ipsum dolor',
                }),
                new TemplateVariable({
                    name: 'NAME',
                    defaultValue: 'getText',
                })
            ],
        })
    ]
}

export default config;
