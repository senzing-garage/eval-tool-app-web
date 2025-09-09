import * as jspb from 'google-protobuf'



export class GetConfigRequest extends jspb.Message {
  getConfigId(): number;
  setConfigId(value: number): GetConfigRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetConfigRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetConfigRequest): GetConfigRequest.AsObject;
  static serializeBinaryToWriter(message: GetConfigRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetConfigRequest;
  static deserializeBinaryFromReader(message: GetConfigRequest, reader: jspb.BinaryReader): GetConfigRequest;
}

export namespace GetConfigRequest {
  export type AsObject = {
    configId: number,
  }
}

export class GetConfigResponse extends jspb.Message {
  getResult(): string;
  setResult(value: string): GetConfigResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetConfigResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetConfigResponse): GetConfigResponse.AsObject;
  static serializeBinaryToWriter(message: GetConfigResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetConfigResponse;
  static deserializeBinaryFromReader(message: GetConfigResponse, reader: jspb.BinaryReader): GetConfigResponse;
}

export namespace GetConfigResponse {
  export type AsObject = {
    result: string,
  }
}

export class GetConfigRegistryRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetConfigRegistryRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetConfigRegistryRequest): GetConfigRegistryRequest.AsObject;
  static serializeBinaryToWriter(message: GetConfigRegistryRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetConfigRegistryRequest;
  static deserializeBinaryFromReader(message: GetConfigRegistryRequest, reader: jspb.BinaryReader): GetConfigRegistryRequest;
}

export namespace GetConfigRegistryRequest {
  export type AsObject = {
  }
}

export class GetConfigRegistryResponse extends jspb.Message {
  getResult(): string;
  setResult(value: string): GetConfigRegistryResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetConfigRegistryResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetConfigRegistryResponse): GetConfigRegistryResponse.AsObject;
  static serializeBinaryToWriter(message: GetConfigRegistryResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetConfigRegistryResponse;
  static deserializeBinaryFromReader(message: GetConfigRegistryResponse, reader: jspb.BinaryReader): GetConfigRegistryResponse;
}

export namespace GetConfigRegistryResponse {
  export type AsObject = {
    result: string,
  }
}

export class GetDefaultConfigIdRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDefaultConfigIdRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetDefaultConfigIdRequest): GetDefaultConfigIdRequest.AsObject;
  static serializeBinaryToWriter(message: GetDefaultConfigIdRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDefaultConfigIdRequest;
  static deserializeBinaryFromReader(message: GetDefaultConfigIdRequest, reader: jspb.BinaryReader): GetDefaultConfigIdRequest;
}

export namespace GetDefaultConfigIdRequest {
  export type AsObject = {
  }
}

export class GetDefaultConfigIdResponse extends jspb.Message {
  getResult(): number;
  setResult(value: number): GetDefaultConfigIdResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDefaultConfigIdResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetDefaultConfigIdResponse): GetDefaultConfigIdResponse.AsObject;
  static serializeBinaryToWriter(message: GetDefaultConfigIdResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDefaultConfigIdResponse;
  static deserializeBinaryFromReader(message: GetDefaultConfigIdResponse, reader: jspb.BinaryReader): GetDefaultConfigIdResponse;
}

export namespace GetDefaultConfigIdResponse {
  export type AsObject = {
    result: number,
  }
}

export class GetTemplateConfigRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetTemplateConfigRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetTemplateConfigRequest): GetTemplateConfigRequest.AsObject;
  static serializeBinaryToWriter(message: GetTemplateConfigRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetTemplateConfigRequest;
  static deserializeBinaryFromReader(message: GetTemplateConfigRequest, reader: jspb.BinaryReader): GetTemplateConfigRequest;
}

export namespace GetTemplateConfigRequest {
  export type AsObject = {
  }
}

export class GetTemplateConfigResponse extends jspb.Message {
  getResult(): string;
  setResult(value: string): GetTemplateConfigResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetTemplateConfigResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetTemplateConfigResponse): GetTemplateConfigResponse.AsObject;
  static serializeBinaryToWriter(message: GetTemplateConfigResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetTemplateConfigResponse;
  static deserializeBinaryFromReader(message: GetTemplateConfigResponse, reader: jspb.BinaryReader): GetTemplateConfigResponse;
}

export namespace GetTemplateConfigResponse {
  export type AsObject = {
    result: string,
  }
}

export class RegisterConfigRequest extends jspb.Message {
  getConfigDefinition(): string;
  setConfigDefinition(value: string): RegisterConfigRequest;

  getConfigComment(): string;
  setConfigComment(value: string): RegisterConfigRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterConfigRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterConfigRequest): RegisterConfigRequest.AsObject;
  static serializeBinaryToWriter(message: RegisterConfigRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterConfigRequest;
  static deserializeBinaryFromReader(message: RegisterConfigRequest, reader: jspb.BinaryReader): RegisterConfigRequest;
}

