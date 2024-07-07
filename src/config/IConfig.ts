import { ITemplate } from '~/template/ITemplate.js';

export interface IFullConfig {
    templates: ITemplate[],
}

export type IConfig = Partial<IFullConfig>;
