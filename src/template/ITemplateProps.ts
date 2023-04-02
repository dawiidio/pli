import { ITemplateVariable } from '~/templateVariable/ITemplateVariable';
import { IBaseTemplateTypes, IOutputType } from '~/template/Template';

export interface ITemplateProps {

    entries?: IBaseTemplateTypes[] | IBaseTemplateTypes;

    outputMapping?: IOutputType;

    defaultOutputDirectoryPath?: string;

    variables?: Array<ITemplateVariable>;

    name?: string;

    id: string;
}
