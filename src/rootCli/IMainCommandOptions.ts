import { ILoggerConfigString } from '@dawiidio/tools/lib/node/Logger/Logger';
import { ISupportedFileTypes } from '~/common';

export interface IMainCommandOptions {
    config: string;

    dry: boolean;

    allowOverwriting: boolean;

    templatesDirectory: string;

    logLevel: ILoggerConfigString;
}

export interface IInitCommandOptions {
    config: boolean;

    type: ISupportedFileTypes;
}
