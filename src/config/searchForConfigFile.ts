import { IStorage } from '~/storage/IStorage.js';
import { DEFAULT_CONFIG_FILENAMES } from '~/common.js';

export const searchForConfigFile = async (storage: IStorage, basePath: string): Promise<string | undefined> => {
    const found = await Promise.all(DEFAULT_CONFIG_FILENAMES.map(async (filename) => {
        try {
            const path = storage.join(basePath, filename);
            await storage.access(path);
            return path;
        } catch {
            return '';
        }
    }));

    return found.find(predicate => predicate ? predicate : undefined);
};
