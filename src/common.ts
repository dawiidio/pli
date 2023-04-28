import { TemplateVariable } from '~/templateVariable/TemplateVariable';
import { assert, setObjectPropertyByPath } from '@dawiidio/tools';
import { Logger, LogLevel } from '@dawiidio/tools/lib/node/Logger/Logger';
import * as process from 'process';
import { IStorage } from '~/storage/IStorage';
import { VariableScope } from '~/variableScope/VariableScope';
import { ITemplateVariable } from '~/templateVariable/ITemplateVariable';
import { renderTreeFromPaths } from '@dawiidio/tools/lib/node/Path/renderTreeFromPaths';

export type { WithRequired, WithOptional } from '@dawiidio/tools';

export const PARENT_EVENTS_PREFIX = 'parent:';

export const CACHE_DIRNAME = '.tmp';
export const DEFAULT_CONFIG_FILENAME = 'pli.config';
export const DEFAULT_TEMPLATES_DIRNAME = 'templates';

export type ISupportedFileTypes = 'ts' | 'js' | 'mjs';

export const DEFAULT_CONFIG_FILENAMES: `${typeof DEFAULT_CONFIG_FILENAME}.${ISupportedFileTypes}`[] = [
    `${DEFAULT_CONFIG_FILENAME}.ts`,
    `${DEFAULT_CONFIG_FILENAME}.js`,
    `${DEFAULT_CONFIG_FILENAME}.mjs`,
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
        /**
         * CWD is builtin variable, and it is reactive variable which means that it will be updated
         * when a parent scope variable changes
         */
        new TemplateVariable({
            name: BuiltinVariables.CWD,
            defaultValue: defaultValues.CWD,
            reactive: true,
        }).pipe((value, variable, scope) => {
            const parentVal = scope.parent?.getVariableValue(variable.name);

            if (!parentVal) {
                return value;
            }

            return `${parentVal}/${value}`;
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

export const removeVariableDuplicates = (variables: ITemplateVariable[]): ITemplateVariable[] => {
    const addedVariables = new Set<string>();

    return variables.filter((variable) => {
        if (addedVariables.has(variable.name)) {
            return false;
        }

        addedVariables.add(variable.name);
        return true;
    });
};

export const checkForVariableDuplicates = (variables: ITemplateVariable[]): ITemplateVariable[] => {
    const addedVariables = new Set<string>();

    return variables.map((variable) => {
        if (addedVariables.has(variable.name)) {
            throw new Error(`Variable ${variable.name} is defined multiple times`);
        }

        addedVariables.add(variable.name);
        return variable;
    });
};

class EnhancedLogger extends Logger {

    error(...args: any[]) {
        this.log(this.stringifyArgs(args), {
            logLevel: LogLevel.error,
        });
    }

    debug(...args: any[]) {
        this.log(this.stringifyArgs(args));
    }

    warn(...args: any[]) {
        this.log(this.stringifyArgs(args), {
            logLevel: LogLevel.warn,
        });
    }

    info(...args: any[]) {
        this.log(this.stringifyArgs(args), {
            logLevel: LogLevel.info,
        });
    }

    private stringifyArgs(args: any[]): string {
        return args.map((val) => JSON.stringify(val).replaceAll('"', '')).join(' ');
    }
}

export const logger = new EnhancedLogger();
