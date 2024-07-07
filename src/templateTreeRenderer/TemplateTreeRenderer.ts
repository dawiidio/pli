import { ICollectVariablesResult, ITemplate } from '~/template/ITemplate.js';
import { ITemplateEngine } from '~/templateEngine/ITemplateEngine.js';
import { IStorage } from '~/storage/IStorage.js';
import { createRootScope, BuiltinVariables, ICreateRootScopeArgs } from '~/common.js';
import { IOutputType } from '~/template/Template.js';
import { assert } from '@dawiidio/tools';

export class TemplateTreeRenderer {
    private rootTemplateTreeToTemplateIdMapping = new Map<string, ICollectVariablesResult>();

    private rootBranches: ICollectVariablesResult[] = [];

    constructor(
        public readonly templates: ITemplate[],
        private readonly templateEngine: ITemplateEngine,
        private readonly storage: IStorage,
        private readonly rootScopeDefaults: ICreateRootScopeArgs,
    ) {
    }

    collectVariables(): void {
        this.rootBranches = this.templates.map((template) => {
            const rootScope = createRootScope({
                ...this.rootScopeDefaults,
                [BuiltinVariables.CWD]: this.rootScopeDefaults[BuiltinVariables.CWD],
            });

            const entry = {
                template,
                scope: rootScope,
                children: template.collectVariables(this.templateEngine, this.storage, rootScope),
            };

            this.rootTemplateTreeToTemplateIdMapping.set(template.id as string, entry);

            return entry;
        });
    }

    getBranchForTemplateId(templateId: string): ICollectVariablesResult {
        const branch = this.rootTemplateTreeToTemplateIdMapping.get(templateId);

        assert(branch, `No template found for id ${templateId}`);

        return branch;
    }

    async render(templateId: string): Promise<IOutputType> {
        const root = this.rootTemplateTreeToTemplateIdMapping.get(templateId);

        assert(root, `No template found for id ${templateId}`);

        const recursiveRender = async ({
                                           template,
                                           children,
                                           scope,
                                       }: ICollectVariablesResult, acc: IOutputType): Promise<IOutputType> => {
            const output = scope.isRoot() ? {} : await template.render(this.templateEngine, this.storage, scope);

            const mergedOutputWithAcc = {
                ...acc,
                ...output,
            };

            const childrenOutputs = await Promise.all(children.map((child) => recursiveRender(child, mergedOutputWithAcc)));

            // todo I want to be able to overwrite the output of a child in parent by the same path provided in child
            return childrenOutputs.reduce((childAcc, curr) => ({
                ...childAcc,
                ...curr,
            }), mergedOutputWithAcc);
        };

        return recursiveRender(root, {});
    }
}
