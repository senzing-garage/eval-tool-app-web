/**
 * @fileoverview gRPC-Web generated client stub for szconfig
 * @enhanceable
 * @public
 */
import * as grpcWeb from 'grpc-web';
import * as szconfig_pb from './szconfig_web_pb';
export declare class SzConfigClient {
    client_: grpcWeb.AbstractClientBase;
    hostname_: string;
    credentials_: null | {
        [index: string]: string;
    };
    options_: null | {
        [index: string]: any;
    };
    constructor(hostname: string, credentials?: null | {
        [index: string]: string;
    }, options?: null | {
        [index: string]: any;
    });
    methodDescriptorGetDataSourceRegistry: grpcWeb.MethodDescriptor<szconfig_pb.GetDataSourceRegistryRequest, szconfig_pb.GetDataSourceRegistryResponse>;
    getDataSourceRegistry(request: szconfig_pb.GetDataSourceRegistryRequest, metadata?: grpcWeb.Metadata | null): Promise<szconfig_pb.GetDataSourceRegistryResponse>;
    getDataSourceRegistry(request: szconfig_pb.GetDataSourceRegistryRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szconfig_pb.GetDataSourceRegistryResponse) => void): grpcWeb.ClientReadableStream<szconfig_pb.GetDataSourceRegistryResponse>;
    methodDescriptorRegisterDataSource: grpcWeb.MethodDescriptor<szconfig_pb.RegisterDataSourceRequest, szconfig_pb.RegisterDataSourceResponse>;
    registerDataSource(request: szconfig_pb.RegisterDataSourceRequest, metadata?: grpcWeb.Metadata | null): Promise<szconfig_pb.RegisterDataSourceResponse>;
    registerDataSource(request: szconfig_pb.RegisterDataSourceRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szconfig_pb.RegisterDataSourceResponse) => void): grpcWeb.ClientReadableStream<szconfig_pb.RegisterDataSourceResponse>;
    methodDescriptorUnregisterDataSource: grpcWeb.MethodDescriptor<szconfig_pb.UnregisterDataSourceRequest, szconfig_pb.UnregisterDataSourceResponse>;
    unregisterDataSource(request: szconfig_pb.UnregisterDataSourceRequest, metadata?: grpcWeb.Metadata | null): Promise<szconfig_pb.UnregisterDataSourceResponse>;
    unregisterDataSource(request: szconfig_pb.UnregisterDataSourceRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szconfig_pb.UnregisterDataSourceResponse) => void): grpcWeb.ClientReadableStream<szconfig_pb.UnregisterDataSourceResponse>;
    methodDescriptorVerifyConfig: grpcWeb.MethodDescriptor<szconfig_pb.VerifyConfigRequest, szconfig_pb.VerifyConfigResponse>;
    verifyConfig(request: szconfig_pb.VerifyConfigRequest, metadata?: grpcWeb.Metadata | null): Promise<szconfig_pb.VerifyConfigResponse>;
    verifyConfig(request: szconfig_pb.VerifyConfigRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szconfig_pb.VerifyConfigResponse) => void): grpcWeb.ClientReadableStream<szconfig_pb.VerifyConfigResponse>;
}
