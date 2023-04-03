import { Template } from '../../lib/exports';
import { IConfig } from '../../lib/exports';
import { TemplateVariable } from '../../lib/exports';

const variable = new TemplateVariable({
    name: 'VALUE',
});

// here we are using pipe to transform variable value
// piped value will be used in template
variable.pipe(
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
