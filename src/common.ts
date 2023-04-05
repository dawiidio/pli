import { TemplateVariable } from '~/templateVariable/TemplateVariable';
import { assert, setObjectPropertyByPath } from '@dawiidio/tools';
import * as process from 'process';
import { IStorage } from '~/storage/IStorage';
import { VariableScope } from '~/variableScope/VariableScope';
import { ITemplateVariable } from '~/templateVariable/ITemplateVariable';

export type { WithRequired, WithOptional } from '@dawiidio/tools';

export const PARENT_EVENTS_PREFIX = 'parent:';

export const CACHE_DIRNAME = '.tmp';
export const DEFAULT_CONFIG_FILENAME = 'pli.config';
export const DEFAULT_TEMPLATES_DIRNAME = 'templates';

export const DEFAULT_CONFIG_FILENAMES = [
    `${DEFAULT_CONFIG_FILENAME}.ts`,
    `${DEFAULT_CONFIG_FILENAME}.js`,
];

export enum BuiltinVariables {
    CWD = 'CWD',
    ROOT_CWD = 'ROOT_CWD',
    TEMPLATES_DIRECTORY = 'TEMPLATES_DIRECTORY'
}

export type ICreateRootScopeArgs = Record<BuiltinVariables, any>;

export const createRootScope = (defaultValues: ICreateRootScopeArgs) => {
    const root = new VariableScope();

    root.bulkRegisterVariables([
        new TemplateVariable({
            name: BuiltinVariables.CWD,
            defaultValue: defaultValues.CWD,
        }),
        new TemplateVariable({
            name: BuiltinVariables.ROOT_CWD,
            defaultValue: defaultValues.ROOT_CWD,
            readonly: true,
            ui: {
                hidden: true,
            },
        }),
        new TemplateVariable({
            name: BuiltinVariables.TEMPLATES_DIRECTORY,
            defaultValue: defaultValues.TEMPLATES_DIRECTORY,
            readonly: true,
            ui: {
                hidden: true,
            },
        }),
    ]);

    return root;
};

export const exitWithError = (err: string | Error) => {
    console.error(err);
    process.exit(1);
};

export function assertAndExit<T = any>(value: any, message?: string): asserts value is NonNullable<T> {
    try {
        assert<T>(value, message);
    } catch (err) {
        exitWithError(err instanceof Error ? err.message : (err as string));
    }
}

export const createTreeFromPaths = (paths: string[], basePath: string, storage: IStorage): string => {
    let accObj: Record<string, any> = {};

    for (const path of paths) {
        const shortenedPath = path.replace(basePath, '');
        accObj = {
            ...accObj,
            ...setObjectPropertyByPath(accObj, storage.splitPath(shortenedPath), 1),
        };
    }

    const childSign = '├─ ';
    const levelSign = '│  ';

    const logger = (obj: Record<string, any>, currentPath: string = '', lvl = 0): string => {
        return Object.entries(obj).reduce((acc, [key, val]) => {
            const directory = typeof val === 'object';

            if (!lvl) {
                return acc + logger(val, currentPath, lvl + 1);
            }

            return directory
                ? `${acc}\n${currentPath}${childSign}${key}/${logger(val, currentPath + levelSign, lvl + 1)}`
                : `${acc}\n${currentPath}${childSign}${key}`;
        }, '');
    };

    return logger(accObj);
};

export const removeVariableDuplicates = (variables: ITemplateVariable[]): ITemplateVariable[] => {
    const addedVariables = new Set<string>();

    return variables.filter((variable) => {
        if (addedVariables.has(variable.name)) {
            return false;
        }

        addedVariables.add(variable.name);
        return true;
    });
}

export const checkForVariableDuplicates = (variables: ITemplateVariable[]): ITemplateVariable[] => {
    const addedVariables = new Set<string>();

    return variables.map((variable) => {
        if (addedVariables.has(variable.name)) {
            throw new Error(`Variable ${variable.name} is defined multiple times`);
        }

        addedVariables.add(variable.name);
        return variable;
    });
}
