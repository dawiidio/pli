import { getStorage } from '~/storage/getStorage';
import { cwd } from 'node:process';
import { searchForConfigFile } from '~/config/searchForConfigFile';
import {
    BuiltinVariables,
    CACHE_DIRNAME,
    createTreeFromPaths,
    DEFAULT_TEMPLATES_DIRNAME,
    logger,
} from '~/common';
import { extractTemplatesFromDirectory } from '~/config/extractTemplatesFromDirectory';
import { getTemplateEngine } from '~/templateEngine/getTemplateEngine';
import { getTemplatesConfigFromFile } from '~/config/getTemplatesConfigFromFile';
import {
    mergeRootConfigTemplatesWithExtractedTemplates,
} from '~/config/mergeRootConfigTemplatesWithExtractedTemplates';
import { fetchTemplateEntriesContent } from '~/config/fetchTemplateEntriesContent';
import { TemplateTreeRenderer } from '~/templateTreeRenderer/TemplateTreeRenderer';
import { getCliRenderer } from '~/cliRenderer/getCliRenderer';
import { ITemplate } from '~/template/ITemplate';
import { saveRenderOutputToStorage } from '~/template/saveRenderOutputToStorage';
import { IMainCommandOptions } from '~/rootCli/IMainCommandOptions';
import { IFullConfig } from '~/config/IConfig';
import { Logger, ILoggerConfigString } from '@dawiidio/tools/lib/node/Logger/Logger';

export async function main(cliConfig: IMainCommandOptions) {
    if (cliConfig.dry) {
        console.log('\x1b[35m%s\x1b[0m', 'Dry run enabled - changes will not be saved');
    }

    if (cliConfig.logLevel !== 'error') {
        console.log('%s\x1b[35m%s\x1b[0m', 'Log level set to: ', cliConfig.logLevel);
    }

    logger.setLogLevel(Logger.parseLogLevel(cliConfig.logLevel as ILoggerConfigString));

    const storage = getStorage();
    const cwdPath = cwd();
    const templatesConfigFilePath = cliConfig.config
        ? storage.resolve(cliConfig.config)
        : (await searchForConfigFile(storage, cwdPath));

    const templatesDirPath = cliConfig.templatesDirectory || DEFAULT_TEMPLATES_DIRNAME;
    const extractedTemplates = await extractTemplatesFromDirectory(templatesDirPath, storage);
    const templateEngine = getTemplateEngine();

    let userConfig: IFullConfig = {
        templates: [],
    };

    if (templatesConfigFilePath) {
        userConfig = await getTemplatesConfigFromFile(templatesConfigFilePath, storage, {
            cacheDir: storage.resolve(CACHE_DIRNAME),
        });
    }

    const mergedRootTemplates = mergeRootConfigTemplatesWithExtractedTemplates(extractedTemplates, userConfig.templates);
    await fetchTemplateEntriesContent(mergedRootTemplates, storage);

    const templateTreeRenderer = new TemplateTreeRenderer(
        mergedRootTemplates,
        templateEngine,
        storage,
        {
            [BuiltinVariables.CWD]: undefined,
            [BuiltinVariables.TEMPLATES_DIRECTORY]: templatesDirPath,
            [BuiltinVariables.ROOT_CWD]: cwdPath,
        },
    );

    await templateTreeRenderer.collectVariables();

    const cliRenderer = getCliRenderer('cli', templateTreeRenderer);
    await cliRenderer.runTemplateSelectionUi();
    await cliRenderer.runVariablesUiForSelectedTemplate();

    const templateOutput = await templateTreeRenderer.render((cliRenderer.selectedTemplate as ITemplate).id as string);

    if (!cliConfig.dry) {
        await saveRenderOutputToStorage(templateOutput, storage, {
            allowOverwriting: cliConfig.allowOverwriting,
        });
    }

    console.log('Following structure was created inside directory \x1b[32m%s\x1b[0m', cwdPath);
    console.log(createTreeFromPaths(Object.keys(templateOutput), cwdPath, storage).replace('\n', ''));
}
