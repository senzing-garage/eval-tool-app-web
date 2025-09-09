import { SzError } from "../senzing/SzError";
export interface SzConfigManager {
    getConfigRegistry(): Promise<string | SzError> | undefined;
    getDefaultConfigId(): Promise<number | SzError> | undefined;
    setDefaultConfigId(configId: number): void;
    replaceDefaultConfigId(currentDefaultConfigId: number, newDefaultConfigId: number): void;
}
