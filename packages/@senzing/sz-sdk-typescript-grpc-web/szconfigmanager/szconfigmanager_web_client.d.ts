/**
 * @fileoverview gRPC-Web generated client stub for szconfigmanager
 * @enhanceable
 * @public
 */
import * as grpcWeb from 'grpc-web';
import * as szconfigmanager_pb from './szconfigmanager_web_pb';
export declare class SzConfigManagerClient {
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
    methodDescriptorGetConfig: grpcWeb.MethodDescriptor<szconfigmanager_pb.GetConfigRequest, szconfigmanager_pb.GetConfigResponse>;
    getConfig(request: szconfigmanager_pb.GetConfigRequest, metadata?: grpcWeb.Metadata | null): Promise<szconfigmanager_pb.GetConfigResponse>;
    getConfig(request: szconfigmanager_pb.GetConfigRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szconfigmanager_pb.GetConfigResponse) => void): grpcWeb.ClientReadableStream<szconfigmanager_pb.GetConfigResponse>;
    methodDescriptorGetConfigRegistry: grpcWeb.MethodDescriptor<szconfigmanager_pb.GetConfigRegistryRequest, szconfigmanager_pb.GetConfigRegistryResponse>;
    getConfigRegistry(request: szconfigmanager_pb.GetConfigRegistryRequest, metadata?: grpcWeb.Metadata | null): Promise<szconfigmanager_pb.GetConfigRegistryResponse>;
    getConfigRegistry(request: szconfigmanager_pb.GetConfigRegistryRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szconfigmanager_pb.GetConfigRegistryResponse) => void): grpcWeb.ClientReadableStream<szconfigmanager_pb.GetConfigRegistryResponse>;
    methodDescriptorGetDefaultConfigId: grpcWeb.MethodDescriptor<szconfigmanager_pb.GetDefaultConfigIdRequest, szconfigmanager_pb.GetDefaultConfigIdResponse>;
    getDefaultConfigId(request: szconfigmanager_pb.GetDefaultConfigIdRequest, metadata?: grpcWeb.Metadata | null): Promise<szconfigmanager_pb.GetDefaultConfigIdResponse>;
    getDefaultConfigId(request: szconfigmanager_pb.GetDefaultConfigIdRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szconfigmanager_pb.GetDefaultConfigIdResponse) => void): grpcWeb.ClientReadableStream<szconfigmanager_pb.GetDefaultConfigIdResponse>;
    methodDescriptorGetTemplateConfig: grpcWeb.MethodDescriptor<szconfigmanager_pb.GetTemplateConfigRequest, szconfigmanager_pb.GetTemplateConfigResponse>;
    getTemplateConfig(request: szconfigmanager_pb.GetTemplateConfigRequest, metadata?: grpcWeb.Metadata | null): Promise<szconfigmanager_pb.GetTemplateConfigResponse>;
    getTemplateConfig(request: szconfigmanager_pb.GetTemplateConfigRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szconfigmanager_pb.GetTemplateConfigResponse) => void): grpcWeb.ClientReadableStream<szconfigmanager_pb.GetTemplateConfigResponse>;
    methodDescriptorRegisterConfig: grpcWeb.MethodDescriptor<szconfigmanager_pb.RegisterConfigRequest, szconfigmanager_pb.RegisterConfigResponse>;
    registerConfig(request: szconfigmanager_pb.RegisterConfigRequest, metadata?: grpcWeb.Metadata | null): Promise<szconfigmanager_pb.RegisterConfigResponse>;
    registerConfig(request: szconfigmanager_pb.RegisterConfigRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szconfigmanager_pb.RegisterConfigResponse) => void): grpcWeb.ClientReadableStream<szconfigmanager_pb.RegisterConfigResponse>;
    methodDescriptorReplaceDefaultConfigId: grpcWeb.MethodDescriptor<szconfigmanager_pb.ReplaceDefaultConfigIdRequest, szconfigmanager_pb.ReplaceDefaultConfigIdResponse>;
    replaceDefaultConfigId(request: szconfigmanager_pb.ReplaceDefaultConfigIdRequest, metadata?: grpcWeb.Metadata | null): Promise<szconfigmanager_pb.ReplaceDefaultConfigIdResponse>;
    replaceDefaultConfigId(request: szconfigmanager_pb.ReplaceDefaultConfigIdRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szconfigmanager_pb.ReplaceDefaultConfigIdResponse) => void): grpcWeb.ClientReadableStream<szconfigmanager_pb.ReplaceDefaultConfigIdResponse>;
    methodDescriptorSetDefaultConfig: grpcWeb.MethodDescriptor<szconfigmanager_pb.SetDefaultConfigRequest, szconfigmanager_pb.SetDefaultConfigResponse>;
    setDefaultConfig(request: szconfigmanager_pb.SetDefaultConfigRequest, metadata?: grpcWeb.Metadata | null): Promise<szconfigmanager_pb.SetDefaultConfigResponse>;
    setDefaultConfig(request: szconfigmanager_pb.SetDefaultConfigRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szconfigmanager_pb.SetDefaultConfigResponse) => void): grpcWeb.ClientReadableStream<szconfigmanager_pb.SetDefaultConfigResponse>;
    methodDescriptorSetDefaultConfigId: grpcWeb.MethodDescriptor<szconfigmanager_pb.SetDefaultConfigIdRequest, szconfigmanager_pb.SetDefaultConfigIdResponse>;
    setDefaultConfigId(request: szconfigmanager_pb.SetDefaultConfigIdRequest, metadata?: grpcWeb.Metadata | null): Promise<szconfigmanager_pb.SetDefaultConfigIdResponse>;
    setDefaultConfigId(request: szconfigmanager_pb.SetDefaultConfigIdRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szconfigmanager_pb.SetDefaultConfigIdResponse) => void): grpcWeb.ClientReadableStream<szconfigmanager_pb.SetDefaultConfigIdResponse>;
}
