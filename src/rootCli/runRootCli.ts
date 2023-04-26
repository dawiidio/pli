import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { argv } from 'node:process';
import { Argv } from 'yargs';
import { IInitCommandOptions, IMainCommandOptions } from '~/rootCli/IMainCommandOptions';
import { main } from '~/rootCli/commands/main';
import { init } from '~/rootCli/commands/init';

const DEFAULT_CLI_OPTIONS: Partial<IMainCommandOptions> = {
    dry: false,
    allowOverwriting: false,
};

export const runRootCli = (): void => {
    (yargs(hideBin(argv)) as Argv<IMainCommandOptions>)
        .scriptName('pli')
        .command<IMainCommandOptions>(['$0', 'run'], 'runs cli, default command', (ctx) => {
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
                .option('logLevel', {
                    alias: 'l',
                    type: 'string',
                    default: 'error',
                    description: 'log level. Available options: error, warn, info, debug. Multiple options can be provided separated by |',
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
        }, async (argv) => {
            await main({
                ...DEFAULT_CLI_OPTIONS,
                ...argv
            });
        })
        .command<IInitCommandOptions>('init', 'initializes pli in current directory', (ctx) => {
            return ctx
                .option('config', {
                    alias: 'c',
                    type: 'boolean',
                    description: 'create config file',
                    default: false,
                })
                .option('type', {
                    alias: 't',
                    type: 'string',
                    default: 'ts',
                    description: 'type of config file. Available options: ts, js, mjs',
                });
        }, async (argv) => {
            await init(argv);
        })
        .parse();
};
