import { IStorage } from '~/storage/IStorage';
import { getStorage } from '~/storage/getStorage';
import { ITemplate } from '~/template/ITemplate';
import { Template } from '~/template/Template';
import { assertAndExit, exitWithError } from '~/common';
import { ITemplateEntry } from '~/templateEntry/ITemplateEntry';
import { TemplateEntry } from '~/templateEntry/TemplateEntry';

export const extractTemplatesFromDirectory = async (templatesPath: string, storage: IStorage = getStorage()): Promise<ITemplate[]> => {
    try {
        await storage.access(templatesPath);
    } catch {
        exitWithError(`Templates directory ${templatesPath} not found. Run 'pli init' to create it.`);
    }

    const paths = await storage.readDir(templatesPath);

    assertAndExit(paths.length, `No templates found in directory ${templatesPath}`);

    const pathsMapping = paths.reduce((acc, path) => {
        const name = storage.splitPath(storage.getRelativePath(templatesPath, path)).shift() as string;

        return {
            ...acc,
            [name]: acc[name] ? [...acc[name], path] : [path],
        };
    }, {} as Record<string, string[]>);

    return Promise.all(Object.entries(pathsMapping).map(async ([id, paths]) => {
        return new Template({
            name: id,
            id,
            entries: await Promise.all(paths.map(async (source): Promise<ITemplateEntry> => {
                const content = await storage.read(source);

                return new TemplateEntry({
                    source,
                    content,
                    dynamic: false
                });
            })),
        });
    }));
};
