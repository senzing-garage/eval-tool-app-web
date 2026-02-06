"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SzGrpcWebEnvironment = exports.DEFAULT_CONNECTION_READY_TIMEOUT = exports.DEFAULT_CHANNEL_OPTIONS = exports.DEFAULT_CREDENTIALS = exports.DEFAULT_CONNECTION_STRING = void 0;
const szconfig_web_client_1 = require("./szconfig/szconfig_web_client");
const szGrpcWebConfigManager_1 = require("./szGrpcWebConfigManager");
const szconfigmanager_web_client_1 = require("./szconfigmanager/szconfigmanager_web_client");
const szGrpcWebDiagnostic_1 = require("./szGrpcWebDiagnostic");
const szdiagnostic_web_client_1 = require("./szdiagnostic/szdiagnostic_web_client");
const szGrpcWebEngine_1 = require("./szGrpcWebEngine");
const szengine_web_client_1 = require("./szengine/szengine_web_client");
const szGrpcWebProduct_1 = require("./szGrpcWebProduct");
const szproduct_web_client_1 = require("./szproduct/szproduct_web_client");
// -------------- sane defaults for initializing when arguments not provided --------------
/** default connection string to initialize with if none provided */
exports.DEFAULT_CONNECTION_STRING = `0.0.0.0:8261`;
/** default channel credentials to initialize with if none provided */
//export const DEFAULT_CREDENTIALS = grpc.credentials.createInsecure();
exports.DEFAULT_CREDENTIALS = {};
/** default channel options if none provided
* @see https://github.com/grpc/grpc/blob/618a3f561d4a93f263cca23abad086ed8f4d5e86/include/grpc/impl/codegen/grpc_types.h#L142
*/
exports.DEFAULT_CHANNEL_OPTIONS = {
    "grpc.keepalive_time_ms": 1500,
    "grpc.keepalive_timeout_ms": 3000,
    "grpc.client_idle_timeout_ms": 5000
};
/** default time in seconds to wait for connection/reconnection to service(s) */
exports.DEFAULT_CONNECTION_READY_TIMEOUT = 1;
// ----- concrete options with options only accepting the correct type of client
// ----- that matches the class being instantiated
/**
 * SzGrpcEnvironment
 * Creates a new Senzing Environment instance for use with creating and calling the gRpc modules
 * and methods.
 * @group SzGrpcEnvironment
 */
