import { IStorage } from '~/storage/IStorage.js';
import { FileSystemStorage } from '~/storage/adapter/FileSystemStorage.js';
import { exitWithError } from '~/common.js';

interface ISaveRenderOutputToStorageOptions {
    allowOverwriting?: boolean
}

export const saveRenderOutputToStorage = async (renderOutput: Record<string, string>, storage: IStorage, options: ISaveRenderOutputToStorageOptions = {}): Promise<void> => {
    const entries = Object.entries(renderOutput);
    const directories: string[] = [];
    const files: string[] = [];

    for (const [path] of entries) {
        directories.push(storage.dirname(path));
        files.push(path);
    }

    try {
        await Promise.all(directories.map(async (path) => await storage.createDir(path)));
    }
    catch (e) {
        exitWithError(`Error occurred while saving output to storage. Changes haven't been saved. Original error message:\n${(e as Error).message}`);
    }

    if (!options.allowOverwriting) {
        for (const path of files) {
            try {
                // if file already exists, and we can't overwrite it then exit, it may change in the future when files editing will be added
                await storage.access(path, FileSystemStorage.modes.W);
                exitWithError(`Error occurred while saving output to storage. Changes haven't been saved. Original error message:\nOverwriting is disabled and file ${path} already exists`);
            }
            // biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
            catch {}
        }
    }

    await Promise.all(entries.map(([path, content]) =>
        storage.write(path, content))
    );
}
