import { IStorage } from '~/storage/IStorage';
import { getStorage } from '~/storage/getStorage';
import { DEFAULT_TEMPLATES_DIRNAME } from '~/common';

type ISupportedExtensions = 'ts' | 'js';

const INITIAL_TEMPLATES: Record<ISupportedExtensions, { filename: string, content: string }> = {
    ts: {
        filename: `hello.ts`,
        content:
`export function hello(): string {
    return 'Hello $NAME$';
}
`
    },
    js: {
        filename: `hello.js`,
        content:
`export function hello() {
    return 'Hello $NAME$';
}
`
    }
}

export const initTemplatesDirectory = async (path: string, extension: ISupportedExtensions, storage: IStorage = getStorage('fs')): Promise<string> => {
    const {
        filename,
        content,
    } = INITIAL_TEMPLATES[extension];

    await storage.createDir(storage.join(path, DEFAULT_TEMPLATES_DIRNAME));
    const fullPath = storage.join(path, DEFAULT_TEMPLATES_DIRNAME, filename);
    await storage.write(
        fullPath,
        content
    );

    return fullPath;
}
