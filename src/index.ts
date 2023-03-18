#!/usr/bin/env node
import { getStorage } from '~/storage/getStorage';
import { getTemplateEngine } from '~/templateEngine/getTemplateEngine';
import { getRenderer } from '~/renderer/getRenderer';
import { getConfigFromFile } from '~/config/getConfigFromFile';
import { mergeConfigTemplatesWithExtractedTemplates } from '~/config/mergeConfigTemplatesWithExtractedTemplates';
import { extractTemplatesFromDirectory } from '~/config/extractTemplatesFromDirectory';
import { createVariableScopesForTemplates } from '~/config/createVariableScopesForTemplates';
import { assertAndExit, CACHE_DIRNAME, createRootScope, createTreeFromPaths, GlobalBuiltinVariables } from '~/common';
import { argv, cwd } from 'node:process';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { Argv } from 'yargs';
import { saveRenderOutputToStorage } from '~/template/saveRenderOutputToStorage';
import { searchForConfigFile } from '~/config/searchForConfigFile';

interface ICliOptions {
    config: string;

    dry: boolean;

    allowOverwriting: boolean;

    templatesDirectory: string;
}

const DEFAULT_CLI_OPTIONS: Partial<ICliOptions> = {
    dry: false,
    allowOverwriting: false,
};

const getCliConfig = (): Partial<ICliOptions> => {
    const cliOptions = (yargs(hideBin(argv)) as Argv<ICliOptions>)
        .scriptName('pli')
        .options('config', {
            alias: 'c',
            type: 'string',
            description: 'relative path to config file',
        })
        .options('dry', {
            alias: 'd',
            type: 'boolean',
            description: 'dry run, results will not be saved',
        })
        .options('allowOverwriting', {
            alias: 'o',
            type: 'boolean',
            description: 'allow overwriting output files while committing data to storage',
        })
        .options('templatesDirectory', {
            alias: 't',
            type: 'boolean',
            description: 'allow overwriting output files while committing data to storage',
        })
        .parse() as unknown as Partial<ICliOptions>;

    return {
        ...DEFAULT_CLI_OPTIONS,
        ...cliOptions,
    };
};

async function main() {
    const cliConfig = await getCliConfig();
    const storage = getStorage();
    const cwdPath = cwd();
    const templatesConfigFilePath = cliConfig.config
        ? storage.resolve(cliConfig.config)
        : (await searchForConfigFile(storage, cwdPath));

    assertAndExit<string>(templatesConfigFilePath, 'No config file found');

    const templateEngine = getTemplateEngine();
    const userConfig = await getConfigFromFile(templatesConfigFilePath, storage, {
        cacheDir: storage.resolve(CACHE_DIRNAME),
    });
    const templatesDirPath = cliConfig.templatesDirectory || storage.join(cwdPath, userConfig.templatesDir);
    const rootScope = createRootScope({
        // cwd is later overwritten, if needed, in each template collectVariables method call, this is how we can preserve templates structure
        [GlobalBuiltinVariables.CWD]: '',
        [GlobalBuiltinVariables.TEMPLATES_DIRECTORY]: templatesDirPath,
        [GlobalBuiltinVariables.ROOT_CWD]: cwdPath,
    });

    const extractedTemplates = await extractTemplatesFromDirectory(templatesDirPath, storage);
    const mergedTemplates = mergeConfigTemplatesWithExtractedTemplates(userConfig.templates, extractedTemplates);
    const templateToScopeMapping = await createVariableScopesForTemplates(mergedTemplates, templateEngine, storage, rootScope);
    const renderer = getRenderer('cli', templateToScopeMapping);

    const selectedTemplate = await renderer.runTemplateSelectionUi();

    await renderer.runVariablesUi(selectedTemplate);

    const templateOutput = await selectedTemplate.render(
        templateEngine,
        storage,
        templateToScopeMapping,
    );

    if (!cliConfig.dry) {
        await saveRenderOutputToStorage(templateOutput, storage, {
            allowOverwriting: cliConfig.allowOverwriting,
        });
    }

    console.log('Inside directory \x1b[32m%s\x1b[0m the following structure was created', cwdPath);
    console.log(createTreeFromPaths(Object.keys(templateOutput), cwdPath, storage).replace('\n', ''));
}

main();
