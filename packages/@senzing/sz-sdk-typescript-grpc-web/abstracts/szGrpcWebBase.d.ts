import * as grpcWeb from 'grpc-web';
import { SzGrpcWebEnvironmentOptions } from '../szGrpcWebEnvironment';
export declare abstract class SzGrpcWebBase {
    /** @ignore */
    abstract client: any;
    /** metadata passed to the request context
     * @ignore
    */
    protected _metadata: grpcWeb.Metadata;
    private grpcOptions;
    grpcConnectionReadyTimeOut: number;
    protected getDeadlineFromNow(secondsFromNow?: number): Date;
    /**
     * This is essentially a polyfill for the "grpcClient.waitForReady" method that does not exist
     * in the `grpc-web` package. This allows the code inheriting this class to be identical in
     * both the `gRPC` and `gRPC-Web` flavors for each class.
     */
    waitForReady(deadline: Date, cb: (error: Error | null) => void): void;
    constructor(options: SzGrpcWebEnvironmentOptions);
}
