export interface ITemplateEngineContext {
    getVariableValue<T = any>(name: string): T | undefined;
}
