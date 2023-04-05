import { IStorage } from '~/storage/IStorage';
import { getStorage } from '~/storage/getStorage';
import { DEFAULT_CONFIG_FILENAME } from '~/common';

type ISupportedExtensions = 'ts' | 'js';

const INITIAL_TEMPLATES: Record<ISupportedExtensions, { filename: string, content: string }> = {
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
`import { Template, TemplateVariable } from '@dawiidio/pli';

const config = {
    templates: [
        
    ],
};

export default config;
`
    }
}

export const initConfigFile = async (path: string, extension: ISupportedExtensions, storage: IStorage = getStorage('fs')): Promise<string> => {
    const {
        filename,
        content,
    } = INITIAL_TEMPLATES[extension];
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
