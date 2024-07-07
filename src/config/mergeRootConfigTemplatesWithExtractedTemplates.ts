import { ITemplate } from '~/template/ITemplate.js';
import { mergeArrays } from '@dawiidio/tools';

export const mergeRootConfigTemplatesWithExtractedTemplates = (configTemplates: ITemplate[], extractedTemplates: ITemplate[]): ITemplate[] => {
    const mergedRoots = mergeArrays<ITemplate>(configTemplates, extractedTemplates, {
        merge: (entry1, entry2) => entry1.merge(entry2),
        findIndex: (entry1, entry2) => entry1.id === entry2.id
    });

    // todo this works only for one level of nesting, we need to make it recursive
    const replaceOldChildInstances = (template: ITemplate) => {
        template.setChildren(template.getChildren().map((child) => {
            const newChild = mergedRoots.find((t) => t.id === child.id);

            if (!newChild)
                return child;

            return newChild;
        }));
    }

    mergedRoots.forEach(replaceOldChildInstances);

    return mergedRoots;
};
