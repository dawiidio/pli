import type { ITemplate } from '~/template/ITemplate.js';

export interface ICliRenderer {
    selectedTemplate: ITemplate | undefined;

    runVariablesUiForSelectedTemplate(): Promise<Record<string, any>>;

    runTemplateSelectionUi(): Promise<ITemplate>
}
