#!/usr/bin/env node
import { getStorage } from '~/storage/getStorage';
import { getTemplateEngine } from '~/templateEngine/getTemplateEngine';
import { getCliRenderer } from '~/cliRenderer/getCliRenderer';
import { getTemplatesConfigFromFile } from '~/config/getTemplatesConfigFromFile';
import { mergeRootConfigTemplatesWithExtractedTemplates } from '~/config/mergeRootConfigTemplatesWithExtractedTemplates';
import { extractTemplatesFromDirectory } from '~/config/extractTemplatesFromDirectory';
import { TemplateTreeRenderer } from '~/templateTreeRenderer/TemplateTreeRenderer';
import { assertAndExit, CACHE_DIRNAME, createTreeFromPaths, BuiltinVariables } from '~/common';
import { cwd } from 'node:process';
import { saveRenderOutputToStorage } from '~/template/saveRenderOutputToStorage';
import { searchForConfigFile } from '~/config/searchForConfigFile';
import { fetchTemplateEntriesContent } from '~/config/fetchTemplateEntriesContent';
import { getRootCliConfig } from '~/config/getRootCliConfig';
import { ITemplate } from '~/template/ITemplate';

async function main() {
    const cliConfig = await getRootCliConfig();

    if (cliConfig.dry) {
        console.log('\x1b[35m%s\x1b[0m', 'Dry run enabled - changes will not be saved');
    }

    const storage = getStorage();
    const cwdPath = cwd();
    const templatesConfigFilePath = cliConfig.config
        ? storage.resolve(cliConfig.config)
        : (await searchForConfigFile(storage, cwdPath));

    assertAndExit<string>(templatesConfigFilePath, 'No config file found');

    const templateEngine = getTemplateEngine();
    const userConfig = await getTemplatesConfigFromFile(templatesConfigFilePath, storage, {
        cacheDir: storage.resolve(CACHE_DIRNAME),
    });
    const templatesDirPath = cliConfig.templatesDirectory || storage.join(cwdPath, userConfig.templatesDir);
    const extractedTemplates = await extractTemplatesFromDirectory(templatesDirPath, storage);
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

main();
