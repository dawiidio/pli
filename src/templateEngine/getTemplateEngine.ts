import { ITemplateEngine } from '~/templateEngine/ITemplateEngine.js';
import { BaseTemplateEngine } from '~/templateEngine/adapters/BaseTemplateEngine.js';

export type ITemplateEngineType = 'base';

export const getTemplateEngine = (type: ITemplateEngineType = 'base'): ITemplateEngine => {
    switch (type) {
        case 'base':
            return new BaseTemplateEngine();
        default:
            throw new Error(`Unknown template engine type "${type}"`);
    }
}
