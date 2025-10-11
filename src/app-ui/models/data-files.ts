import { SzSdkDataSource } from "@senzing/eval-tool-ui-common";

//export type SzDataFileCardEvent = SzDataCardEvent<SzDataFile>;
export type SzDataFileCardHighlightType = 'load' | 'rename' | 'resume' | 'resolve' | 'map' | 'mapped' | 'delete' | 'review' | 'errors';
export const SzDataFileCardHighlightType = {
  'load': 'load' as SzDataFileCardHighlightType,
  'rename': 'rename' as SzDataFileCardHighlightType,
  'resume': 'resume' as SzDataFileCardHighlightType,
  'resolve': 'resolve' as SzDataFileCardHighlightType,
  'map': 'map' as SzDataFileCardHighlightType,
  'mapped': 'mapped' as SzDataFileCardHighlightType,
  'delete': 'delete' as SzDataFileCardHighlightType,
  'review': 'review' as SzDataFileCardHighlightType,
  'errors': 'errors' as SzDataFileCardHighlightType
}

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
    id?: number;
    badRecordCount?: number;
    canBePaused?: boolean;
    characterEncoding?: string;
    configId: number;
    contentReady?: boolean;
    createdOn?: Date;
    //dataSource: SzSdkDataSource;
    dataSources?: SzDataFileDataSource[] 
    defaultMapped?: boolean;
    entityType?: string;
    failedRecordCount?: number;
    fields?: SzDataFileField[];
    format?: string;
    lastModified?: Date;
    loadedRecordCount?: number;
    mappingComplete?: boolean;
    mappingLearned?: boolean;
    mappingTemplateKey?: string;
    mediaType?: string;
    name: string;
    processingComplete?: boolean;
    processedByteCount?: number;
    processedRecordCount?: number;
    processingRate?: number;
    processing?: boolean;
    purgeRequiredOnDelete?: boolean;
    recordCount?: number;
    registering?: boolean;
    resolutionRate?: number;
    resolved?: boolean;
    resolving?: boolean;
    resolvedRecordCount?: number;
    reviewRequired?: boolean;
    signature?: string;
    status?: string;
    supportsDeletion?: boolean;
    supportsMapping?: boolean;
    supportsRenaming?: boolean;
    suppressedRecordCount?: number;
    timestamp?: Date;
    size?: number;
    uploadComplete?: boolean;
    uploadedByteCount?: number;
    uploadName?: string;
    url?: string;

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
  id?: number;
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

export interface SzDataFileDataSource {
  DSRC_ID?: number,
  DSRC_CODE: string,
  DSRC_ORIGIN?: string
}

export interface SzImportedFilesAnalysisDataSource extends SzDataFileDataSource {
  RECORD_COUNT?: number,
  RECORD_WITH_ID_COUNT?: number
  EXISTS: boolean;
}

export class SzImportedDataFile implements SzDataFileInfo {
  id?: number;
  analysis?: SzImportedFileAnalysis;
  characterEncoding?: string;
  name?: string;
  url?: string;
  format?: string;
  mediaType?: string;
  uploadName: string;
  entityType?: string;
  size?: number;
  timestamp?: Date;
  mappingComplete?: boolean;
  mappingLearned?: boolean;
  processingComplete?: boolean;
  processedByteCount?: number;
  processingRate?: number;
  processedRecordCount?: number;
  processing?: boolean;
  purgeRequiredOnDelete?: boolean;
  recordCount?: number;
  registering?: boolean;
  resolutionRate?: number;
  resolved?: boolean;
  resolving?: boolean;
  resolvedRecordCount?: number;
  reviewRequired?: boolean;
  status?: string;
  supportsDeletion?: boolean;
  supportsMapping?: boolean;
  supportsRenaming?: boolean;
  //dataSource?: SzSdkDataSource;
  dataSources?: SzImportedFilesAnalysisDataSource[]
  //recentErrors: SzServerError[];
}

export interface SzImportedFileAnalysis {
  /**
     * The character encoding used to process the bulk data.
     */
  characterEncoding?: string;
  /**
   * The media type of the bulk data.
   */
  mediaType?: string;
  /**
   * The number of records found in the bulk data.  This may not match the number of \"observed entities\" once loaded since some records may be exact duplicates.
   */
  recordCount?: number;
  /**
   * The number of records provided that include a `RECORD_ID` value.
   */
  recordsWithRecordIdCount?: number;
  /**
   * The number of records provided that include a `DATA_SOURCE` value.
   */
  recordsWithDataSourceCount?: number;
  /**
   * The number of records provided that include a `ENTITY_TYPE` value.
   */
  recordsWithEntityTypeCount?: number;
  /** json records */
  records: {[key: string]: any}[],
  /** array of analysis elements grouped by datasource */
  dataSources: SzImportedFilesAnalysisDataSource[]
}

export interface SzImportedFilesLoaded {
  loaded: number,
  notLoaded: number,
  failures: number,
  errors?: Error[]
}