import { ITemplate } from '~/template/ITemplate';

export interface IFullConfig {
    templates: ITemplate[],
}

export type IConfig = Partial<IFullConfig>;
