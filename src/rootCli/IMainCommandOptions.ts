export interface IMainCommandOptions {
    config: string;

    dry: boolean;

    allowOverwriting: boolean;

    templatesDirectory: string;
}

export interface IInitCommandOptions {
    config: boolean;

    typescript: boolean;
}
