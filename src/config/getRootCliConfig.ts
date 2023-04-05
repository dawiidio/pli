import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { argv } from 'node:process';
import { Argv, command } from 'yargs';
import { ICliOptions } from '~/config/ICliOptions';
import { initConfigFile } from '~/config/initConfigFile';
import * as process from 'process';
import { initTemplatesDirectory } from '~/config/initTemplatesDirectory';
import { getStorage } from '~/storage/getStorage';
import { DEFAULT_TEMPLATES_DIRNAME } from '~/common';

const DEFAULT_CLI_OPTIONS: Partial<ICliOptions> = {
    dry: false,
    allowOverwriting: false,
};

interface IInitOptions {
    config: boolean;

    typescript: boolean;
}

export const getRootCliConfig = (): Partial<ICliOptions> => {
    const cliOptions = (yargs(hideBin(argv)) as Argv<ICliOptions>)
        .scriptName('pli')
        .command(['$0', 'run'], 'runs cli, default command', (ctx) => {
            return ctx
                .option('config', {
                    alias: 'c',
                    type: 'string',
                    description: 'path to config file',
                })
                .option('dry', {
                    alias: 'd',
                    type: 'boolean',
                    description: 'dry run, results will not be saved',
                })
                .option('allowOverwriting', {
                    alias: 'o',
                    type: 'boolean',
                    description: 'allow overwriting output files while committing data to storage',
                })
                .option('templatesDirectory', {
                    alias: 't',
                    type: 'boolean',
                    default: 'templates',
                    description: 'override templates directory',
                });
        })
        .command<IInitOptions>('init', 'initializes pli in current directory', (ctx) => {
            return ctx
                .option('config', {
                    alias: 'c',
                    type: 'boolean',
                    description: 'create config file',
                    default: false,
                })
                .option('typescript', {
                    alias: 't',
                    type: 'boolean',
                    description: 'create config file in typescript',
                    default: true,
                });
        }, async (argv) => {
            // todo refactor below function as well as initConfigFile and initTemplatesDirectory because it looks messy
            const storage = getStorage('fs');
            const ext = argv.typescript ? 'ts' : 'js';
            const cwd = process.cwd();

            if (argv.config) {
                try {
                    console.log(`Config file created in ${await initConfigFile(cwd, ext, storage)}`);
                }
                catch {
                    console.log('Config file already exists');
                }
            }

            try {
                await storage.access(storage.join(cwd, DEFAULT_TEMPLATES_DIRNAME));
            } catch (e) {
                console.log(`Templates directory created in ${await initTemplatesDirectory(cwd, ext, storage)}`);
            }

            console.log('All set - you are ready to go!');
            process.exit(0);
        })
        .parse() as unknown as Partial<ICliOptions>;

    return {
        ...DEFAULT_CLI_OPTIONS,
        ...cliOptions,
    };
};
