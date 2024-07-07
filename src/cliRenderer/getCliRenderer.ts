import { TerminalCliRenderer } from '~/cliRenderer/TerminalCliRenderer.js';
import { ICliRenderer } from '~/cliRenderer/ICliRenderer.js';
import { TemplateTreeRenderer } from '~/templateTreeRenderer/TemplateTreeRenderer.js';

export type IRendererType = 'cli';
export const getCliRenderer = (type: IRendererType, templateTreeRenderer: TemplateTreeRenderer): ICliRenderer => {
    switch (type) {
        case 'cli':
            return new TerminalCliRenderer(templateTreeRenderer);
        default:
            throw new Error(`Unknown renderer type "${type}"`);
    }
};
