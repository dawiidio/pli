import { IStorage } from '~/storage/IStorage.js';
import { FileSystemStorage } from '~/storage/adapter/FileSystemStorage.js';

export type IStorageType = 'fs';

export const getStorage = (type: IStorageType = 'fs'): IStorage => {
    switch (type) {
        case 'fs':
            return FileSystemStorage;
        default:
            throw new Error(`Unknown storage type "${type}"`);
    }
}
