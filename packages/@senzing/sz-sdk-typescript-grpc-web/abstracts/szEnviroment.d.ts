import { SzProduct } from "./szProduct";
import { SzConfigManager } from "./szConfigManager";
import { SzDiagnostic } from "./szDiagnostic";
import { SzEngine } from "./szEngine";
export interface SzEnvironmentOptions {
}
export declare abstract class SzEnvironmentOptions {
}
export declare abstract class SzEnvironment {
    protected abstract _configManager: SzConfigManager | undefined;
    protected abstract _diagnostic: SzDiagnostic | undefined;
    protected abstract _engine: SzEngine | undefined;
    protected abstract _product: SzProduct | undefined;
    abstract getConfigManager(): SzConfigManager;
    abstract getDiagnostic(): SzDiagnostic;
    abstract getEngine(): SzEngine;
    abstract getProduct(): SzProduct;
    constructor(parameters: SzEnvironmentOptions);
}
