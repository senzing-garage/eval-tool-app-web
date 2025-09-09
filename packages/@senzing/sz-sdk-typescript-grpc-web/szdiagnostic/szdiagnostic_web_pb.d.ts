import * as jspb from 'google-protobuf'



export class CheckRepositoryPerformanceRequest extends jspb.Message {
  getSecondsToRun(): number;
  setSecondsToRun(value: number): CheckRepositoryPerformanceRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CheckRepositoryPerformanceRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CheckRepositoryPerformanceRequest): CheckRepositoryPerformanceRequest.AsObject;
  static serializeBinaryToWriter(message: CheckRepositoryPerformanceRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CheckRepositoryPerformanceRequest;
  static deserializeBinaryFromReader(message: CheckRepositoryPerformanceRequest, reader: jspb.BinaryReader): CheckRepositoryPerformanceRequest;
}

export namespace CheckRepositoryPerformanceRequest {
  export type AsObject = {
    secondsToRun: number,
  }
}

export class CheckRepositoryPerformanceResponse extends jspb.Message {
  getResult(): string;
  setResult(value: string): CheckRepositoryPerformanceResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CheckRepositoryPerformanceResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CheckRepositoryPerformanceResponse): CheckRepositoryPerformanceResponse.AsObject;
  static serializeBinaryToWriter(message: CheckRepositoryPerformanceResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CheckRepositoryPerformanceResponse;
  static deserializeBinaryFromReader(message: CheckRepositoryPerformanceResponse, reader: jspb.BinaryReader): CheckRepositoryPerformanceResponse;
}

export namespace CheckRepositoryPerformanceResponse {
  export type AsObject = {
    result: string,
  }
}

export class GetRepositoryInfoRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetRepositoryInfoRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetRepositoryInfoRequest): GetRepositoryInfoRequest.AsObject;
  static serializeBinaryToWriter(message: GetRepositoryInfoRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetRepositoryInfoRequest;
  static deserializeBinaryFromReader(message: GetRepositoryInfoRequest, reader: jspb.BinaryReader): GetRepositoryInfoRequest;
}

export namespace GetRepositoryInfoRequest {
  export type AsObject = {
  }
}

export class GetRepositoryInfoResponse extends jspb.Message {
  getResult(): string;
  setResult(value: string): GetRepositoryInfoResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetRepositoryInfoResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetRepositoryInfoResponse): GetRepositoryInfoResponse.AsObject;
  static serializeBinaryToWriter(message: GetRepositoryInfoResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetRepositoryInfoResponse;
  static deserializeBinaryFromReader(message: GetRepositoryInfoResponse, reader: jspb.BinaryReader): GetRepositoryInfoResponse;
}

export namespace GetRepositoryInfoResponse {
  export type AsObject = {
    result: string,
  }
}

export class GetFeatureRequest extends jspb.Message {
  getFeatureId(): number;
  setFeatureId(value: number): GetFeatureRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetFeatureRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetFeatureRequest): GetFeatureRequest.AsObject;
  static serializeBinaryToWriter(message: GetFeatureRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetFeatureRequest;
  static deserializeBinaryFromReader(message: GetFeatureRequest, reader: jspb.BinaryReader): GetFeatureRequest;
}

export namespace GetFeatureRequest {
  export type AsObject = {
    featureId: number,
  }
}

export class GetFeatureResponse extends jspb.Message {
  getResult(): string;
  setResult(value: string): GetFeatureResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetFeatureResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetFeatureResponse): GetFeatureResponse.AsObject;
  static serializeBinaryToWriter(message: GetFeatureResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetFeatureResponse;
  static deserializeBinaryFromReader(message: GetFeatureResponse, reader: jspb.BinaryReader): GetFeatureResponse;
}

export namespace GetFeatureResponse {
  export type AsObject = {
    result: string,
  }
}

export class PurgeRepositoryRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PurgeRepositoryRequest.AsObject;
  static toObject(includeInstance: boolean, msg: PurgeRepositoryRequest): PurgeRepositoryRequest.AsObject;
  static serializeBinaryToWriter(message: PurgeRepositoryRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PurgeRepositoryRequest;
  static deserializeBinaryFromReader(message: PurgeRepositoryRequest, reader: jspb.BinaryReader): PurgeRepositoryRequest;
}

export namespace PurgeRepositoryRequest {
  export type AsObject = {
  }
}

export class PurgeRepositoryResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PurgeRepositoryResponse.AsObject;
  static toObject(includeInstance: boolean, msg: PurgeRepositoryResponse): PurgeRepositoryResponse.AsObject;
  static serializeBinaryToWriter(message: PurgeRepositoryResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PurgeRepositoryResponse;
  static deserializeBinaryFromReader(message: PurgeRepositoryResponse, reader: jspb.BinaryReader): PurgeRepositoryResponse;
}

export namespace PurgeRepositoryResponse {
  export type AsObject = {
  }
}

export class ReinitializeRequest extends jspb.Message {
  getConfigId(): number;
  setConfigId(value: number): ReinitializeRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReinitializeRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ReinitializeRequest): ReinitializeRequest.AsObject;
  static serializeBinaryToWriter(message: ReinitializeRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReinitializeRequest;
  static deserializeBinaryFromReader(message: ReinitializeRequest, reader: jspb.BinaryReader): ReinitializeRequest;
}

export namespace ReinitializeRequest {
  export type AsObject = {
    configId: number,
  }
}

export class ReinitializeResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReinitializeResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ReinitializeResponse): ReinitializeResponse.AsObject;
  static serializeBinaryToWriter(message: ReinitializeResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReinitializeResponse;
  static deserializeBinaryFromReader(message: ReinitializeResponse, reader: jspb.BinaryReader): ReinitializeResponse;
}

export namespace ReinitializeResponse {
  export type AsObject = {
  }
}

