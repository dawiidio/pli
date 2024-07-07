import { getStorage } from '~/storage/getStorage.js';
import { cwd } from 'node:process';
import { searchForConfigFile } from '~/config/searchForConfigFile.js';
import { BuiltinVariables, CACHE_DIRNAME, DEFAULT_TEMPLATES_DIRNAME, logger } from '~/common.js';
import { extractTemplatesFromDirectory } from '~/config/extractTemplatesFromDirectory.js';
import { getTemplateEngine } from '~/templateEngine/getTemplateEngine.js';
import { getTemplatesConfigFromFile } from '~/config/getTemplatesConfigFromFile.js';
import {
    mergeRootConfigTemplatesWithExtractedTemplates,
} from '~/config/mergeRootConfigTemplatesWithExtractedTemplates.js';
import { fetchTemplateEntriesContent } from '~/config/fetchTemplateEntriesContent.js';
import { TemplateTreeRenderer } from '~/templateTreeRenderer/TemplateTreeRenderer.js';
import { getCliRenderer } from '~/cliRenderer/getCliRenderer.js';
import { ITemplate } from '~/template/ITemplate.js';
import { saveRenderOutputToStorage } from '~/template/saveRenderOutputToStorage.js';
import { IMainCommandOptions } from '~/rootCli/IMainCommandOptions.js';
import { IFullConfig } from '~/config/IConfig.js';
import { ILoggerConfigString, Logger } from '@dawiidio/tools/lib/node/Logger/Logger.js';
import { renderTreeFromPaths } from '@dawiidio/tools/lib/node/Path/renderTreeFromPaths.js';

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
    console.log(renderTreeFromPaths(Object.keys(templateOutput), cwdPath).replace('\n', ''));
}