class SzGrpcWebEnvironment extends EventTarget {
    // ----------------------------- lazy getters (read only) ------------------------------
    // --------------------------- will lazy load on first access --------------------------
    /**
     * Gets the currently active configuration ID for the {@link SzGrpcEnvironment}.
     *
     * @return {Promise<number>} The currently active configuration ID.
    */
    /*public getActiveConfigId() {
        return this.engine.getActiveConfigId();
    }*/
    /**
     * instance of {@link SzGrpcConfigManager}.
     * autocreates the class instance on first call if not already created.
     * @return {SzGrpcConfigManager}
    */
    getConfigManager() {
        if (!this._configClient) {
            // create new config grpc client
            if (!this._configClient)
                this._configClient = new szconfig_web_client_1.SzConfigClient(this.connectionString, this.credentials, this._grpcOptions);
        }
        if (!this._configManager || !this._configManagerClient) {
            // create new configManager grpc client
            if (!this._configManagerClient)
                this._configManagerClient = new szconfigmanager_web_client_1.SzConfigManagerClient(this.connectionString, this.credentials, this._grpcOptions);
            // create new config manager with ref to client
            if (!this._configManager)
                this._configManager = new szGrpcWebConfigManager_1.SzGrpcWebConfigManager({ client: this._configManagerClient, configClient: this._configClient, grpcOptions: this._grpcOptions, isTestEnvironment: this.isTestEnvironment });
        }
        return this._configManager;
    }
    /**
     * instance of {@link SzGrpcDiagnostic}.
     * autocreates the class instance on first call if not already created.
     * @return {SzGrpcDiagnostic}
    */
    getDiagnostic() {
        if (!this._diagnostic || !this._diagnosticClient) {
            // create new grpc client
            if (!this._diagnosticClient)
                this._diagnosticClient = new szdiagnostic_web_client_1.SzDiagnosticClient(this.connectionString, this.credentials, this._grpcOptions);
            // create new diagnostic with ref to client
            if (!this._diagnostic)
                this._diagnostic = new szGrpcWebDiagnostic_1.SzGrpcWebDiagnostic({ client: this._diagnosticClient, grpcOptions: this._grpcOptions });
        }
        return this._diagnostic;
    }
    /**
     * instance of {@link SzGrpcEngine}.
     * autocreates the class instance on first call if not already created.
     * @return {SzGrpcDiagnostic}
    */
    getEngine() {
        if (!this._engine || !this._engineClient) {
            // create new grpc client
            if (!this._engineClient)
                this._engineClient = new szengine_web_client_1.SzEngineClient(this.connectionString, this.credentials, this._grpcOptions);
            // create new engine with ref to client
            if (!this._engine)
                this._engine = new szGrpcWebEngine_1.SzGrpcWebEngine({ client: this._engineClient, grpcOptions: this._grpcOptions });
        }
        return this._engine;
    }
    /**
     * instance of {@link SzGrpcDiagnostic}.
     * autocreates the class instance on first call if not already created.
     * @return {SzGrpcDiagnostic}
    */
    getProduct() {
        if (!this._product || !this._productClient) {
            // create new grpc client
            if (!this._productClient)
                this._productClient = new szproduct_web_client_1.SzProductClient(this.connectionString, this.credentials, this._grpcOptions);
            // create new product with ref to client
            if (!this._product)
                this._product = new szGrpcWebProduct_1.SzGrpcWebProduct({ client: this._productClient, grpcOptions: this._grpcOptions });
        }
        return this._product;
    }
    // -------------------------------- start alias getters --------------------------------
    /**
     * the grpc connection string. `${HOST}:${PORT}`
     */
    get connectionString() {
        return this._connectionString;
    }
    /**
     * channel credentials to use for authentication. defaults to "grpc.credentials.createInsecure()"
     * @see https://grpc.io/docs/guides/auth/
     */
    get credentials() {
        return this._credentials;
    }
    /** channel options */
    get grpcOptions() {
        return this._grpcOptions;
    }
    /**
     * the grpc connection string. `${HOST}:${PORT}`
     */
    set connectionString(value) {
        let reInitialize = value !== this._connectionString;
        this._connectionString = value;
        if (reInitialize) {
            this._reinitializeClients();
        }
    }
    /**
     * channel credentials to use for authentication. defaults to "grpc.credentials.createInsecure()"
     * @see https://grpc.io/docs/guides/auth/
     */
    set credentials(value) {
        let reInitialize = value !== this._credentials;
        this._credentials = value;
        if (reInitialize) {
            this._reinitializeClients();
        }
    }
    /** channel options */
    set grpcOptions(value) {
        let reInitialize = value !== this._grpcOptions;
        this._grpcOptions = value;
        if (reInitialize) {
            this._reinitializeClients();
        }
    }
    /**
     * getter alias of {@link getConfigManager}.  Syntax sugar for using {@link getConfigManager} as if it were a property ie `MySenzingEnvironment.configManager.getDefaultConfigId()`.
     * @return {SzGrpcConfigManager}
    */
    get configManager() {
        return this.getConfigManager();
    }
    /**
     * getter alias of {@link getDiagnostic}.  Syntax sugar for using {@link getDiagnostic} as if it were a property ie `MySenzingEnvironment.diagnostic.getDatastoreInfo()`.
     * @return {SzGrpcDiagnostic}
    */
    get diagnostic() {
        return this.getDiagnostic();
    }
    /**
     * getter alias of {@link getEngine}.  Syntax sugar for using {@link getEngine} as if it were a property ie `MySenzingEnvironment.engine.getActiveConfigId()`.
     * @return {SzGrpcEngine}
    */
    get engine() {
        return this.getEngine();
    }
    /**
     * getter alias of {@link getProduct}.  Syntax sugar for using {@link getProduct} as if it were a property ie `MySenzingEnvironment.product.getVersion()`.
     * @return {SzGrpcProduct}
    */
    get product() {
        return this.getProduct();
    }
    // --------------------------------- end alias getters --------------------------------
    constructor(parameters) {
        super(); // the super is a generic "EventTarget" for dispatching events
        /**
         * used for telling classes not to use live clients
         * @ignore */
        this.isTestEnvironment = false;
        // ------------------------------ grpc specific properties -----------------------------
        /** the grpc connection string. `${HOST}:${PORT}`
         * @ignore */
        this._connectionString = exports.DEFAULT_CONNECTION_STRING;
        /**
         * channel credentials to use for authentication. defaults to "grpc.credentials.createInsecure()"
         * @see https://grpc.io/docs/guides/auth/
         * @ignore */
        this._credentials = exports.DEFAULT_CREDENTIALS;
        /**
         * @see https://github.com/grpc/grpc/blob/618a3f561d4a93f263cca23abad086ed8f4d5e86/include/grpc/impl/codegen/grpc_types.h#L142
         * @ignore
        */
        this._grpcOptions = exports.DEFAULT_CHANNEL_OPTIONS;
        // store grpc specific connection params for lazy client init
        // in getters
        const { connectionString, credentials, grpcOptions, isTestEnvironment } = parameters;
        if (connectionString)
            this._connectionString = connectionString;
        if (credentials)
            this._credentials = credentials;
        if (grpcOptions)
            this._grpcOptions = grpcOptions;
        if (isTestEnvironment !== undefined)
            this.isTestEnvironment = isTestEnvironment;
    }
    /**
     * Reinitializes the {@link SzGrpcEngine} with the specified configuration ID.
     * Used by {@link SzGrpcEnvironment}. Not intended to be called directly by end-users.
     *
     * @param configId
     * @ignore
    */
    reinitialize(configId) {
        if (this._diagnostic && this._diagnosticClient) {
            //this._diagnosticClient?.close
            this._diagnostic.reinitialize(configId);
        }
        if (this._engine) {
            this._engine.reinitialize(configId);
        }
        /*
        if(!this._engine) {
            throw new Error(`no engine instance to reinitialize`);
        }
        if(!this._diagnostic) {
            throw new Error(`no diagnostic instance to reinitialize`);
        }*/
    }
    /**
     * reinitializes clients if connection properties have changed.
     * @internal
     */
    _reinitializeClients() {
        let anythingChanged = false;
        if (this._configClient) {
            try {
                delete this._configClient;
            }
            catch (err) { }
            this._configClient = new szconfig_web_client_1.SzConfigClient(this.connectionString, this.credentials, this._grpcOptions);
            anythingChanged = true;
        }
        if (this._configManagerClient) {
            try {
                delete this._configManagerClient;
            }
            catch (err) { }
            this._configManagerClient = new szconfigmanager_web_client_1.SzConfigManagerClient(this.connectionString, this.credentials, this._grpcOptions);
            anythingChanged = true;
        }
        if (this._configManager && this._configManagerClient) {
            this._configManager = new szGrpcWebConfigManager_1.SzGrpcWebConfigManager({ client: this._configManagerClient, configClient: this._configClient, grpcOptions: this._grpcOptions, isTestEnvironment: this.isTestEnvironment });
            anythingChanged = true;
        }
        if (this._diagnosticClient) {
            try {
                delete this._diagnosticClient;
            }
            catch (err) { }
            this._diagnosticClient = new szdiagnostic_web_client_1.SzDiagnosticClient(this.connectionString, this.credentials, this._grpcOptions);
            anythingChanged = true;
        }
        if (this._diagnostic && this._diagnosticClient) {
            this._diagnostic = new szGrpcWebDiagnostic_1.SzGrpcWebDiagnostic({ client: this._diagnosticClient, grpcOptions: this._grpcOptions });
            anythingChanged = true;
        }
        if (this._engineClient) {
            try {
                delete this._engineClient;
            }
            catch (err) { }
            this._engineClient = new szengine_web_client_1.SzEngineClient(this.connectionString, this.credentials, this._grpcOptions);
            anythingChanged = true;
        }
        if (this._diagnostic && this._engineClient) {
            this._engine = new szGrpcWebEngine_1.SzGrpcWebEngine({ client: this._engineClient, grpcOptions: this._grpcOptions });
            anythingChanged = true;
        }
        if (this._productClient) {
            try {
                delete this._productClient;
            }
            catch (err) { }
            this._productClient = new szproduct_web_client_1.SzProductClient(this.connectionString, this.credentials, this._grpcOptions);
            anythingChanged = true;
        }
        if (this._product && this._productClient) {
            this._product = new szGrpcWebProduct_1.SzGrpcWebProduct({ client: this._productClient, grpcOptions: this._grpcOptions });
            anythingChanged = true;
        }
        if (anythingChanged) {
            this.dispatchEvent(SzGrpcWebEnvironment.connectivityChange);
        }
    }
}
exports.SzGrpcWebEnvironment = SzGrpcWebEnvironment;
// events to dispatch on status change
SzGrpcWebEnvironment.initialized = new Event('initialized');
SzGrpcWebEnvironment.connectivityChange = new Event('connectivityChange');
SzGrpcWebEnvironment.onException = new Event('onException');
//# sourceMappingURL=szGrpcWebEnvironment.js.map