export namespace RegisterConfigRequest {
  export type AsObject = {
    configDefinition: string,
    configComment: string,
  }
}

export class RegisterConfigResponse extends jspb.Message {
  getResult(): number;
  setResult(value: number): RegisterConfigResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterConfigResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterConfigResponse): RegisterConfigResponse.AsObject;
  static serializeBinaryToWriter(message: RegisterConfigResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterConfigResponse;
  static deserializeBinaryFromReader(message: RegisterConfigResponse, reader: jspb.BinaryReader): RegisterConfigResponse;
}

export namespace RegisterConfigResponse {
  export type AsObject = {
    result: number,
  }
}

export class ReplaceDefaultConfigIdRequest extends jspb.Message {
  getCurrentDefaultConfigId(): number;
  setCurrentDefaultConfigId(value: number): ReplaceDefaultConfigIdRequest;

  getNewDefaultConfigId(): number;
  setNewDefaultConfigId(value: number): ReplaceDefaultConfigIdRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReplaceDefaultConfigIdRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ReplaceDefaultConfigIdRequest): ReplaceDefaultConfigIdRequest.AsObject;
  static serializeBinaryToWriter(message: ReplaceDefaultConfigIdRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReplaceDefaultConfigIdRequest;
  static deserializeBinaryFromReader(message: ReplaceDefaultConfigIdRequest, reader: jspb.BinaryReader): ReplaceDefaultConfigIdRequest;
}

export namespace ReplaceDefaultConfigIdRequest {
  export type AsObject = {
    currentDefaultConfigId: number,
    newDefaultConfigId: number,
  }
}

export class ReplaceDefaultConfigIdResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReplaceDefaultConfigIdResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ReplaceDefaultConfigIdResponse): ReplaceDefaultConfigIdResponse.AsObject;
  static serializeBinaryToWriter(message: ReplaceDefaultConfigIdResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReplaceDefaultConfigIdResponse;
  static deserializeBinaryFromReader(message: ReplaceDefaultConfigIdResponse, reader: jspb.BinaryReader): ReplaceDefaultConfigIdResponse;
}

export namespace ReplaceDefaultConfigIdResponse {
  export type AsObject = {
  }
}

export class SetDefaultConfigRequest extends jspb.Message {
  getConfigDefinition(): string;
  setConfigDefinition(value: string): SetDefaultConfigRequest;

  getConfigComment(): string;
  setConfigComment(value: string): SetDefaultConfigRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetDefaultConfigRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SetDefaultConfigRequest): SetDefaultConfigRequest.AsObject;
  static serializeBinaryToWriter(message: SetDefaultConfigRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetDefaultConfigRequest;
  static deserializeBinaryFromReader(message: SetDefaultConfigRequest, reader: jspb.BinaryReader): SetDefaultConfigRequest;
}

export namespace SetDefaultConfigRequest {
  export type AsObject = {
    configDefinition: string,
    configComment: string,
  }
}

export class SetDefaultConfigResponse extends jspb.Message {
  getResult(): number;
  setResult(value: number): SetDefaultConfigResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetDefaultConfigResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SetDefaultConfigResponse): SetDefaultConfigResponse.AsObject;
  static serializeBinaryToWriter(message: SetDefaultConfigResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetDefaultConfigResponse;
  static deserializeBinaryFromReader(message: SetDefaultConfigResponse, reader: jspb.BinaryReader): SetDefaultConfigResponse;
}

export namespace SetDefaultConfigResponse {
  export type AsObject = {
    result: number,
  }
}

export class SetDefaultConfigIdRequest extends jspb.Message {
  getConfigId(): number;
  setConfigId(value: number): SetDefaultConfigIdRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetDefaultConfigIdRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SetDefaultConfigIdRequest): SetDefaultConfigIdRequest.AsObject;
  static serializeBinaryToWriter(message: SetDefaultConfigIdRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetDefaultConfigIdRequest;
  static deserializeBinaryFromReader(message: SetDefaultConfigIdRequest, reader: jspb.BinaryReader): SetDefaultConfigIdRequest;
}

export namespace SetDefaultConfigIdRequest {
  export type AsObject = {
    configId: number,
  }
}

export class SetDefaultConfigIdResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetDefaultConfigIdResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SetDefaultConfigIdResponse): SetDefaultConfigIdResponse.AsObject;
  static serializeBinaryToWriter(message: SetDefaultConfigIdResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetDefaultConfigIdResponse;
  static deserializeBinaryFromReader(message: SetDefaultConfigIdResponse, reader: jspb.BinaryReader): SetDefaultConfigIdResponse;
}

export namespace SetDefaultConfigIdResponse {
  export type AsObject = {
  }
}

