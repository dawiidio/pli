import { ITemplateVariable } from '~/templateVariable/ITemplateVariable.js';
import { WithOptional } from '~/common.js';

export interface ITemplateEntry {
    source: string;

    content: string;

    dynamic: boolean;

    destination?: string;

    renderedContent?: string;

    variables?: ITemplateVariable[];

    merge(overrides?: Partial<Pick<ITemplateEntry, 'content' | 'source' | 'variables' | 'renderedContent' | 'destination'>>): ITemplateEntry;
}

export interface ITemplateEntryPropsObject {
    source: string;

    content: string;

    dynamic?: boolean;
}

export type ITemplateEntryProps = WithOptional<ITemplateEntryPropsObject, 'content' | 'dynamic'>
    | ITemplateEntryPropsObject;

