import { describe, expect, it } from 'vitest';
import { Template } from '../template/Template';
import { TemplateEntry } from '../templateEntry/TemplateEntry';
import { TemplateVariable } from '../templateVariable/TemplateVariable';
import { mergeRootConfigTemplatesWithExtractedTemplates } from './mergeRootConfigTemplatesWithExtractedTemplates';

describe('mergeConfigTemplatesWithExtractedTemplates', () => {
    it('should merge two templates with same id', async () => {
        const t1 = new Template({
            id: 'x',
            entries: [
                new TemplateEntry({
                    source: 'path/to/file.ts',
                    content: '$TEST$'
                })
            ],
            variables: [
                new TemplateVariable({
                    name: 'ABC',
                })
            ]
        });
        const t2 = new Template({
            id: 'x',
            entries: [
                new TemplateEntry({
                    source: 'path/to/file.ts',
                    content: '$TEST$'
                })
            ],
            variables: [
                new TemplateVariable({
                    name: 'CBA',
                })
            ]
        });

        const mergedTemplates = mergeRootConfigTemplatesWithExtractedTemplates(
            [t1],
            [t2]
        );
        const [template] = mergedTemplates as [Template];

        expect(template.variables).toHaveLength(2);
    })
});
