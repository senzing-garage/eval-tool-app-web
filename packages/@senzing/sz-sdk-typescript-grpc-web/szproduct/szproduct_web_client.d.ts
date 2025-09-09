/**
 * @fileoverview gRPC-Web generated client stub for szproduct
 * @enhanceable
 * @public
 */
import * as grpcWeb from 'grpc-web';
import * as szproduct_pb from './szproduct_web_pb';
export declare class SzProductClient {
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
    methodDescriptorGetLicense: grpcWeb.MethodDescriptor<szproduct_pb.GetLicenseRequest, szproduct_pb.GetLicenseResponse>;
    getLicense(request: szproduct_pb.GetLicenseRequest, metadata?: grpcWeb.Metadata | null): Promise<szproduct_pb.GetLicenseResponse>;
    getLicense(request: szproduct_pb.GetLicenseRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szproduct_pb.GetLicenseResponse) => void): grpcWeb.ClientReadableStream<szproduct_pb.GetLicenseResponse>;
    methodDescriptorGetVersion: grpcWeb.MethodDescriptor<szproduct_pb.GetVersionRequest, szproduct_pb.GetVersionResponse>;
    getVersion(request: szproduct_pb.GetVersionRequest, metadata?: grpcWeb.Metadata | null): Promise<szproduct_pb.GetVersionResponse>;
    getVersion(request: szproduct_pb.GetVersionRequest, metadata: grpcWeb.Metadata | null, callback: (err: grpcWeb.RpcError, response: szproduct_pb.GetVersionResponse) => void): grpcWeb.ClientReadableStream<szproduct_pb.GetVersionResponse>;
}
