import { readdirRecursively } from '@dawiidio/tools';
import { promises, constants } from 'node:fs';
import { extname, relative, sep, resolve, join, dirname } from 'path';

const { readFile, writeFile, mkdir, access } = promises;
const { W_OK, R_OK } = constants;

export class FileSystemStorage {
    static modes = {
        W: W_OK,
        R: R_OK,
    }

    static async read(path: string): Promise<string> {
        return (await readFile(path)).toString();
    }

    static async write(path: string, content: string): Promise<void> {
        await writeFile(path, content);
    }

    static async access(path: string, mode?: number): Promise<void> {
        await access(path);
    }

    static readDir(path: string): Promise<string[]> {
        return readdirRecursively(path);
    }

    static createDir(path: string): Promise<string | undefined> {
        return mkdir(path, {
            recursive: true
        });
    }

    static async isDir(path: string): Promise<boolean> {
        return Boolean(extname(path));
    }

    static splitPath(path: string, forcedSep = sep): string[] {
        return path.split(sep);
    }

    static getRelativePath(from: string, to: string): string {
        return relative(from, to);
    }

    static resolve(...path: string[]): string {
        return resolve(...path);
    }

    static join(...path: string[]): string {
        return join(...path);
    }

    static dirname(path: string): string {
        return dirname(path);
    }
}
