import { IStorage } from '~/storage/IStorage';
import { FileSystemStorage } from '~/storage/adapter/FileSystemStorage';

export type IStorageType = 'fs';

export const getStorage = (type: IStorageType = 'fs'): IStorage => {
    switch (type) {
        case 'fs':
            return FileSystemStorage;
        default:
            throw new Error(`Unknown storage type "${type}"`);
    }
}
