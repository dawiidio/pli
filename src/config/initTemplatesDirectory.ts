import { IStorage } from '~/storage/IStorage.js';
import { getStorage } from '~/storage/getStorage.js';
import { DEFAULT_TEMPLATES_DIRNAME, ISupportedFileTypes } from '~/common.js';

const INITIAL_TEMPLATES: Record<ISupportedFileTypes, { filename: string, content: string }> = {
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
`exports.default = function hello() {
    return 'Hello $NAME$';
}
`
    },
    mjs: {
        filename: `hello.mjs`,
        content:
`export function hello() {
    return 'Hello $NAME$';
}
`
    },
}

export const initTemplatesDirectory = async (path: string, extension: ISupportedFileTypes, storage: IStorage = getStorage('fs')): Promise<string> => {
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
