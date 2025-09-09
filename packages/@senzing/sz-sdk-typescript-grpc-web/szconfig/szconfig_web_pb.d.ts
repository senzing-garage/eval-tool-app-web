import * as jspb from 'google-protobuf'



export class GetDataSourceRegistryRequest extends jspb.Message {
  getConfigDefinition(): string;
  setConfigDefinition(value: string): GetDataSourceRegistryRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDataSourceRegistryRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetDataSourceRegistryRequest): GetDataSourceRegistryRequest.AsObject;
  static serializeBinaryToWriter(message: GetDataSourceRegistryRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDataSourceRegistryRequest;
  static deserializeBinaryFromReader(message: GetDataSourceRegistryRequest, reader: jspb.BinaryReader): GetDataSourceRegistryRequest;
}

export namespace GetDataSourceRegistryRequest {
  export type AsObject = {
    configDefinition: string,
  }
}

export class GetDataSourceRegistryResponse extends jspb.Message {
  getResult(): string;
  setResult(value: string): GetDataSourceRegistryResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDataSourceRegistryResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetDataSourceRegistryResponse): GetDataSourceRegistryResponse.AsObject;
  static serializeBinaryToWriter(message: GetDataSourceRegistryResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDataSourceRegistryResponse;
  static deserializeBinaryFromReader(message: GetDataSourceRegistryResponse, reader: jspb.BinaryReader): GetDataSourceRegistryResponse;
}

export namespace GetDataSourceRegistryResponse {
  export type AsObject = {
    result: string,
  }
}

export class RegisterDataSourceRequest extends jspb.Message {
  getConfigDefinition(): string;
  setConfigDefinition(value: string): RegisterDataSourceRequest;

  getDataSourceCode(): string;
  setDataSourceCode(value: string): RegisterDataSourceRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterDataSourceRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterDataSourceRequest): RegisterDataSourceRequest.AsObject;
  static serializeBinaryToWriter(message: RegisterDataSourceRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterDataSourceRequest;
  static deserializeBinaryFromReader(message: RegisterDataSourceRequest, reader: jspb.BinaryReader): RegisterDataSourceRequest;
}

export namespace RegisterDataSourceRequest {
  export type AsObject = {
    configDefinition: string,
    dataSourceCode: string,
  }
}

export class RegisterDataSourceResponse extends jspb.Message {
  getResult(): string;
  setResult(value: string): RegisterDataSourceResponse;

  getConfigDefinition(): string;
  setConfigDefinition(value: string): RegisterDataSourceResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterDataSourceResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterDataSourceResponse): RegisterDataSourceResponse.AsObject;
  static serializeBinaryToWriter(message: RegisterDataSourceResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterDataSourceResponse;
  static deserializeBinaryFromReader(message: RegisterDataSourceResponse, reader: jspb.BinaryReader): RegisterDataSourceResponse;
}

export namespace RegisterDataSourceResponse {
  export type AsObject = {
    result: string,
    configDefinition: string,
  }
}

export class UnregisterDataSourceRequest extends jspb.Message {
  getConfigDefinition(): string;
  setConfigDefinition(value: string): UnregisterDataSourceRequest;

  getDataSourceCode(): string;
  setDataSourceCode(value: string): UnregisterDataSourceRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnregisterDataSourceRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UnregisterDataSourceRequest): UnregisterDataSourceRequest.AsObject;
  static serializeBinaryToWriter(message: UnregisterDataSourceRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnregisterDataSourceRequest;
  static deserializeBinaryFromReader(message: UnregisterDataSourceRequest, reader: jspb.BinaryReader): UnregisterDataSourceRequest;
}

export namespace UnregisterDataSourceRequest {
  export type AsObject = {
    configDefinition: string,
    dataSourceCode: string,
  }
}

export class UnregisterDataSourceResponse extends jspb.Message {
  getResult(): string;
  setResult(value: string): UnregisterDataSourceResponse;

  getConfigDefinition(): string;
  setConfigDefinition(value: string): UnregisterDataSourceResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnregisterDataSourceResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UnregisterDataSourceResponse): UnregisterDataSourceResponse.AsObject;
  static serializeBinaryToWriter(message: UnregisterDataSourceResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnregisterDataSourceResponse;
  static deserializeBinaryFromReader(message: UnregisterDataSourceResponse, reader: jspb.BinaryReader): UnregisterDataSourceResponse;
}

export namespace UnregisterDataSourceResponse {
  export type AsObject = {
    result: string,
    configDefinition: string,
  }
}

export class VerifyConfigRequest extends jspb.Message {
  getConfigDefinition(): string;
  setConfigDefinition(value: string): VerifyConfigRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VerifyConfigRequest.AsObject;
  static toObject(includeInstance: boolean, msg: VerifyConfigRequest): VerifyConfigRequest.AsObject;
  static serializeBinaryToWriter(message: VerifyConfigRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VerifyConfigRequest;
  static deserializeBinaryFromReader(message: VerifyConfigRequest, reader: jspb.BinaryReader): VerifyConfigRequest;
}

export namespace VerifyConfigRequest {
  export type AsObject = {
    configDefinition: string,
  }
}

export class VerifyConfigResponse extends jspb.Message {
  getResult(): boolean;
  setResult(value: boolean): VerifyConfigResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VerifyConfigResponse.AsObject;
  static toObject(includeInstance: boolean, msg: VerifyConfigResponse): VerifyConfigResponse.AsObject;
  static serializeBinaryToWriter(message: VerifyConfigResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VerifyConfigResponse;
  static deserializeBinaryFromReader(message: VerifyConfigResponse, reader: jspb.BinaryReader): VerifyConfigResponse;
}

export namespace VerifyConfigResponse {
  export type AsObject = {
    result: boolean,
  }
}

