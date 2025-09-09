import * as grpc from '@grpc/grpc-js';
import { SzGrpcWebConfig } from './szGrpcWebConfig';
import { SzGrpcWebConfigManager } from './szGrpcWebConfigManager';
import { SzGrpcWebDiagnostic } from './szGrpcWebDiagnostic';
import { SzGrpcWebEngine } from './szGrpcWebEngine';
import { SzGrpcWebProduct } from './szGrpcWebProduct';
/** default connection string to initialize with if none provided */
export declare const DEFAULT_CONNECTION_STRING: string;
/** default channel credentials to initialize with if none provided */
export declare const DEFAULT_CREDENTIALS: {};
/** default channel options if none provided
* @see https://github.com/grpc/grpc/blob/618a3f561d4a93f263cca23abad086ed8f4d5e86/include/grpc/impl/codegen/grpc_types.h#L142
*/
export declare const DEFAULT_CHANNEL_OPTIONS: {
    "grpc.keepalive_time_ms": number;
    "grpc.keepalive_timeout_ms": number;
    "grpc.client_idle_timeout_ms": number;
};
/** default time in seconds to wait for connection/reconnection to service(s) */
export declare const DEFAULT_CONNECTION_READY_TIMEOUT = 1;
/** @group SzGrpcEnvironment */
export interface SzGrpcWebEnvironmentOptions {
    /** the grpc connection string. `${HOST}:${PORT}` */
    connectionString?: string;
    /**
     * channel credentials to use for authentication. defaults to "grpc.credentials.createInsecure()"
     * @see https://grpc.io/docs/guides/auth/
     */
    credentials?: {
        [index: string]: string;
    };
    /** @see https://github.com/grpc/grpc/blob/618a3f561d4a93f263cca23abad086ed8f4d5e86/include/grpc/impl/codegen/grpc_types.h#L142 */
    grpcOptions?: grpc.ChannelOptions;
    /**
     * this will be an instance of any of the Senzing grpc client modules generated from the protoc
     * This will be overridden in the derived class with the specific client type that applies to that class
    */
    client?: any;
    /** the amount to wait in seconds before giving up on establishing a connection to the grpc server */
    grpcConnectionReadyTimeOut?: number;
    /** used for CI testing
     * @ignore
    */
    isTestEnvironment?: boolean;
}
/**
 * SzGrpcEnvironment
 * Creates a new Senzing Environment instance for use with creating and calling the gRpc modules
 * and methods.
 * @group SzGrpcEnvironment
 */
