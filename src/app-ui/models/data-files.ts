import { SzSdkDataSource } from "@senzing/sz-sdk-components-grpc-web";

//export type SzDataFileCardEvent = SzDataCardEvent<SzDataFile>;
export type SzDataFileCardHighlightType = 'load' | 'resolve' | 'map' | 'mapped' | 'delete' | 'review';

export interface SzDataFileInfo {
    name?: string;
    url?: string;
    format?: string;
    uploadName?: string;
    dataSource?: SzSdkDataSource;
    entityType?: string;
    totalSize?: number;
    timestamp?: Date;
    mappingComplete?: boolean;
}

export class SzDataFile implements SzDataFileInfo {
    id: number;
    configId: number;
    name: string;
    url?: string;
    status?: string;
    format?: string;
    signature?: string;
    uploadName?: string;
    dataSource: SzSdkDataSource;
    entityType?: string;
    totalSize?: number;
    contentReady?: boolean;
    uploadComplete?: boolean;
    processingComplete?: boolean;
    mappingComplete?: boolean;
    resolved?: boolean;
    uploadedByteCount?: number;
    processedByteCount?: number;
    processingRate?: number;
    recordCount?: number;
    badRecordCount?: number;
    processing?: boolean;
    resolving?: boolean;
    loadedRecordCount?: number;
    resolvedRecordCount?: number;
    suppressedRecordCount?: number;
    failedRecordCount?: number;
    resolutionRate?: number;
    purgeRequiredOnDelete?: boolean;
    mappingTemplateKey?: string;
    defaultMapped?: boolean;
    mappingLearned?: boolean;
    reviewRequired?: boolean;
    createdOn?: Date;
    lastModified?: Date;
    timestamp?: Date;
    fields?: SzDataFileField[];
    //recentErrors: SzServerError[];
  
    public static getName(url: string) : string {
      return url.replace(/^.*\/([^\/]+)$/g,"$1");
    }
    public static getPath(url: string) : string {
      return url.substring("file://".length);
    }
}

export interface SzDataFileFieldInfo {
  attributeCode?: string;
  attributeClass?: string;
  grouping?: string;
  autoMapped?: boolean;
  autoAttributeCode?: string;
  autoGrouping?: string;
  mappingLearned?: boolean;
}

export class SzDataFileField implements SzDataFileFieldInfo {
  id: number;
  fileId: number;
  projectId: number;
  name: string;
  rank: number;
  density: number;
  uniqueness: number;
  attributeCode: string;
  attributeClass: string;
  featureClass: string;
  grouping: string;
  defaultMapped: boolean;
  autoMapped: boolean;
  mappingLearned: boolean;
  autoAttributeCode: string;
  autoGrouping: string;
  reviewRequired: boolean;
  reviewAttributeCode: string;
  reviewGrouping: string;
  //topValues: SzTopFieldValue[];
  //outliers: { [ assumedDataType : string ] : SzTopFieldValue[] };
  createdOn: Date;
  lastModified: Date;
}

export class SzDataSourceInfo {
  code?: string;
  description?: string;
}

export class SzDataSource implements SzDataSourceInfo {
  id: number;
  code: string;
  description: string;
  createdOn: Date;
  lastModified: Date;
}

// I have no idea what this is supposed to represent
export interface SzCardData {
  id: number;
  __magicNumber?: number;
}

// status of card data
export interface SzBusyInfo<T extends SzCardData> {
  busy: boolean;
  unavailable: boolean;
  determinate: boolean;
  progressing: boolean;
  buffering: boolean;
  bufferProgress: number;
  bufferRate: number;
  progress: number;
  progressRate: number;
  updatedRecord: T|undefined|null;
}