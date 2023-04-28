import { ITemplateVariable } from '~/templateVariable/ITemplateVariable';
import { IBaseTemplateTypes, IOutputType } from '~/template/Template';

export interface ITemplateProps {

    entries?: IBaseTemplateTypes[] | IBaseTemplateTypes;

    outputMapping?: IOutputType;

    /**
     * Below option has no effect on the output directory path if used without
     * calling cliRenderer. CliRenderer after setting everything up will set
     * value from this property to CWD variable in the root scope.
     */
    defaultOutputDirectoryPath?: string;

    variables?: Array<ITemplateVariable>;

    name?: string;

    id: string;
}
