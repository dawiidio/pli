import { ITemplateEngine } from '~/templateEngine/ITemplateEngine';
import { BaseTemplateEngine } from '~/templateEngine/adapters/BaseTemplateEngine';

export type ITemplateEngineType = 'base';

export const getTemplateEngine = (type: ITemplateEngineType = 'base'): ITemplateEngine => {
    switch (type) {
        case 'base':
            return new BaseTemplateEngine();
        default:
            throw new Error(`Unknown template engine type "${type}"`);
    }
}
