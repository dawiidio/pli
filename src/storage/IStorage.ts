export interface IStorage {
    modes: {
        W: number,
        R: number,
    }

    sep: string;

    read(path: string): Promise<string>;

    write(path: string, content: string): Promise<void>;

    readDir(path: string): Promise<string[]>;

    createDir(path: string): Promise<string | undefined>;

    isDir(path: string): Promise<boolean>;

    splitPath(path: string): string[];

    getRelativePath(from: string, to: string): string;

    access(path: string, mode?: number): Promise<void>;

    resolve(...path: string[]): string;

    join(...path: string[]): string;

    dirname(path: string): string;

    basename(path: string): string;
}
