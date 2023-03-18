import { CliRenderer } from '~/renderer/CliRenderer';
import { IRenderer } from '~/renderer/IRenderer';
import { ITemplate } from '~/template/ITemplate';
import { IVariableScope } from '~/variableScope/IVariableScope';

export type IRendererType = 'cli';
export const getRenderer = (type: IRendererType, templateToScopeMapping: Map<ITemplate, IVariableScope>): IRenderer => {
    switch (type) {
        case 'cli':
            return new CliRenderer(templateToScopeMapping);
        default:
            throw new Error(`Unknown renderer type "${type}"`);
    }
}
