import { ITemplate } from '~/template/ITemplate';

export const mergeConfigTemplatesWithExtractedTemplates = (configTemplates: ITemplate[], extractedTemplates: ITemplate[]): ITemplate[] => {
    const mergedTemplatesIds = new Set<string>();
    const unmatchedTemplates: ITemplate[] = [];
    const mergedTemplates: ITemplate[] = [];

    for (const template of configTemplates) {
        const matchingExtractedTemplate = extractedTemplates.find(({ id }) => id === template.id);

        if (!matchingExtractedTemplate) {
            unmatchedTemplates.push(template);
            continue;
        }

        mergedTemplates.push(matchingExtractedTemplate.merge(template));
        mergedTemplatesIds.add(template.id as string);
    }

    for (const template of extractedTemplates) {
        if (mergedTemplatesIds.has(template.id as string))
            continue;

        unmatchedTemplates.push(template);
    }

    return [
        ...mergedTemplates,
        ...unmatchedTemplates,
    ];
};
