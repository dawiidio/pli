import { extname, resolve } from 'path';
import { IConfig, IFullConfig } from '~/config/IConfig.js';
import { IStorage } from '~/storage/IStorage.js';
import { exec } from 'node:child_process';
import * as process from 'process';
import { assertAndExit, CACHE_DIRNAME, DEFAULT_CONFIG_FILENAME, exitWithError } from '~/common.js';
import { createHash } from 'crypto';

const DEFAULT_CONFIG: IFullConfig = {
    templates: [],
};

interface ICompileTsSettings {
    templatesConfigPath: string;

    outDir: string;

    rootDir: string;
}

const getCompileCommand = ({
    templatesConfigPath,
    outDir,
    rootDir,
}: ICompileTsSettings): string => {
    return `tsc ${templatesConfigPath} --outDir ${outDir} --rootDir ${rootDir} --declaration false --module NodeNext --moduleResolution NodeNext --skipDefaultLibCheck true`;
};

const compileTs = (
    storage: IStorage,
    compileSettings: ICompileTsSettings,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const compileProcess = exec(getCompileCommand(compileSettings), {
            cwd: storage.resolve(),
        });

        compileProcess.stderr?.pipe(process.stderr);
        compileProcess.stdout?.pipe(process.stdout);

        compileProcess.on('exit', (val) => {
            compileProcess.stdout?.unpipe(process.stdout);
            compileProcess.stderr?.unpipe(process.stderr);
            resolve();
        });

        compileProcess.on('error', () => {
            reject();
        });
    });
};

const CONFIG_HASH_FILENAME = 'config-hash.txt';
const saveConfigFileHashInCache = async (
    storage: IStorage,
    hash: string,
    cacheDir: string = CACHE_DIRNAME,
) => {
    await storage.write(storage.join(cacheDir, CONFIG_HASH_FILENAME), hash);
};

const getHash = (content: string): string => {
    return createHash('md5').update(content).digest('base64');
};

const checkIfConfigFileChangedAndReturnNewHash = async (
    storage: IStorage,
    currentConfigFilePath: string,
    cacheDir: string = CACHE_DIRNAME,
    pathToCompiledConfig: string,
): Promise<false | string> => {
    const pathToCacheHashFile = storage.join(cacheDir, CONFIG_HASH_FILENAME);
    let prevHash = '';

    try {
        prevHash = await storage.read(pathToCacheHashFile);
    // biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
    } catch {}

    const currentConfigHash = getHash(
        await storage.read(currentConfigFilePath),
    );

    try {
        await storage.access(pathToCompiledConfig);
    } catch {
        return currentConfigHash;
    }

    return currentConfigHash === prevHash ? false : currentConfigHash;
};

export const runTsTemplatesConfigFile = async (
    pathToTemplatesConfig: string,
    storage: IStorage,
    options: IGetConfigFromFileOptions,
): Promise<IConfig> => {
    const cacheDir = options.cacheDir || storage.resolve(CACHE_DIRNAME);
    const tsOutputDir = storage.join(cacheDir, 'js');

    try {
        await storage.access(pathToTemplatesConfig);
    } catch {
        exitWithError(
            `Config file not found under the path ${pathToTemplatesConfig}`,
        );
    }

    try {
        await storage.access(resolve(cacheDir));
    } catch {
        await storage.createDir(resolve(cacheDir));
    }

    const pathToCompiledConfig = storage.join(
        tsOutputDir,
        `${DEFAULT_CONFIG_FILENAME}.js`,
    );
    const newHash = await checkIfConfigFileChangedAndReturnNewHash(
        storage,
        pathToTemplatesConfig,
        cacheDir,
        pathToCompiledConfig,
    );

    if (newHash) {
        console.log(
            '\x1b[35m%s\x1b[0m',
            'Config file changes detected, recompiling...',
        );

        await saveConfigFileHashInCache(storage, newHash, cacheDir);

        try {
            await import('typescript');
        } catch {
            exitWithError(
                `To use TypeScript config you must install typescript. Run "npm install typescript" in your console`,
            );
        }

        await compileTs(storage, {
            templatesConfigPath: pathToTemplatesConfig,
            rootDir: '.',
            outDir: tsOutputDir,
        });
    }

    const { default: config } = await import(pathToCompiledConfig);

    assertAndExit(
        config,
        `Config in ${DEFAULT_CONFIG_FILENAME}.ts must be exported as default`,
    );

    return config as IFullConfig;
};

export const runJsConfigFile = async (
    path: string,
    storage: IStorage,
    options?: IGetConfigFromFileOptions,
): Promise<IConfig> => {
    return (await import(path)).default.default;
};

export const runMjsConfigFile = async (
    path: string,
    storage: IStorage,
    options?: IGetConfigFromFileOptions,
): Promise<IConfig> => {
    return (await import(path)).default;
};

export interface IGetConfigFromFileOptions {
    compilerOptions?: Record<string, any>;

    cacheDir?: string;
}

export const getTemplatesConfigFromFile = async (
    path: string,
    storage: IStorage,
    options: IGetConfigFromFileOptions = {},
): Promise<IFullConfig> => {
    const extension = extname(path).replace('.', '');
    let config: IConfig;

    switch (extension) {
        case 'js':
            config = await runJsConfigFile(path, storage, options);
            break;
        case 'mjs':
            config = await runMjsConfigFile(path, storage, options);
            break;
        case 'ts':
            config = await runTsTemplatesConfigFile(path, storage, options);
            break;
        default:
            throw new Error(`Unsupported extension ${extension}`);
    }

    return {
        ...DEFAULT_CONFIG,
        ...config,
    };
};
