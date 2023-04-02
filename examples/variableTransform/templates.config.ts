import { Template } from '@dawiidio/pli';
import { IConfig } from '@dawiidio/pli';
import { TemplateVariable } from '@dawiidio/pli';

const variable = new TemplateVariable({
    name: 'VALUE',
});

variable.pipeValue(
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
