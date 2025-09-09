import { SzDataFileField } from './data-files';

export enum SzMappingGuidanceSeverity {
    SUCCESS,
    SUGGESTION,
    WARNING,
    ERROR
}

export enum SzFieldVisibility {
    HIDDEN,
    VISIBLE,
    SUBDUED,
    FOCUSED
}

export interface SzFieldState {
    visibility: SzFieldVisibility;
    severity: SzMappingGuidanceSeverity;
}

export interface SzMappingGuidanceAction {
    label: string;
    message: string;
    arguments: any;
    operation: Function;
}
  
export interface SzGuidanceFilter {
    arguments: any;
    operation: Function;
    stickyList?: number[];
}

export interface SzMappingGuidePost {
    severity: SzMappingGuidanceSeverity;
    message: string;
    showActions?: SzMappingGuidanceAction[];
    fixActions?: SzMappingGuidanceAction[];
}

export interface SzFieldHighlight {
    fieldState: SzFieldState;
    field: SzDataFileField;
}