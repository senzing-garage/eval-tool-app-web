import { Component, Inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
//import { SzGlobalRuntime } from '../../services/global-runtime.service';
//import { SzMessageHandler, SzMessageHandlerView } from '../../i18n/message-handler';
import { SzDeferred } from '../../common/deferred/deferred';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface SzCommonDialogOptions {
  /**
   * The dialog title.
   */
  title?: string | null;

  /**
   * The primary (and posisbly only) message for the dialog to display.
   * At least "message" or "messages" should be specified, if not both.
   */
  message?: string | null;

  /**
   * A list of secondary messages to be displayed in the dialog.
   * At least "message" or "messages" should be specified, if not both.
   * The secondary messages may appear as a bullet list or in separate
   * wizard panes that are stepped through with a next and optional previous button.
   */
  messages?: string[] | null;

  /**
   * The minimum width for the body of the dialog in pixels.
   */
  bodyMinWidth?: number | null;

  /**
   * The maximum width for the body of the dialog in pixels.
   */
  bodyMaxWidth?: number | null;

  /**
   * The minimum height for the body of the dialog in pixels.
   */
  bodyMinHeight?: number | null;

  /**
   * The maximum height for the body of the dialog in pixels.
   */
  bodyMaxHeight?: number | null;

  /**
   * Provide this if the dialog should have a confirmation button to dismiss it with
   * an affirmative response.  If you specify SzCommonDialog.DEFAULT_LABEL as the
   * value then the default label for the confirmation button is used (e.g.: "OK").
   */
  actionConfirmText?: string | null;

  /**
   * Provide this if the dialog has a confirmation button and you want to provide
   * a CSS class for that confirmation button.  Ignored if actionConfirmText is
   * not provided.
   */
  actionConfirmClass?: string | null;

  /**
   * Provide this if the dialog should have a cancel button to dismiss it with
   * a negative response.  If you specify SzCommonDialog.DEFAULT_LABEL as the value
   * then the default label for the cancellation button is used (e.g.: "Cancel")
   */
  actionCancelText?: string | null;

  /**
   * Provide this if the dialog has a cancellation button and you want to provide
   * a CSS class for that cancellation button.  Ignored if actionCancelText is
   * not provided.
   */
  actionCancelClass?: string | null;

  /**
   * Provide this if you want the dialog to provide a toggle whose state will be
   * included in the result.  This is often used to suppress the same dialog in
   * the future.  If you specify SzCommonDialog.DEFAULT_LABEL as the value then
   * the default label for the toggle is used (e.g.: "Don't show again")
   */
  actionToggleText?: string | null;

  /**
   * Provide this if the dialog has a toggle and you want to control the initial
   * state of that toggle (true or false).  Ignored if actionToggleText is not
   * provided.
   */
  actionToggleChecked?: boolean | null;

  /**
   * Provide this if the dialog has a toggle and you want to provide a CSS class
   * for the toggle button.  Ignored if actionToggleText is not provided.
   */
  actionToggleClass?: string | null;

  /**
   * Specify as true if the content message is HTML, otherwise <tt>false</tt>.
   */
  contentIsHtml?: boolean | null;

  /**
   * Provide this if you want to apply a CSS class to the body of the dialog.
   */
  bodyClass?: string | null;

  /**
   * Provide this if you want to use a material icons mnemonic to display an
   * icon in the dialog (e.g.: "error", "warning" or "info").
   */
  icon?: string | null;

  /**
   * Provide this if your dialog has an icon and you want to set the color of
   * the icon.  This is ignored if "icon" is not provided.
   */
  iconColor?: string | null;

  /**
   * Provide this if you want the user to step through the provided messages
   * in the "messages" array one at a time with a "next" button.  If a non-empty
   * messages array is not provided then this is ignored.
   */
  actionNextText?: string | null;

  /**
   * Provide this to apply a CSS class to the "next" button.  This is ignored if
   * actionNextText is not provided or if a non-empty messages array is not provided.
   */
  actionNextClass?: string | null;

  /**
   * Provide this if you want the user to be able to step backwards through the
   * provided messages in the "messages" array one at a time with a "previous" button.
   * If there is no "next" button configured or a non-empty messages array is not
   * provided then this is ignored.
   */
  actionPreviousText?: string | null;

  /**
   * Provide this to apply a CSS class to the "previous" button.  This is ignored if
   * actionPreviousText is not provided or there is not a previous button due to no
   * messages.
   */
  actionPreviousClass?: string | null;
}

/**
 * Describes a complex result from the dialog when a toggle button or multiple panes
 * are used in the dialog (i.e.: wizard mode).
 */
export interface SzCommonDialogResult {
  confirmed: boolean;
  toggle?: boolean;
  viewedMessages?: number;
}

@Component({
  selector: 'sz-dialog',
  templateUrl: './common-dialog.component.html',
  styleUrls: ['./common-dialog.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule
  ]
})
export class SzCommonDialogComponent
  implements OnInit, AfterViewInit, SzCommonDialogOptions
{
  public static readonly DEFAULT_LABEL: string = "[__DEFAULT_LABEL__]";

  // basic dialog options
  public title?: string | null | undefined;
  public message: string | null | undefined;
  public messages: string[] | null | undefined;
  public actionToggleChecked: boolean | null | undefined;
  public actionToggleText: string | null | undefined;
  public actionToggleClass: string | null | undefined;
  public contentIsHtml: boolean = false;
  public bodyMinWidth: number | null | undefined;
  public bodyMinHeight: number | null | undefined;
  public bodyMaxWidth: number | null | undefined;
  public bodyMaxHeight: number | null | undefined;
  public bodyClass: string = 'sz-dialog-body';
  public icon: string | null | undefined;
  public iconColor: string | null | undefined;

  // alert & confirm dialogs
  public actionConfirmText: string | null | undefined;
  public actionCancelText: string | null | undefined;
  public actionNextText: string | null | undefined;
  public actionPreviousText: string | null | undefined;
  public actionConfirmClass: string | null | undefined;
  public actionCancelClass: string | null | undefined;
  public actionNextClass: string | null | undefined;
  public actionPreviousClass: string | null | undefined;

  private _currentPane: number = 0;
  private maxPaneViewed: number = 0;

  @ViewChild("wizardPaneContainer")
  private wizardPaneContainer : ElementRef;

  @ViewChild('messageContainer')
  private messagesContainer: ElementRef;

  @ViewChild('dialogBody')
  private dialogBody: ElementRef;

  @ViewChild('dialogContent')
  private dialogContent: ElementRef;

  // static
  //private static _msgHandler: SzMessageHandler = new SzMessageHandler('sz.commonDialog');

  // message handler
  //private msgHandler: SzMessageHandler = SzCommonDialogComponent._msgHandler;

  private _viewInitialized: boolean = false;
  private _viewInitializedDeferred: SzDeferred<boolean> = new SzDeferred<boolean>();

  /*public get msg() : SzMessageHandlerView {
    return this.msgHandler.view;
  }*/

  public getLabel(label: string, defaultLabel: string, wizardLabel?: string) : string {
    if (this.wizard && wizardLabel) {
      return wizardLabel;
    } else if (label === SzCommonDialogComponent.DEFAULT_LABEL) {
      return defaultLabel;
    } else {
      return label;
    }
  }

  public get currentPane() : number {
    const length = this.messages.length;
    if (length === 0) return -1;
    if (this._currentPane < 0) return 0;
    if (this._currentPane >= length) return length - 1;
    return this._currentPane;
  }

  public set currentPane(val: number) {
    const length = this.messages.length;
    if ((length === 0) || (val < 0)) val = 0;
    else if (val >= length) val = length - 1;
    this._currentPane = val;
  }

  public get viewedMessageCount() : number {
    if (!this.wizard) return 0;
    if (this.maxPaneViewed >= this.messages.length) return this.messages.length;
    return (this.maxPaneViewed + 1);
  }

  public getResult(confirmed: boolean) : boolean | SzCommonDialogResult {
    if (!this.wizard && !this.toggleButton) return confirmed;
    const result : SzCommonDialogResult = { confirmed: confirmed };
    if (this.toggleButton) result.toggle = this.actionToggleChecked;
    if (this.wizard) result.viewedMessages = this.viewedMessageCount;
    return result;
  }

  public get lastPane() : boolean {
    return this.currentPane >= (this.messages.length - 1);
  }

  public get firstPane() : boolean {
    return this.currentPane <= 0;
  }

  public get viewInitialized() : boolean {
    return this._viewInitialized;
  }

  public get wizard() : boolean {
    if (!this.messages) return false;
    if (this.messages.length < 2) return false;
    if (!this.actionNextText) return false;
    if (this.actionNextText.trim().length === 0) return false;
    return true;
  }

  public get toggleButton() : boolean {
    return (this.actionToggleText && this.actionToggleText.trim().length > 0);
  }

  public get cancelButton() : boolean {
    return (this.actionCancelText && this.actionCancelText.trim().length > 0);
  }

  public get confirmButton() : boolean {
    return (this.actionConfirmText && this.actionConfirmText.trim().length > 0);
  }

  public get nextButton() : boolean {
    return (this.wizard);
  }

  public get previousButton() : boolean {
    return (this.wizard && this.actionPreviousText && this.actionPreviousText.trim().length > 0);
  }

  public goNextPane() {
    const length = this.messages.length;
    if (length === 0) this._currentPane = -1;
    else if (this._currentPane < (length-1)) this._currentPane++;
    else this._currentPane = (length -1);
    if (this._currentPane > this.maxPaneViewed) {
      this.maxPaneViewed = this._currentPane;
    }
  }

  public goPreviousPane() {
    const length = this.messages.length;
    if (length === 0) this._currentPane = -1;
    else if (this._currentPane > 0) this._currentPane--;
    else this._currentPane = 0;
  }

  private mergeClasses(appendClasses: string | string[], baseClasses?: string | string[]) : string {
    // append classStr to actionCancelClass
    const classes : string[] = [];
    if(baseClasses) {
      if (typeof baseClasses === 'string') {
        classes.push(<string> baseClasses);
      } else {
        (<string[]> baseClasses).forEach(c => classes.push(c));
      }
    }
    if(appendClasses) {
      if (typeof appendClasses === 'string') {
        classes.push(<string> appendClasses);
      } else {
        (<string[]> appendClasses).forEach(c => classes.push(c));
      }
    }
    return classes.join(' ');
  }

  public getToggleButtonClass(classStr?: string | string[]) : string {
    return this.mergeClasses(this.actionToggleClass, classStr);
  }

  public getCancelButtonClass(classStr?: string | string[]) : string {
    return this.mergeClasses(this.actionCancelClass, classStr);
  }

  public getPreviousButtonClass(classStr?: string | string[]) : string {
    return this.mergeClasses(this.actionPreviousClass, classStr);
  }

  public getNextButtonClass(classStr?: string | string[]) : string {
    return this.mergeClasses(this.actionNextClass, classStr);
  }

  public getConfirmButtonClass(classStr?: string | string[]) : string {
    return this.mergeClasses(this.actionConfirmClass, classStr);
  }

  @ViewChild("content")
  public contentElem: ElementRef;

  constructor(public dialogRef: MatDialogRef<SzCommonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

  }

  ngOnInit() {
    if (this.data) {
      for (const _key in this.data) {
        //if (this.hasOwnProperty(_key)) {
          this[_key] = this.data[_key];
        //}
      }
    }
  }

  ngAfterViewInit() {
    /*
    this.msgHandler.processMessages(this.messagesContainer);

    this.msgHandler.readyPromise.then(() => {
      setTimeout(() => {
        const confirmElem = this.dialogBody.nativeElement.querySelector("mat-dialog-actions button.confirm-button");
        const nextElem = this.dialogBody.nativeElement.querySelector("mat-dialog-actions button.next-button");
        if (confirmElem && nextElem) {
          const confirmWidth          = confirmElem.scrollWidth + 1;
          const nextWidth             = nextElem.scrollWidth + 1;
          const maxWidth              = (confirmWidth > nextWidth) ? confirmWidth : nextWidth;
          confirmElem.style.minWidth  = maxWidth + "px";
          nextElem.style.minWidth     = maxWidth + "px";
        }
        if (this.bodyMaxWidth !== null && this.bodyMaxWidth !== undefined) {
          const actionBar = this.dialogBody.nativeElement.querySelector('mat-dialog-actions');
          if (actionBar) {
            const actionBarPxWidth = getComputedStyle(actionBar).width;
            const actionBarWidth = Number(actionBarPxWidth.substring(0, actionBarPxWidth.length - 2));
            if (actionBarWidth > this.bodyMaxWidth) {
              setTimeout(() => {
                this.bodyMaxWidth = actionBarWidth;
              });
            }
          }
        }
        setTimeout(() => {
          this._viewInitialized = true;
          this._viewInitializedDeferred.resolve(true);
        } );
      });
    });
    */
    setTimeout(() => {
      this._viewInitialized = true;
      this._viewInitializedDeferred.resolve(true);
    });

    if (this.wizardPaneContainer) {
      this._viewInitializedDeferred.promise.then(() => {
        this.wizardPaneContainer.nativeElement.querySelectorAll("div.wizard-pane")
          .forEach(elem => {
            const container       = this.wizardPaneContainer.nativeElement;
            const containerWidth  = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            const paneWidth       = elem.scrollWidth;
            const paneHeight      = elem.scrollHeight;
            if (containerWidth < paneWidth) {
              container.style.width     = paneWidth + "px";
              container.style.minWidth  = paneWidth + "px";
              container.style.maxWidth  = paneWidth + "px";
            }
            if (containerHeight < paneHeight) {
              container.style.height    = paneHeight + "px";
              container.style.minHeight = paneHeight + "px";
              container.style.maxHeight = paneHeight + "px";
            }

            if (this.contentIsHtml) {
              elem.querySelectorAll("a[href]")
                .forEach(link => {
                  link.addEventListener("click", (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const target = event.target;
                    const href = target.getAttribute("href");
                    //this.globalRuntime.openBrowserWindow(href);
                  });
                });
            }
          });
      });
    }

    if ( !this.contentIsHtml || !this.contentElem) {
      // if content not html dont bother parsing
      return;
    }

    this._viewInitializedDeferred.promise.then(() => {
      setTimeout(() => {
        this.dialogContent.nativeElement.scrollTop = 0;
      }, 300);
      setTimeout(() => {
        this.dialogContent.nativeElement.scrollTop = 0;
      }, 600);
      setTimeout(() => {
        this.dialogContent.nativeElement.scrollTop = 0;
      }, 900);
    });

    this.contentElem.nativeElement.querySelectorAll("a[href]")
        .forEach(elem => {
          elem.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const target = event.target;
            const href = target.getAttribute("href");
            //this.globalRuntime.openBrowserWindow(href);
          });
        });
  }

}
