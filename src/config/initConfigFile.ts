import { IStorage } from '~/storage/IStorage';
import { getStorage } from '~/storage/getStorage';
import { DEFAULT_CONFIG_FILENAME, ISupportedFileTypes } from '~/common';


const INITIAL_TEMPLATES: Record<ISupportedFileTypes, { filename: string, content: string }> = {
    ts: {
        filename: `${DEFAULT_CONFIG_FILENAME}.ts`,
        content:
`import { IConfig, Template, TemplateVariable } from '@dawiidio/pli';

const config: IConfig = {
    templates: [
        
    ],
};

export default config;
`
    },
    js: {
        filename: `${DEFAULT_CONFIG_FILENAME}.js`,
        content:
`const { Template, TemplateVariable } = require('@dawiidio/pli');

const config = {
    templates: [
        
    ],
};

exports.default = config;
`
    },
mjs: {
        filename: `${DEFAULT_CONFIG_FILENAME}.mjs`,
        content:
`import { Template, TemplateVariable } from '@dawiidio/pli';

const config = {
    templates: [
        
    ],
};

export default config;
`
    }
}

export const initConfigFile = async (path: string, type: ISupportedFileTypes, storage: IStorage = getStorage('fs')): Promise<string> => {
    const {
        filename,
        content,
    } = INITIAL_TEMPLATES[type];
    const fullPath = storage.join(path, filename);

    try {
        await storage.access(fullPath);
    } catch {
        await storage.write(
            fullPath,
            content
        );

        return fullPath;
    }

    throw new Error(`Config file already exists at ${fullPath}`);
}
