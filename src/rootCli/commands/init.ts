import { getStorage } from '~/storage/getStorage';
import process from 'process';
import { initConfigFile } from '~/config/initConfigFile';
import { DEFAULT_TEMPLATES_DIRNAME } from '~/common';
import { initTemplatesDirectory } from '~/config/initTemplatesDirectory';
import { IInitCommandOptions } from '~/rootCli/IMainCommandOptions';

export async function init(argv: IInitCommandOptions) {
    // todo refactor below function as well as initConfigFile and initTemplatesDirectory because it looks messy
    const storage = getStorage('fs');
    const type = argv.type;
    const cwd = process.cwd();

    if (argv.config) {
        try {
            console.log(`Config file created in ${await initConfigFile(cwd, type, storage)}`);
        }
        catch {
            console.log('Config file already exists');
        }
    }

    try {
        await storage.access(storage.join(cwd, DEFAULT_TEMPLATES_DIRNAME));
    } catch (e) {
        console.log(`Templates directory created in ${await initTemplatesDirectory(cwd, type, storage)}`);
    }

    console.log('All set - you are ready to go!');
    process.exit(0);
}
