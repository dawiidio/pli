import { ITemplate } from '~/template/ITemplate';

export interface ICliRenderer {
    selectedTemplate: ITemplate | undefined;

    runVariablesUiForSelectedTemplate(): Promise<Record<string, any>>;

    runTemplateSelectionUi(): Promise<ITemplate>
}