export declare class SzGrpcWebEnvironment {
    /**
     * used for telling classes not to use live clients
     * @ignore */
    private isTestEnvironment;
    /**
     * instance of {@link SzGrpcConfig}.
     * autocreated when user calls {@link getConfig} on first attempt.
     * @ignore
    */
    protected _config: SzGrpcWebConfig | undefined;
    /**
     * instance of {@link SzGrpcConfigManager}.
     * autocreated when user calls {@link getConfigManager} on first attempt.
     * @ignore
    */
    protected _configManager: SzGrpcWebConfigManager | undefined;
    /**
     * instance of {@link SzGrpcDiagnostic}.
     * autocreated when user calls {@link getDiagnostic} on first attempt.
     * @ignore
    */
    protected _diagnostic: SzGrpcWebDiagnostic | undefined;
    /**
     * instance of {@link SzGrpcEngine}
     * autocreated when user calls {@link getEngine} on first attempt.
     * @ignore
    */
    protected _engine: SzGrpcWebEngine | undefined;
    /**
     * instance of {@link SzGrpcProduct}.
     * autocreated when user calls {@link getProduct} on first attempt.
     * @ignore
    */
    protected _product: SzGrpcWebProduct | undefined;
    /** the grpc connection string. `${HOST}:${PORT}`
     * @ignore */
    private _connectionString;
    /**
     * channel credentials to use for authentication. defaults to "grpc.credentials.createInsecure()"
     * @see https://grpc.io/docs/guides/auth/
     * @ignore */
    private _credentials;
    /**
     * @see https://github.com/grpc/grpc/blob/618a3f561d4a93f263cca23abad086ed8f4d5e86/include/grpc/impl/codegen/grpc_types.h#L142
     * @ignore
    */
    private _grpcOptions;
    /**
     * instance of the gRPC client used for connecting to services in {@link SzGrpcConfig}.
     * autocreated when user calls {@link getConfig} on first attempt.
     * @ignore
    */
    private _configClient;
    /**
     * instance of the gRPC client used for connecting to services in {@link SzGrpcConfigManager}.
     * autocreated when user calls {@link getConfigManager} on first attempt.
     * @ignore
    */
    private _configManagerClient;
    /**
     * instance of the gRPC client used for connecting to services in {@link SzGrpcDiagnostic}.
     * autocreated when user calls {@link getDiagnostic} on first attempt.
     * @ignore
    */
    private _diagnosticClient;
    /**
     * instance of the gRPC client used for connecting to services in {@link SzGrpcEngine}.
     * autocreated when user calls {@link getEngine} on first attempt.
     * @ignore
    */
    private _engineClient;
    /**
     * instance of the gRPC client used for connecting to services in {@link SzGrpcProduct}.
     * autocreated when user calls {@link getProduct} on first attempt.
     * @ignore
    */
    private _productClient;
    /**
     * Gets the currently active configuration ID for the {@link SzGrpcEnvironment}.
     *
     * @return {Promise<number>} The currently active configuration ID.
    */
    /**
     * instance of {@link SzGrpcConfigManager}.
     * autocreates the class instance on first call if not already created.
     * @return {SzGrpcConfigManager}
    */
    getConfigManager(): SzGrpcWebConfigManager;
    /**
     * instance of {@link SzGrpcDiagnostic}.
     * autocreates the class instance on first call if not already created.
     * @return {SzGrpcDiagnostic}
    */
    getDiagnostic(): SzGrpcWebDiagnostic;
    /**
     * instance of {@link SzGrpcEngine}.
     * autocreates the class instance on first call if not already created.
     * @return {SzGrpcDiagnostic}
    */
    getEngine(): SzGrpcWebEngine;
    /**
     * instance of {@link SzGrpcDiagnostic}.
     * autocreates the class instance on first call if not already created.
     * @return {SzGrpcDiagnostic}
    */
    getProduct(): SzGrpcWebProduct;
    /**
     * the grpc connection string. `${HOST}:${PORT}`
     * @readonly
     */
    get connectionString(): string;
    /**
     * channel credentials to use for authentication. defaults to "grpc.credentials.createInsecure()"
     * @see https://grpc.io/docs/guides/auth/
     * @readonly
     */
    get credentials(): {
        [index: string]: string;
    };
    get grpcOptions(): grpc.ChannelOptions;
    /**
     * getter alias of {@link getConfigManager}.  Syntax sugar for using {@link getConfigManager} as if it were a property ie `MySenzingEnvironment.configManager.getDefaultConfigId()`.
     * @return {SzGrpcConfigManager}
    */
    get configManager(): SzGrpcWebConfigManager;
    /**
     * getter alias of {@link getDiagnostic}.  Syntax sugar for using {@link getDiagnostic} as if it were a property ie `MySenzingEnvironment.diagnostic.getDatastoreInfo()`.
     * @return {SzGrpcDiagnostic}
    */
    get diagnostic(): SzGrpcWebDiagnostic;
    /**
     * getter alias of {@link getEngine}.  Syntax sugar for using {@link getEngine} as if it were a property ie `MySenzingEnvironment.engine.getActiveConfigId()`.
     * @return {SzGrpcEngine}
    */
    get engine(): SzGrpcWebEngine;
    /**
     * getter alias of {@link getProduct}.  Syntax sugar for using {@link getProduct} as if it were a property ie `MySenzingEnvironment.product.getVersion()`.
     * @return {SzGrpcProduct}
    */
    get product(): SzGrpcWebProduct;
    constructor(parameters: SzGrpcWebEnvironmentOptions);
    /**
     * Reinitializes the {@link SzGrpcEngine} with the specified configuration ID.
     * Used by {@link SzGrpcEnvironment}. Not intended to be called directly by end-users.
     *
     * @param configId
     * @ignore
    */
    reinitialize(configId: number): void;
}
