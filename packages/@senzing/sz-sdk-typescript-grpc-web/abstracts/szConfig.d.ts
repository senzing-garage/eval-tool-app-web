import { ServiceError } from "@grpc/grpc-js";
import { SzError } from "../senzing/SzError";
export interface SzConfig {
    definition: string;
    registerDataSource(dataSourceCode: string): Promise<string | SzError>;
    unregisterDataSource(dataSourceCode: string): Promise<any | SzError>;
    getDataSourceRegistry(): Promise<any | ServiceError>;
    verifyConfig(): Promise<any | ServiceError>;
}
