import { IFullConfig } from '~/config/IConfig.js';
import { Template } from '~/template/Template.js';
import { IStorage } from '~/storage/IStorage.js';
import { ITemplate } from '~/template/ITemplate.js';

export const fetchTemplateEntriesContent = async (templates: ITemplate[], storage: IStorage): Promise<void> => {
    const cache = new Map<string, string>();

    await Promise.all(
        templates.map(async (template) => {
            await Promise.all(template.getTemplateEntries().map(async (entry) => {
                if (!entry.content && !entry.dynamic) {
                    if (!cache.has(entry.source)) {
                        cache.set(entry.source, await storage.read(entry.source));
                    }

                    entry.content = cache.get(entry.source) as string;
                }
            }));

            await Promise.all(template.getChildren().map((child) =>
                Template.fetchTemplateEntriesContent(child as Template, storage))
            );
        })
    );
};
