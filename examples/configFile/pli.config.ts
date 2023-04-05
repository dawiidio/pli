import { Template } from '../../lib/exports';
import { IConfig } from '../../lib/exports';
import { TemplateVariable } from '../../lib/exports';

const config: IConfig = {
    templates: [
        new Template({
            name: 'My readable name for template',
            id: '$NAME$.ts',
            // all will be generated relative to myDir directory
            defaultOutputDirectoryPath: 'myDir',
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
