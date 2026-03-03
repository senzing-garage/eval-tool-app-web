import { Observable, Subject } from 'rxjs';

import {debounceTime, map, takeUntil} from 'rxjs/operators';
import {
  Component,
  HostBinding,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnInit,
  OnDestroy,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';
import {
  CommonModule,
  DecimalPipe
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SzBusyInfo, SzDataFile, SzDataFileCardHighlightType, SzImportedDataFile } from '../../../models/data-files';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'sz-data-source-card',
  templateUrl: './data-source-card.component.html',
  styleUrls: ['./data-source-card.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatTooltipModule,
    MatCardModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  providers: [DecimalPipe]
})
export class SzDataSourceCardComponent
implements OnInit, AfterViewInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();

  private   _wrapToolTipCharsLength = 35;
  private   _showResolvingProgress = false;
  private   _hideResolvingProgressTimer: ReturnType<typeof setTimeout> | undefined;
  // Data synonym function to better describe the data (its a file)
  private   _data: SzDataFile;
  /** whether or not the card has the "highlighted" class */
  private   _highlight = false;
  public    showDebug = false;
  protected _editMode : boolean = false;

  public editedDataSource : string;

  /** whether inline name editing is active */
  public isEditingName = false;
  /** the value being edited */
  public editingNameValue = '';
  /** reference to the name input element for focusing */
  @ViewChild('nameInput') nameInputRef: ElementRef<HTMLInputElement>;

  // ------------------------------- tag inputs, getters and setters ------------------------------

  /** initialize */
  @Input() public allowSparkle = true;
  // tslint:disable-next-line:no-input-rename
  @Input('sz-delete-disabled') public deleteDisabled = false;
  // tslint:disable-next-line:no-input-rename
  @Input('sz-files-loading') public filesLoading = false;
  @Input() public set file(value: SzDataFile) {
    this._data = value;
  }
  @Input() public set data(value: SzDataFile) {
    this._data = value;
    this.updateResolvingProgress();
  }
  /** apply the highlighted style to the card */
  @Input() public set highlight(value: boolean) {
    this._highlight = value;
  }
  /** list of child elements that can each individually be highlighted */
  @Input() highlightedElements: SzDataFileCardHighlightType[] = [];
  public get file(): SzDataFile {
    return this._data;
  }
  public get data() {
    return this._data;
  }
  public get highlight(): boolean {
    return this._highlight;
  }
  public get dataFileName() {
    if (!this.data) {return ''; }
    if (!this.data.url) {return ''; }
    return SzDataFile.getName(this.data.url);
  }
  public get dataFilePath() {
    if (!this.data) {return ''; }
    if (!this.data.url) {return ''; }
    return SzDataFile.getPath(this.data.url);
  }
  public get recordCount(): number | undefined {
    return (this.data && this.data.recordCount) ? this.data.recordCount : undefined;
  }
  public get badRecordCount(): number | undefined {
    return (this.data && this.data.badRecordCount) ? this.data.badRecordCount : undefined;
  }
  public get entityCount(): number | undefined {
    return (this.data && this.data.entityCount) ? this.data.entityCount : undefined;
  }
  public get dataSourceName(): string {
    let retVal = this.data && this.data.name ? this.data.name : !this.dataSourcesHavePermanence ? "[Unnamed Data Source]" : "Unknown";
    return retVal;
  }
  public get dataSourcesHavePermanence() {
    if(this.data && this.data.dataSources && this.data.dataSources.every) {
      return this.data.dataSources.every((ds) => {
        return ds.DSRC_ID !== undefined && ds.DSRC_ID > 0;
      })
    }
    return false;
  }
  public get supportsDeletion() {
    if(this.data && this.data.supportsDeletion !== undefined) {
      return this.data.supportsDeletion;
    }
    return true;
  }
  public get showResolvingProgress(): boolean {
    return this._showResolvingProgress;
  }
  /** Update resolving progress visibility. Call from change-detection-safe contexts. */
  private updateResolvingProgress(): void {
    const shouldShow = this.isPreparingToResolve || this.isResolving;
    if(!shouldShow && this._showResolvingProgress) {
      // delay hiding by 2 seconds
      if(!this._hideResolvingProgressTimer) {
        this._hideResolvingProgressTimer = setTimeout(() => {
          this._showResolvingProgress = false;
          this._hideResolvingProgressTimer = undefined;
        }, 2000);
      }
    } else {
      if(this._hideResolvingProgressTimer) {
        clearTimeout(this._hideResolvingProgressTimer);
        this._hideResolvingProgressTimer = undefined;
      }
      this._showResolvingProgress = shouldShow;
    }
  }
  public get uploadPercent(): number {
    if(this.isUploading) {
      return (this.data && this.data.size > 0) ? 100*(this.data.uploadedByteCount / this.data.size) : 0;
    } else {
      return (this.data && this.data.size > 0) ? 100*((this.data.processedByteCount) / this.data.size) : 0;
    }
  }
  public get resolvedPercent(): number {
    return (this.data && this.data.recordCount > 0) ? 100*(this.data.resolvedRecordCount / this.data.recordCount) : 0;
  }
  public get resolvingProgressBarMode(): 'determinate' | 'indeterminate' {
    return (this.isPreparingToResolve) ? 'indeterminate' : 'determinate';
  }
  public get uploadingProgressBarMode(): 'determinate' | 'indeterminate' {
    return (this.fileStatus === 'processing') ? 'determinate' : 'indeterminate';
  }
  public get errorCount() {
      return this.data?.loadErrors?.length || 0;
  }

  // ----------------------- start subjects, event emitters and observeables -----------------------

  @Output() public onEditClicked        = new EventEmitter<SzDataFile>();
  @Output() public onReviewClicked      = new EventEmitter<SzDataFile>();
  @Output() public onLoadClicked        = new EventEmitter<SzDataFile>();
  @Output() public onDeleteClicked      = new EventEmitter<SzDataFile>();
  @Output() public onResolveClicked     = new EventEmitter<SzDataFile>();
  @Output() public onCardClicked        = new EventEmitter<SzDataFile>();
  @Output() public onCardDoubleClicked  = new EventEmitter<SzDataFile>();
  /** @todo figure out why this is string and not SzDataFile */
  @Output() public onViewErrorsClicked  = new EventEmitter<string>();
  /** emitted when the user saves an edited name */
  @Output() public onNameChanged        = new EventEmitter<{file: SzDataFile, newName: string}>();

  // ---------------------------------------- host bindings ---------------------------------------
  @HostBinding('class.busy') private _isBusy: boolean = false;
  @HostBinding('class.data-file') public get isDataFile(): boolean {
      return (this.data && this.data.uploadName && !this.data.resolved) ? true : false;
  }
  @HostBinding('class.partial-load-failure') public get hadPartialLoadFailure(): boolean {
    return (this.data && this.data.status === 'partial-load-failure') ? true : false;
  }
  @HostBinding('class.processing-failed') public get hadProcessingFailure(): boolean {
    return (this.data && this.data.status === 'processing-failed') ? true : false;
  }
  @HostBinding('class.complete-load-failure') public get hadCompleteLoadFailure(): boolean {
    return (this.data && this.data.status === 'complete-load-failure') ? true : false;
  }
  @HostBinding('class.resolving') public get isResolving(): boolean {
    return (this.data && this.data.resolving) ? true : false;
  }
  @HostBinding('class.registering') public get isRegistering(): boolean {
    return (this.data && this.data.registering) ? true : false;
  }
  @HostBinding('class.preparing-to-resolve') public get isPreparingToResolve(): boolean {
    return (this.data && this.data.processingComplete && this.data.resolving && this.data.resolvedRecordCount <= 0) ? true : false;
  }
  @HostBinding('class.processing') public get isProcessing(): boolean {
    return (this.data && this.data.processing && !this.isPreparingToResolve &&
            ((this.data.processingRate >= 0 && this.data.processedByteCount >= 0) ||
             (this.data.processedRecordCount >= 0))) ? true : false;
  }
  @HostBinding('class.loaded') public get isLoaded(): boolean {
    return (this.data && this.data.status === 'completed') ? true : false;
  }
  @HostBinding('class.uploading') public get isUploading(): boolean {
    return (this.data && (this.data.status === 'uploading' || this.data.status === 'upload-pending') && !this.isProcessing) ? true : false;
  }
  @HostBinding('class.incomplete') private get isIncomplete(): boolean {
    // datasources can have codes(names) before being loaded but upon 
    // creation they are given ID's
    let dataSourcesHaveIds = this.data && this.data.dataSources && this.data.dataSources.every ? this.data.dataSources.every((ds) => {
      return ds.DSRC_ID !== undefined && ds.DSRC_ID > 0;
    }) : false;
    return (this.data && (!dataSourcesHaveIds));
  }
  @HostBinding('class.resume-loading') public get isPartiallyLoaded(): boolean {
    return (this.data && this.data.status === 'resume') ? true : false;
  }
  @HostBinding('class.mapped') private get isMapped(): boolean {
    return (this.data && (this.data.status === 'mapped' || this.premapped)) ? true : false;
  }
  /** alias for isUploading */
  @HostBinding('class.files-loading') public get isLoading(): boolean {
    return this.isUploading;
  }
  @HostBinding('class.highlight') get highlightClass(): boolean {
    return this.highlight;
  }
  @HostBinding('class.hasSparkled') get hasSparkledClass(): boolean {
    return !this.allowSparkle;
  }
  @HostBinding('attr.sz-edit-mode')
  @Input('sz-edit-mode')
  set editMode(editMode: boolean) {
    if ((typeof editMode) === "string") {
      editMode = (''+editMode) === 'true';
    }
    if (this._editMode === editMode) return;
    this._editMode = editMode;
    this.editModeChange.emit(this._editMode);
  }

  // @todo remove following emitters, pretty sure they are legacy and no longer used
  // tslint:disable-next-line:no-output-rename
  @Output("sz-edit-mode-change")
  editModeChange: EventEmitter<boolean>
    = new EventEmitter<boolean>();

  // tslint:disable-next-line:no-output-rename
  @Output('sz-file-resolving')
  fileResolving: EventEmitter<{ fileId: number, observable: Observable<SzDataFile> }>
    = new EventEmitter<{ fileId: number, observable: Observable<SzDataFile> }>();

  // tslint:disable-next-line:no-output-rename
  @Output('sz-file-resolve-complete')
  fileResolvingComplete: EventEmitter<{ fileId: number, observable: Observable<SzDataFile> }>
    = new EventEmitter<{ fileId: number, observable: Observable<SzDataFile> }>();

    // tslint:disable-next-line:no-output-rename
  @Output('sz-review-results')
  reviewResults: EventEmitter<string> = new EventEmitter<string>();

  // ------------------------------------- start event handlers ------------------------------------

  /** Handler for when users mouse moves off of card */
  @HostListener('mouseout') onMouseOut($event: MouseEvent) {
    // we only want to ever do this once.
    this.allowSparkle=false;
  }

  /**
   * Handler for swipe right gestures
   *
   * @param {Event} event
   * @memberof SzDataCardComponent
   */
  handleSwipeRight(event: Event) {
    // swipe right invokes delete/archive
    this.handleDeleteTap(event);
  }
  /**
   * Handle clicks/taps on delete buttons
   *
   * @param {Event} event
   * @returns {boolean}
   * @memberof SzDataCardComponent
   */
  handleDeleteClick(event: Event) {
    console.info('handleDeleteClick: ', event);
    this.cancelPropagation(event);
    this.onDeleteClicked.emit( this.data );
  }
  /**
   * Synthetic delegate for delete taps/clicks.
   *
   * @param {Event} event
   * @returns {boolean}
   * @memberof SzDataCardComponent
   */
  handleDeleteTap(event: Event) {
    this.cancelPropagation(event);
    if(event && event.preventDefault && event.stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.onDeleteClicked.emit(this.data);
  }
  handleCardClick(event: Event) {
    console.info('handleCardClick: ', event);
    this.onCardClicked.emit(this.data);
  }
  handleCardDoubleClick(event: Event) {
    console.info('handleCardDoubleClick: ', event);
    this.onCardDoubleClicked.emit(this.data);
  }
  handleOnNameClick(event: Event) {
    console.info('handleOnNameClick: ', event);
    // is there only one data source and can it be renamed ?
    if(this.data.supportsRenaming || !this.dataSourcesHavePermanence) {
      this.cancelPropagation(event);
      this.startEditingName();
    }
  }

  /** Start inline editing of the data source name */
  startEditingName() {
    this.editingNameValue = this.dataSourceName;
    this.isEditingName = true;
    this.cdr.detectChanges();
    // Focus the input after it renders
    setTimeout(() => {
      if (this.nameInputRef?.nativeElement) {
        this.nameInputRef.nativeElement.focus();
        this.nameInputRef.nativeElement.select();
      }
    }, 0);
  }

  /** Save the edited name and exit edit mode */
  saveNameEdit() {
    if (!this.isEditingName) return;
    const newName = this.editingNameValue.trim();
    if (newName && newName !== this.dataSourceName) {
      // Update the local data so the UI reflects the change immediately
      this.data.name = newName;
      this.onNameChanged.emit({ file: this.data, newName });
    }
    this.isEditingName = false;
  }

  /** Cancel editing and restore original value */
  cancelNameEdit() {
    this.isEditingName = false;
    this.editingNameValue = '';
  }

  /** Handle blur event on name input */
  onNameInputBlur(event: FocusEvent) {
    // Small delay to allow click events on other elements to fire first
    setTimeout(() => {
      if (this.isEditingName) {
        this.saveNameEdit();
      }
    }, 150);
  }

  /** Handle keydown events on name input */
  onNameInputKeydown(event: KeyboardEvent) {
    // Stop propagation to prevent card click, but don't preventDefault for normal typing
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveNameEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelNameEdit();
    }
  }
  handleViewErrorsClick(event: Event) {
    console.info('handleViewErrorsClick: ', event);
    this.cancelPropagation(event);
  }
  public handleLoadClick(event: Event) {
    this.cancelPropagation(event);
    if (!this.data.mappingComplete) return;
    this.onLoadClicked.emit( this.data );
  }

  public handleRenameClick(event: Event) {
    this.cancelPropagation(event);
  }

  public handleReviewClick(event: Event){
    this.cancelPropagation(event);
    this.onReviewClicked.emit( this.data );
  }

  // Resolve Functionality
  public handleResolveClick(event: Event) {
    this.cancelPropagation(event);
    this.onResolveClicked.emit( this.data );
  }

  // Mappings Functionality (mappings button)
  public handleMappingsClick(event: Event) {
    this.cancelPropagation(event);
    if (this.data.resolving) return;
    this.onEditClicked.emit( this.data );
  }
  public handleFileStatusClick(event: Event) {
    switch (this.data.status) {
      case 'unmapped':
        this.handleMappingsClick(event);
        break;
      case 'mapped':
        this.handleLoadClick(event);
        break;
      case 'resume':
      case 'complete-load-failure':
      case 'partial-load-failure':
        this.handleResolveClick(event);
        break;
      case 'completed':
        if (!this.filesLoading) {
          this.onReviewClicked.emit( this.data );
        }
        break;
      default:
        // do nothing
    }
  }

  public handlePauseUploadClick(event: Event) {
    console.warn('SzDataFileCardComponent.handlePauseUploadClick', event);
  }

  public handleResumeUploadClick(event: Event) {
    console.warn('SzDataFileCardComponent.handleResumeUploadClick', event);
  }

  // ---------------------------------- start getters and setters ---------------------------------

  public get fileStatusClickable(): boolean {
    switch (this.data.status) {
      case 'unmapped':
        return true;
      case 'mapped':
      case 'resume':
      case 'complete-load-failure':
      case 'partial-load-failure':
        return true;
      case 'completed':
        return false;
      default:
        return false;
    }
  }

  public get defaultTemplateIcon(): string | null {
    return 'generic-datasource'
  }

  public set busy(value: boolean) {
    this._isBusy = value;
  }
  public get busy(): boolean {
    return this._isBusy;
  }
  get editMode(): boolean {
    return this._editMode;
  }

  public get fileTimestamp() {
    let date = this.data.timestamp;
    if (!date) { date = this.data.createdOn; }
    return date;
  }

  public interpolateMessage(fileStatus, format) {
    if (!format || format.length === 0) {
      //console.warn('no tooltip message for "'+ key +'"', this.fileStatus);
      return null;
    }

    const f = this.data;
    const p = this.decimalPipe;

    // preparing-resolve

    switch (fileStatus) {
      case 'uploading':
        return format.replace('$(percent)', this.uploadPercent.toString())
                      .replace('$(count)', f.uploadedByteCount.toString())
                      .replace('$(total)', f.size.toString());
      case 'upload-pending':
        // upload-pending overlaps with processing state
        return format.replace('$(percent)', this.uploadPercent.toString())
                      .replace('$(count)', f.uploadedByteCount.toString())
                      .replace('$(total)', f.size.toString())
                      .replace('$(rate)', p.transform(f.processingRate, '1.0-0'));
      case 'processing':
        return format.replace('$(rate)', p.transform(f.processingRate, '1.0-0'))
                      .replace('$(count)', p.transform(f.recordCount, '1.0-0'));

      case 'preparing-resolve':
        return format.replace('$(count)',
                              p.transform(f.loadedRecordCount, '1.0-0'))
                      .replace('$(rate)',
                              p.transform(f.resolutionRate, '1.0-0'));
      case 'resolving':
        return format.replace('$(count)',
                              p.transform(f.loadedRecordCount, '1.0-0'))
                     .replace('$(rate)',
                              p.transform(f.resolutionRate, '1.0-0'));
      case 'completed':
        return format.replace('$(count)',
                              p.transform(f.loadedRecordCount, '1.0-0'))
                      .replace('$(rate)',
                              p.transform(f.resolutionRate, '1.0-0'));
      case 'resume':
        return format.replace('$(loadCount)',
                              p.transform(f.loadedRecordCount, '1.0-0'))
                     .replace('$(remainingCount)',
                              p.transform(
                                (f.recordCount - f.loadedRecordCount), '1.0-0'));
      case 'partial-load-failure':
        return format.replace('$(count)',
                              p.transform(f.failedRecordCount, '1.0-0'));
      case 'processing-failed':
        return format;
      case 'complete-load-failure':
        return format;
      default:
        return null;
    }
  }

  public get fileStatusTooltip(): string {
    return this.fileStatus;
  }

  public get fileStatusIcon() : string|null {
    switch (this.fileStatus) {
      case 'unmapped':
      case 'partial-load-failure':
        return 'warning';
      case 'processing-failed':
      case 'complete-load-failure':
        return 'error';
      default:
        return null;
    }
  }

  public get fileStatus(): string {
    if (!this.data) { return 'unknown'; }

    // ------------ purely for debugging/forcing states
    let status = this.data.status;
    if ( this.isUploading) {
      if (!this.data.uploadComplete) {
        status = 'uploading';

        if (this.data.uploadedByteCount > 0) {
          return 'upload-paused';
        } else {
          return 'upload-pending';
        }
      } else {
        status = 'uploading';
      }
    } else if(this.hadPartialLoadFailure) {
      status = 'partial-load-failure';
    } else if(this.hadProcessingFailure) {
      status = 'processing-failed';
    } else if(this.hadCompleteLoadFailure) {
      status = 'complete-load-failure';
    } else if(this.isProcessing) {
      status = 'processing';
    } else if(this.isPreparingToResolve) {
      status = 'preparing-resolve';
    } else if(this.isResolving) {
      status = 'resolving';
    } else {
      status = this.data.status;
    }

    return status;
  }

  public get mappedFieldCount() {
    if (!this.data) { return 0; }
    let count = 0;
    return count;
  }

  public totalFieldCount() {
    if (!this.data) { return 0; }
    let count = 0;

    return count;
  }

  public get unmappedFieldCount() {
    if (!this.data) { return 0; }
    let count = 0;
    return count;
  }


  public get pendingResolve() {
    if (!this.data) { return false; }
    return ((this.data.resolvedRecordCount + this.data.failedRecordCount) < this.data.recordCount);
  }

  public get hasFailedRecords() {
    if (!this.data) { return false; }
    return (this.data.failedRecordCount > 0);
  }

  // --------------------------------------- utility methods ---------------------------------------

  public getProgressBarTooltip(busyInfo: SzBusyInfo<SzDataFile>,
                               bufferRate: string,
                               progressRate: string): string {
    if (!busyInfo.progressing) {
      return '';
    }

    const uploadComplete = busyInfo.updatedRecord.uploadComplete;
    const processingComplete = busyInfo.updatedRecord.processingComplete;
    const resolving = busyInfo.updatedRecord.resolving;

    const uploadRate = bufferRate;
    const processRate = resolving ? bufferRate : progressRate;
    const resolveRate = progressRate;

    let result = '';
    let prefix = '';
    if (!uploadComplete) {
      result = result + 'Uploading @ ' + uploadRate + ' Kbps';
      prefix = ' / ';
    }
    if (!processingComplete) {
      result = result + prefix + 'Processing @ '
        + processRate + ' records per second';
      prefix = ' / ';
    }
    if (resolving) {
      result = result + prefix + 'Loading @ '
        + resolveRate +  ' records per second';
    }
    return result;
  }

  protected constructDataObject(): SzDataFile {
    return new SzDataFile();
  }

  public forceWordBreaks(wordsStr?: string): string|undefined {
    let retVal = wordsStr;
    if(retVal && retVal.length > this._wrapToolTipCharsLength && retVal.indexOf(" ") <= 0) {
      // force wrap
      const chopped = [];
      while(retVal.length > 0) {
        chopped.push(retVal.slice(0, this._wrapToolTipCharsLength));
        retVal = retVal.slice(this._wrapToolTipCharsLength);
      }
      retVal = chopped.join(' ');
    }
    return retVal;
  }

  public toggleBusy(event: MouseEvent) {
    this.busy = !this.busy;
    console.log('toggleBusy: ', this.busy, event);
  }
  public cancelBusyEvent() {
    console.log('cancelBusyEvent: ', this.busy);

    if(this.busy) {
      // TODO: ask user if he wants to cancel event
      this.busy = false;
      console.log('\t cancelled: ', this.busy);
    }
  }
  private cancelPropagation(event: Event){
    if(event) {
      if(event.cancelBubble !== undefined && event.cancelable) {
        try { event.cancelBubble = true; }catch(err) {}
      }
      if(event.preventDefault) {
        try { event.preventDefault(); }catch(err) {}
      }
      if(event.stopPropagation) {
        try { event.stopPropagation(); }catch(err) {}
      }
    }
  }

  public compileStringTemplate(templateStr: string, replaceStr: string, value: any): string {
    console.log('compileStringTemplate: ', templateStr, replaceStr, value, templateStr.replace(replaceStr, value));
    return templateStr.replace(replaceStr, value);
  }

  public cancelEditMode() : void {
    if (!this.editMode) return;
    this.editMode = false;
  }

  public activateEditMode() : void {
    if (this.editMode) return;
    this.editMode = true;
  }

  /** there is only one "status" button but it should only be called out if in a
   * specific state like "load" or "map" etc.. this transposes the status to the matching
   * SzDataFileCardHighlightType
   */
  public getElementTypeFromStatus(status: string): SzDataFileCardHighlightType | undefined {
    if(status && status.toUpperCase){
      switch(status.toUpperCase()) {
        case 'MAPPED':
          return 'load';
        case 'UNMAPPED':
          return "map";
        case 'COMPLETED':
          return 'review';
      }
    }
    return 'review';
  }

  public SzDataFileCardHighlightType = SzDataFileCardHighlightType;
  public isElementTypeHighlighted(eType: SzDataFileCardHighlightType): boolean {
    let retVal = false;
    if( eType && this.highlightedElements && this.highlightedElements.length > 0) {
      retVal = (this.highlightedElements.indexOf(eType) > -1);
    }
    return retVal && this.highlight;
  }

  //--------------------------------------------------------------------------
  //                            Life Cycle Methods
  //--------------------------------------------------------------------------

  constructor(
    private decimalPipe: DecimalPipe,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {}


  ngOnInit() {
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    if(this._hideResolvingProgressTimer) {
      clearTimeout(this._hideResolvingProgressTimer);
    }
  }

  public get showDefaultIcon() : boolean {
    if (this.showTemplateIcon || this.errantFile) return false;
    return true;
  }

  public get showTemplateIcon() : boolean {
    if (this.errantFile) return false;
    return true;
  }

  public get errantFile() : boolean {
    if (!this.data) return false;
    if (!this.data.format) return false;
    if (!this.data.format.toUpperCase().trim().startsWith("JSON")) return false;
    if (!this.data.processingComplete) return false;
    if (this.data.mappingComplete) return false;
    if (this.data.dataSources) {
      // if all datasources have a name proceed
      let allDataSourcesHaveName = this.data.dataSources.every((ds) => {
        return (ds.DSRC_CODE && ds.DSRC_CODE.trim && ds.DSRC_CODE.trim().length > 0)
      });
      if(!allDataSourcesHaveName) return false;
    }
    return true;
  }

  public get premapped() : boolean {
    if (!this.data) return false;
    if (!this.data.format) return false;
    if (!this.data.mappingComplete) return false;
    return (this.data.format.toUpperCase().trim().startsWith("JSON"))
  }

  public checkDataSourceCharacter(event: KeyboardEvent): boolean {
    if (event.key.length !== 1) {
      // handles cases where only modifier keys are pressed
      return true;
    }
    if (!/[a-zA-Z0-9\s-_]/.test(event.key)) {
      return false;
    }
    return true;
  }

}
