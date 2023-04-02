import { TerminalCliRenderer } from '~/cliRenderer/TerminalCliRenderer';
import { ICliRenderer } from '~/cliRenderer/ICliRenderer';
import { TemplateTreeRenderer } from '~/templateTreeRenderer/TemplateTreeRenderer';

export type IRendererType = 'cli';
export const getCliRenderer = (type: IRendererType, templateTreeRenderer: TemplateTreeRenderer): ICliRenderer => {
    switch (type) {
        case 'cli':
            return new TerminalCliRenderer(templateTreeRenderer);
        default:
            throw new Error(`Unknown renderer type "${type}"`);
    }
};
