"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SzGrpcWebBase = void 0;
const szGrpcWebEnvironment_1 = require("../szGrpcWebEnvironment");
class SzGrpcWebBase {
    getDeadlineFromNow(secondsFromNow) {
        let retVal = new Date();
        retVal.setSeconds(retVal.getSeconds() + (secondsFromNow ? secondsFromNow : this.grpcConnectionReadyTimeOut));
        return retVal;
    }
    /**
     * This is essentially a polyfill for the "grpcClient.waitForReady" method that does not exist
     * in the `grpc-web` package. This allows the code inheriting this class to be identical in
     * both the `gRPC` and `gRPC-Web` flavors for each class.
     */
    waitForReady(deadline, cb) {
        cb(null);
    }
    constructor(options) {
        /** metadata passed to the request context
         * @ignore
        */
        this._metadata = {};
        this.grpcOptions = szGrpcWebEnvironment_1.DEFAULT_CHANNEL_OPTIONS;
        this.grpcConnectionReadyTimeOut = szGrpcWebEnvironment_1.DEFAULT_CONNECTION_READY_TIMEOUT;
        const { connectionString, credentials, client, grpcOptions, grpcConnectionReadyTimeOut } = options;
        if (grpcConnectionReadyTimeOut) {
            this.grpcConnectionReadyTimeOut = grpcConnectionReadyTimeOut;
        }
    }
}
exports.SzGrpcWebBase = SzGrpcWebBase;
//# sourceMappingURL=szGrpcWebBase.js.map