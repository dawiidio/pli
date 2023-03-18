import { ITemplate } from '~/template/ITemplate';

export interface IFullConfig {
    templatesDir: string,

    templates: ITemplate[],
}

export type IConfig = Partial<IFullConfig>;
