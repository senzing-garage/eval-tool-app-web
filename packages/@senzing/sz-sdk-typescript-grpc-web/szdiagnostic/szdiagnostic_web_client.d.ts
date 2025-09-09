/**
 * @fileoverview gRPC-Web generated client stub for szdiagnostic
 * @enhanceable
 * @public
 */
import * as grpcWeb from 'grpc-web';
import * as szdiagnostic_pb from './szdiagnostic_web_pb';
export declare class SzDiagnosticClient {
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
    methodDescriptorCheckRepositoryPerformance: grpcWeb.MethodDescriptor<szdiagnostic_pb.CheckRepositoryPerformanceRequest, szdiagnostic_pb.CheckRepositoryPerformanceResponse>;
    checkRepositoryPerformance(request: szdiagnostic_pb.CheckRepositoryPerformanceRequest, metadata?: grpcWeb.Metadata | null): Promise<szdiagnostic_pb.CheckRepositoryPerformanceResponse>;
    checkRepositoryPerformance(request: szdiagnostic_pb.CheckRepositoryPerformanceRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szdiagnostic_pb.CheckRepositoryPerformanceResponse) => void): grpcWeb.ClientReadableStream<szdiagnostic_pb.CheckRepositoryPerformanceResponse>;
    methodDescriptorGetFeature: grpcWeb.MethodDescriptor<szdiagnostic_pb.GetFeatureRequest, szdiagnostic_pb.GetFeatureResponse>;
    getFeature(request: szdiagnostic_pb.GetFeatureRequest, metadata?: grpcWeb.Metadata | null): Promise<szdiagnostic_pb.GetFeatureResponse>;
    getFeature(request: szdiagnostic_pb.GetFeatureRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szdiagnostic_pb.GetFeatureResponse) => void): grpcWeb.ClientReadableStream<szdiagnostic_pb.GetFeatureResponse>;
    methodDescriptorGetRepositoryInfo: grpcWeb.MethodDescriptor<szdiagnostic_pb.GetRepositoryInfoRequest, szdiagnostic_pb.GetRepositoryInfoResponse>;
    getRepositoryInfo(request: szdiagnostic_pb.GetRepositoryInfoRequest, metadata?: grpcWeb.Metadata | null): Promise<szdiagnostic_pb.GetRepositoryInfoResponse>;
    getRepositoryInfo(request: szdiagnostic_pb.GetRepositoryInfoRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szdiagnostic_pb.GetRepositoryInfoResponse) => void): grpcWeb.ClientReadableStream<szdiagnostic_pb.GetRepositoryInfoResponse>;
    methodDescriptorPurgeRepository: grpcWeb.MethodDescriptor<szdiagnostic_pb.PurgeRepositoryRequest, szdiagnostic_pb.PurgeRepositoryResponse>;
    purgeRepository(request: szdiagnostic_pb.PurgeRepositoryRequest, metadata?: grpcWeb.Metadata | null): Promise<szdiagnostic_pb.PurgeRepositoryResponse>;
    purgeRepository(request: szdiagnostic_pb.PurgeRepositoryRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szdiagnostic_pb.PurgeRepositoryResponse) => void): grpcWeb.ClientReadableStream<szdiagnostic_pb.PurgeRepositoryResponse>;
    methodDescriptorReinitialize: grpcWeb.MethodDescriptor<szdiagnostic_pb.ReinitializeRequest, szdiagnostic_pb.ReinitializeResponse>;
    reinitialize(request: szdiagnostic_pb.ReinitializeRequest, metadata?: grpcWeb.Metadata | null): Promise<szdiagnostic_pb.ReinitializeResponse>;
    reinitialize(request: szdiagnostic_pb.ReinitializeRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szdiagnostic_pb.ReinitializeResponse) => void): grpcWeb.ClientReadableStream<szdiagnostic_pb.ReinitializeResponse>;
}
