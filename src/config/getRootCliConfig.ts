import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { argv } from 'node:process';
import { Argv } from 'yargs';
import { ICliOptions } from '~/config/ICliOptions';

const DEFAULT_CLI_OPTIONS: Partial<ICliOptions> = {
    dry: false,
    allowOverwriting: false,
};

export const getRootCliConfig = (): Partial<ICliOptions> => {
    const cliOptions = (yargs(hideBin(argv)) as Argv<ICliOptions>)
        .scriptName('pli')
        .options('config', {
            alias: 'c',
            type: 'string',
            description: 'relative path to config file',
        })
        .options('dry', {
            alias: 'd',
            type: 'boolean',
            description: 'dry run, results will not be saved',
        })
        .options('allowOverwriting', {
            alias: 'o',
            type: 'boolean',
            description: 'allow overwriting output files while committing data to storage',
        })
        .options('templatesDirectory', {
            alias: 't',
            type: 'boolean',
            description: 'allow overwriting output files while committing data to storage',
        })
        .parse() as unknown as Partial<ICliOptions>;

    return {
        ...DEFAULT_CLI_OPTIONS,
        ...cliOptions,
    };
};
