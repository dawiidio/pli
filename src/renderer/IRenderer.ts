import { ITemplate } from '~/template/ITemplate';

export interface IRenderer {
    runVariablesUi(selectedTemplate: ITemplate): Promise<Record<string, any>>;

    runTemplateSelectionUi(): Promise<ITemplate>
}
