import {from as observableFrom,  Observable ,  Subscription, Subject } from 'rxjs';

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
  HostListener
} from '@angular/core';
import {
  CommonModule,
  DecimalPipe
} from '@angular/common';
import { SzBusyInfo, SzDataFile, SzDataFileCardHighlightType } from '../../../models/data-files';
import { SzDataSourcesService } from '@senzing/eval-tool-ui-common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

//import { animate, state, style, transition, trigger } from '@angular/animations';
/*
import {
  SzProject,
  SzDataFile, SzDataFileInfo,
  SzDataFileCardHighlightType,
  SzProjectHttpService,
  SzDataSource,
  SzDataSourceService,
  SzEntityClass,  SzEntityType, SzEntityTypeService,
  SzServerErrorsService,
  SzDialogService,
  SzPromptDialogComponent,
  SzServerError,
  SzBusyInfo, SzDataCardComponent, SzDataCardEvent, SzDataCardEventType,
  SzMessageBundle,
  SzMessageHandler, SzMessageHandlerView
} from '@senzing/app-lib';
*/
//import {trimTrailingNulls} from '@angular/compiler/src/render3/view/util';
//import {resultMemoize} from '@ngrx/store';

@Component({
  selector: 'sz-data-source-card',
  templateUrl: './data-source-card.component.html',
  styleUrls: ['./data-source-card.component.scss'],
  imports: [
    CommonModule,
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

  //private   _actorEntityClass : SzEntityClass;
  //private   lastDataSource: string | null = null;
  //private   dataSourceObs: Observable<string> | null = null;
  private   _wrapToolTipCharsLength = 35;
  //private   _project: SzProject;
  private   _showResolvingProgress = false;
  private   _hideResolvingProgressTimer;
  // Data synonym function to better describe the data (its a file)
  private   _data: SzDataFile;
  /** whether or not the card has the "highlighted" class */
  private   _highlight = false;
  public    showDebug = true;
  protected _editMode : boolean = false;

  public editedDataSource : string;

  // ------------------------------- tag inputs, getters and setters ------------------------------

  /** alakazam! */
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
    // if we need to set up a subscription to the error channel
    // for this file go ahead and do it
    if(this._data && this._data.configId && this._data.id) {
      //this.setUpErrorChannelSubscription();
    }
    // update progress bar
    //this.showResolvingProgress = (this.isResolving || this.isPreparingToResolve) ? true : false;
  }
  /*@Input() public set project(value: SzProject) {
    this._project = value;
  }
  public get project(): SzProject {
    return this._project;
  }  
  */
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
  public get dataSourceName(): string {
    let retVal = (this.data && this.data.name) ? this.data.name : undefined;
    if(!retVal) {
      retVal = "Unknown";
    }
    return retVal;
  }
  public get showResolvingProgress(): boolean {
    const isPreparingToResolve = this.isPreparingToResolve;
    const isResolving = this.isResolving;
    const _retVal = isPreparingToResolve || isResolving;
    if(!_retVal && this._showResolvingProgress) {
      // we are going to hide this, but delay it a second or so
      this._hideResolvingProgressTimer = setTimeout(() => {
        this._showResolvingProgress = _retVal;
        this._hideResolvingProgressTimer = undefined;
      }, 2000);
    } else {
      this._showResolvingProgress = _retVal;
    }
    return this._showResolvingProgress;
  }
  public get uploadPercent(): number {
    //return this.data ? 100*(this.data.uploadedByteCount / this.data.totalSize) : 0;
    if(this.isUploading) {
      return this.data ? 100*(this.data.uploadedByteCount / this.data.totalSize) : 0;
    } else {
      return this.data ? 100*((this.data.processedByteCount) / this.data.totalSize) : 0;
    }
    //return 50;
  }
  public get resolvedPercent(): number {
    return this.data ? 100*(this.data.resolvedRecordCount / this.data.recordCount) : 0;
    //return this.data ? 100*((this.data.resolvedRecordCount / this.data.totalSize) / this.data.recordCount) : 0;
    //return 50;
  }
  public get resolvingProgressBarMode(): 'determinate' | 'indeterminate' {
    return (this.isPreparingToResolve) ? 'indeterminate' : 'determinate';
  }
  public get uploadingProgressBarMode(): 'determinate' | 'indeterminate' {
    return (this.fileStatus === 'processing') ? 'determinate' : 'indeterminate';
    // return 'indeterminate';
    //return (!this.isProcessing) ? 'indeterminate' : 'determinate';
  }
  /* @todo remove after 2.0 release
  public get dataSource() : Observable<string> {

    const code = (this.data && this.data.dataSource)
             ? this.data.dataSource : null;

    if (code !== this.lastDataSource) {
      this.dataSourceObs = null;
      this.lastDataSource = code;
    }
    if (!this.dataSourceObs) {
      this.dataSourceObs = this.dataSourceService.getDisplayName(code);
    }

    return this.dataSourceObs;
  }*/

  // --------- errors

  /*
  private _errors : SzServerError[] = [];
  private _errorChannel : string | null = null;
  private _errorSubscription : Subscription | null = null;
  public get errorCount() {
    return (this._errors && this._errors.length !== undefined) ? this._errors.length : 0;
  }*/
  public get errorCount() {
      return 0;
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

  // ---------------------------------------- host bindings ---------------------------------------
  /*@HostBinding('class.busy') private get isBusy(): boolean {
    return (this.data && this.data.resolving) ? true : false;
  }*/
  @HostBinding('class.busy') private _isBusy: boolean = false;
  /**
    } else if(this.hadPartialLoadFailure) {
      status = 'partial-load-failure';
    } else if(this.hadProcessingFailure) {
      status = 'processing-failed';
    } else if(this.hadCompleteLoadFailure) {
  */
  @HostBinding('class.partial-load-failure') public get hadPartialLoadFailure(): boolean {
    return (this.data && this.data.status === 'partial-load-failure') ? true : false;
  }
  @HostBinding('class.processing-failed') public get hadProcessingFailure(): boolean {
    return (this.data && this.data.status === 'processing-failed') ? true : false;
  }
  @HostBinding('class.complete-load-failure') public get hadCompleteLoadFailure(): boolean {
    return (this.data && this.data.status === 'complete-load-failure') ? true : false;
  }
  /** if errors button visible add class */
  //@HostBinding('class.has-errors') private get cssHasErrors(): boolean {
  //  return this.errorCount > 0;
  //}
  @HostBinding('class.resolving') public get isResolving(): boolean {
    return (this.data && this.data.resolving) ? true : false;
    //return (this.data.processingComplete && this.data.resolving) ? true : false;
    return true;
  }
  @HostBinding('class.preparing-to-resolve') public get isPreparingToResolve(): boolean {
    return (this.data && this.data.processingComplete && this.data.resolving && this.data.resolvedRecordCount <= 0) ? true : false;
  }
  @HostBinding('class.processing') public get isProcessing(): boolean {
    //return true;
    return (this.data && this.data.processing && !this.isPreparingToResolve && this.data.processingRate >= 0 && this.data.processedByteCount >= 0) ? true : false;
  }
  @HostBinding('class.loaded') public get isLoaded(): boolean {
    return (this.data && this.data.status === 'completed') ? true : false;
  }
  @HostBinding('class.uploading') public get isUploading(): boolean {
    return (this.data && (this.data.status === 'uploading' || this.data.status === 'upload-pending') && !this.isProcessing) ? true : false;
    //return true;

    //return (!this.data.uploadComplete && this.data.uploadedByteCount > 0) ? true : false;
    //return (this.data && this.data.uploadedByteCount < this.data.processedByteCount) ? true : false;
  }
  @HostBinding('class.incomplete') private get isIncomplete(): boolean {
    return (this.data && (!this.data.dataSource || !this.data.entityType)) ? true : false;
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
    //this.emitEvent(SzDataCardEventType.EDIT_MODE_CHANGED);
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
    } else {
      throw Error('cannot escape event bubbling, exit by throw.');
    }

    //return this.handleDeleteClick(event);
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
    if(this.data && (!this.data.dataSource && this.data.processedByteCount > 0)) {
      //take them to mapping
      this.cancelPropagation(event);
      this.onEditClicked.emit(this.data);
    }
  }
  handleViewErrorsClick(event: Event) {
    console.info('handleViewErrorsClick: ', event);
    this.cancelPropagation(event);
    //this.onViewErrorsClicked.emit(this.errorChannelName);
  }
  public handleLoadClick(event: Event) {
    this.cancelPropagation(event);
    if (!this.data.mappingComplete) return;
    this.onLoadClicked.emit( this.data );
  }

  public handleRenameClick(event: Event) {
    this.cancelPropagation(event);
    
    /*
    this.dialogService.openFromComponent(SzPromptDialogComponent, {
      disableClose: true,
      hasBackdrop: true,
      data: {
        title: this.msg.get('rename-data-source-title'),
        message: this.msg.get('rename-data-source-message')
          .replace('$(fileName)', this.data.name),
        label: this.msg.get('rename-data-source-label'),
        value: this.data.dataSource,
        okButtonLabel: this.msg.get('rename-data-source-ok-label'),
        cancelButtonLabel: this.msg.get('rename-data-source-cancel-label'),
        keydown: this.checkDataSourceCharacter
      }
    }).toPromise().then(dataSourceCode => {
      if (dataSourceCode == null || dataSourceCode.trim().length == 0) {
        return;
      }
      if (this.data.dataSource.trim().toUpperCase() === dataSourceCode.trim().toUpperCase()) {
        return;
      }
      this.ensureDataSourceUnique(dataSourceCode.trim().toUpperCase())
        .then(file => {
          const dSourceCode = file.dataSource.trim().toUpperCase();
          this.ensureDataSource(dSourceCode, dataSourceCode)
            .then(result => {
              const updatedData = { dataSource: result.code, mappingComplete: true };
              this.projectService
                .updateProjectFile(updatedData, this.data.projectId, this.data.id)
                .toPromise()
                .then(f => {
                  this.data = f;

                }).catch(error => {
                  console.error(error);
                  alert(error && error.message ? error.message : error);
              });
            })
            .catch(error => {
              console.error(error);
              alert(error && error.message ? error.message : error);
            });
        })
        .catch(error => {
          console.error(error);
          alert(error && error.message ? error.message : error);
        });
    }).catch(error => {
      console.error(error);
      alert(error && error.message ? error.message : error);
    });
    */
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
    //this.emitEvent(SzDataCardEventType.INVOKED);
  }
  public handleFileStatusClick(event: Event) {
    //console.warn('SzDataFileCardComponent.handleFileStatusClick', event);
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
          //this.reviewResults.emit(this.data.dataSource);
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
        /*if (!this.filesLoading && this.project && !this.project.primingAuditSummary)
        {
          return true;
        }*/
        return false;
      default:
        return false;
    }
  }

  public get defaultTemplateIcon(): string | null {
    /*if (!this.iconBundle) { return null; }
    if (!this.dataFile) { return null; }
    return SzDataFile.getDefaultTemplateIcon(this.dataFile, this.iconBundle);*/
    return 'generic-datasource'
  }

  /*public get errorChannelName(): string {
    if (!this.data) { return ''; }
    return this.projectService.getFileErrorChannel(this.data.configId,
                                                   this.data.id);
  }*/

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
                      .replace('$(total)', f.totalSize.toString());
      case 'upload-pending':
        // upload-pending overlaps with processing state
        return format.replace('$(percent)', this.uploadPercent.toString())
                      .replace('$(count)', f.uploadedByteCount.toString())
                      .replace('$(total)', f.totalSize.toString())
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

  /*
  public get fileStatusTooltip(): string {
    const key = 'status-' + this.fileStatus + '-tooltip';
    const format = this.msg.get(key, null);
    return this.interpolateMessage(this.fileStatus, format);
  }*/
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

    // ------------ purely for debuging/forcing states
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
        //status = 'uploaded';
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
    /*this.data.fields.forEach(f => {
      if (f.attributeCode) {count++; }
    });*/
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
    /*this.data.fields.forEach(f => {
      if (f.attributeCode) {count++; }
    });*/
    return count;
    //return this.data.fields.length - count;
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

  /*
  private setUpErrorChannelSubscription() {
    // we only want to set up the observeable once.
    if(!this._errorSubscription && this.data && this.data.id && this.data.projectId) {
      const errorChannel = this.projectService.getFileErrorChannel( this.data.projectId, this.data.id );
      if (errorChannel !== this._errorChannel) {
        this._errorChannel = errorChannel;
        this._errors = this.errorsService.getErrors(this._errorChannel);
        this._errorSubscription = this.errorsService.observeErrors(this._errorChannel).pipe(
          takeUntil(this.unsubscribe$),
          map(() => true),
          debounceTime(500)
        )
        .subscribe(() => {
          const prevCount = (this._errors) ? this._errors.length : 0;
          this._errors = this.errorsService.getErrors(this._errorChannel);
          const curCount = (this._errors) ? this._errors.length : 0;
          if(prevCount !== curCount) {
            console.warn('change to errors coming from error channel: ', this._errors);
          }
        });
        console.info('set up error channel for "'+ this.data.id +'": '+ this._errorChannel);
      }
    }
  }*/

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
        retVal = retVal.substr(this._wrapToolTipCharsLength);
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
    //this.emitEvent(SzDataCardEventType.CANCEL_EDIT);
  }

  public activateEditMode() : void {
    if (this.editMode) return;
    /*
    this.editedData = (this.data)
                      ? JSON.parse(JSON.stringify(this.data))
                      : this.constructDataObject();
    */
    this.editMode = true;
    //this.emitEvent(SzDataCardEventType.BEGIN_EDIT);
  }

  /** there is only one "status" button but it should only be called out if in a
   * specific state like "load" or "map" etc.. this transposes the status to the matching
   * SzDataFileCardHighlightType
   */
  public getElementTypeFromStatus(status: string): SzDataFileCardHighlightType | undefined {
    if(status && status.toUpperCase){
      switch(status.toUpperCase()) {
        case 'MAPPED':
          // mapped is really "load"
          return 'load';
          break;
        case 'UNMAPPED':
          // unmapped is really "map"
          return "map";
          break;
        case 'COMPLETED':
          // completed is really "review"
          return 'review';
          break;
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
    //private projectService: SzProjectHttpService,
    private dataSourcesService: SzDataSourcesService,
    //private entityTypeService: SzEntityTypeService,
    //private errorsService: SzServerErrorsService,
    private decimalPipe: DecimalPipe,
    //private dialogService: SzDialogService
  ) {

  }

  ngAfterViewInit() {
    //this.currentContextTitle = null;

    //super.ngAfterInit();
    //console.warn('SzDataSourceCardComponent.ngAfterInit');
  }

  ngOnInit() {
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
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
    if (this.data.dataSource && this.data.dataSource.DSRC_CODE.trim().length > 0) return false;
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

  /*
  private ensureDataSourceUnique(code: string): Promise<SzDataFile> {
    const codePrefix = code.replace(/(.*) [\d]+$/g, '$1');
    return new Promise<SzDataFile>((resolve, reject) => {
      this.projectService.getProjectFiles(this.data.projectId)
        .toPromise()
        .then(files => {
          const dataSources = {};
          let targetFile;
          files.forEach(f => {
            // ignore if the file is the current file
            if (f.id === this.data.id) {
              targetFile = f;
              return;
            }

            // ignore files whose mapping is not yet complete
            if (!f.mappingComplete) {
              return;
            }

            // record the data source
            dataSources[f.dataSource.trim().toUpperCase()] = true;
          });

          // check if no conflicts
          if (!dataSources[code]) {
            // resolve with the target file
            if (targetFile.dataSource.trim().toUpperCase() !== code.trim().toUpperCase()) {
              targetFile.dataSource = code;
            }
            resolve(targetFile);
            return;
          }

          // try to find a non-conflicting data source
          let suffix = 2;
          while (dataSources[codePrefix + ' ' + suffix]) {
            suffix++;
          }
          const pid = this.data.projectId;
          const fid = this.data.id;
          const desc = targetFile.dataSource.replace(/(.*) [\d]+$/g, '$1');
          this.data.dataSource = desc + ' ' + suffix;
          const updatedData = {dataSource: `${codePrefix} ${suffix}`};
          this.projectService.updateProjectFile(updatedData, pid, fid)
            .toPromise()
            .then(f => resolve(f))
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
  }*/

  /*
  private ensureDataSource(dataSourceCode: string, dataSourceDesc: string)
    : Promise<SzDataSource> {
    return new Promise<SzDataSource>((resolve, reject) => {
      this.dataSourceService.getDataSource(this.data.projectId, dataSourceCode)
        .toPromise()
        .then((ds: SzDataSource) => {
          resolve(ds);
          return;
        })
        .catch(() => {
          this.dataSourceService.createDataSource(
            {code: dataSourceCode, description: dataSourceDesc}, this.data.projectId)
            .toPromise()
            .then((ds: SzDataSource) => {
              resolve(ds);
            })
            .catch(err => {
              console.error(err);
              reject(err);
            });
        });
    });
  }*/
}
