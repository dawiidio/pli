import { ITemplateEntry, ITemplateEntryProps } from '~/templateEntry/ITemplateEntry';
import { ITemplateVariable } from '~/templateVariable/ITemplateVariable';

export class TemplateEntry implements ITemplateEntry {
    public readonly source: string;

    public content: string;

    public dynamic: boolean;

    public renderedContent?: string;

    public variables?: ITemplateVariable[];

    constructor({ source, content, dynamic }: ITemplateEntryProps) {
        if (!source) {
            throw new Error(`TemplateEntry must be created with source or both content and source`);
        }

        this.dynamic = Boolean(dynamic);
        this.source = source;

        if (this.dynamic) {
            if (!content) {
                throw new Error(`Dynamic TemplateEntry must have content`);
            }

            this.content = content;
        } else {
            this.content = content || '';
        }
    }

    static isTemplateEntry(predicate: any): predicate is TemplateEntry {
        return predicate instanceof TemplateEntry;
    }

    merge({
              source,
              content,
              renderedContent,
              variables,
              dynamic
          }: Partial<Pick<ITemplateEntry, 'content' | 'source' | 'variables' | 'renderedContent' | 'dynamic'>> = {}): ITemplateEntry {
        const te = new TemplateEntry({
            source: source || this.source,
            content: content || this.content,
            dynamic: dynamic || this.dynamic,
        });

        te.variables = [...(variables || this.variables || [])];
        te.renderedContent = renderedContent || this.renderedContent;

        return te;
    }
}
