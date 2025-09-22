import { Observable, Subject, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { SzCommonDialogComponent, SzCommonDialogOptions, SzCommonDialogResult } from './common-dialog.component';
import { MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Injectable, TemplateRef } from '@angular/core';

export const SZ_DIALOG_DEFAULT_LABEL = SzCommonDialogComponent.DEFAULT_LABEL;

/**
 * Utility class for working with dialog configuration for a generic Senzing dialog.
 */
export class SzDialogConfig {

  private static readonly dialogDefaults : MatDialogConfig<SzCommonDialogOptions> = {
    ariaDescribedBy: null,
    ariaLabel: null,
    // ariaLabelledBy: null, // uncomment this after upgrading to latest Angular Material
    autoFocus: true,
    backdropClass: 'sz-dialog-backdrop',
    closeOnNavigation: true,
    direction: null,
    disableClose: false,
    hasBackdrop: true,
    height: null,
    width: null,
    id: null,
    maxHeight: null,
    maxWidth: '80vw',
    minHeight: null,
    minWidth: null,
    panelClass: 'sz-dialog',
    position: null,
    // restoreFocus: true, // uncomment this after upgrading to latest Angular Material
    role: 'dialog',
    scrollStrategy: null,
    viewContainerRef: null,
    data: {
      title: null,
      message: null,
      messages: null,
      bodyMinWidth: null,
      bodyMaxWidth: null,
      bodyMinHeight: null,
      bodyMaxHeight: null,
      actionConfirmText: null,
      actionConfirmClass: null,
      actionCancelText: null,
      actionCancelClass: null,
      actionToggleText: null,
      actionToggleClass: null,
      actionToggleChecked: null,
      actionNextText: null,
      actionNextClass: null,
      actionPreviousText: null,
      actionPreviousClass: null,
      contentIsHtml: false,
      bodyClass: 'sz-dialog-body',
      icon: null,
      iconColor: null
    }
  };

  /**
   * Gets the defaults for a generic Senzing dialog and optionally overrides settings in the defaults with
   * the specified options.  The returned object may be directly modified as it is a new object.
   *
   * @param options The optional overrides for the defaults.
   *
   * @return The MatDialogConfig<SzCommonDialogOptions> describing the default options for a generic
   *         Senzing dialog, optionally with the specified overrides.
   */
  public static defaults(options?: MatDialogConfig<SzCommonDialogOptions>)
    : MatDialogConfig<SzCommonDialogOptions>
  {
    return SzDialogConfig.override(options);
  }


  /**
   * Handles concatenation of panel classes.
   */
  private static handleArrayConcat<D = any>(target: any, overrides: any, base: any, key: string)
    : boolean
  {
    // check if dealing with the panelClass array with the first element being null
    if ((key in overrides) && (overrides[key] !== null)
        && (overrides[key] !== undefined) && ((typeof overrides[key]) === 'object')
        && ("length" in (<object>overrides[key])) && ((<string[]> overrides[key])[0] === null))
    {
      const arr : string[] = <string[]> overrides[key];
      const val : string[] = [];
      if (typeof base[key] === 'string') {
        val.push(<string> base[key]);
      } else {
        (<string[]> base[key]).forEach(c => {
          val.push(c);
        });
      }
      arr.filter(c => (c !== null)).forEach(c => val.push(c));
      target[key] = val;
      return true;
    }
    return false;
  }

  /**
   * This is handy when you have a MatDialogConfig<T> where T is NOT SzCommonDialogOptions but some options
   * for some custom dialog but you want to set all fields in the config the same as the defaults for
   * SzDialogConfig.  This will not modify the "data" field of the specified target option.  Fields in the
   * specified target that are already defined as a non-null value will NOT be modified.
   *
   * @param target The config to be modified.
   * @param defaults The defaults to be injected.  If omitted then the standard Senzing Dialog defaults are used.
   *
   * @return The specified target config that may have been modified.
   */
  public static injectDefaults<D = any>(target: MatDialogConfig<D>,
                                        defaults: MatDialogConfig<SzCommonDialogOptions> = SzDialogConfig.dialogDefaults)
    : MatDialogConfig<D>
  {
    const baseConfig : MatDialogConfig<SzCommonDialogOptions> = JSON.parse(JSON.stringify(defaults));
    if (!target) target = {};

    for (const key in baseConfig) {
      // skip the data fields since we have a config for a custom unknown component
      if (key === 'data') continue;

      if (key === 'panelClass' && SzDialogConfig.handleArrayConcat(target, target, defaults, key)) continue;

      // if the specified options have a specific setting configured, then keep it
      if ((key in target) && (target[key] !== null) && (target[key] !== undefined)) continue;

      // otherwise inject the Senzing dialog default setting
      target[key] = baseConfig[key];
    }
    return target;
  }

  /**
   * Extends the defaults for a generic Senzing dialog by using the specified extensions to override
   * and augment the properties associated with defaults.  This is useful if deriving from
   * SzCommonDialogComponent and you want to use the defaults but add values for additional properties.
   * The returned object may be directly modified as it is a new object.
   *
   * @param extensions The properties and values to use to override and extend the defaults.
   *
   * @return The MatDialogConfig<E> describing the extended config.
   */
  protected static extendDefaults<E extends SzCommonDialogOptions>(extensions: MatDialogConfig<E>)
    : MatDialogConfig<E>
  {
    return SzDialogConfig.doExtendDefaults(extensions, SzDialogConfig.dialogDefaults);
  }

  /**
   * Similar to "extendDefaults" except this version lets the caller specify the base defaults to
   * extend from.  This is useful when further providing a way to extend what has already been extended.
   *
   * @param extensions The properties and values to use to override and extend the defaults.
   *
   * @param baseDefaults The base defaults to extend.
   *
   * @return The MatDialogConfig<E> describing the extended config.
   */
  protected static doExtendDefaults<E extends B, B extends SzCommonDialogOptions>(extensions: MatDialogConfig<E>,
                                                                                  baseDefaults: MatDialogConfig<B>)
    : MatDialogConfig<E>
  {
    const config : MatDialogConfig<E> = JSON.parse(JSON.stringify(baseDefaults));
    if (extensions) {
      for (const key in extensions) {
        if (config.hasOwnProperty(key) && (key !== 'data')) {
          config[key] = extensions[key];
        }
      }
      if (extensions.data) {
        for (const key in extensions.data) {
          config.data[key] = extensions.data[key];
        }
      }
    }
    return config;
  }

  /**
   * Similar to "defaults" except this version lets the caller specify the base defaults to be
   * overridden.  If the defaults are not specified then the generic defaults for a Senzing dialog
   * are used.
   *
   * @param options The values to override with.
   *
   * @param defaults The base defaults.
   *
   * @return The newly created MatDialogConfig<SzCommonDialogOptions> from the specified defaults
   *         and the specified overrides.
   */
  protected static override(options: MatDialogConfig<SzCommonDialogOptions>,
                            defaults: MatDialogConfig<SzCommonDialogOptions> = SzDialogConfig.dialogDefaults)
    : MatDialogConfig<SzCommonDialogOptions>
  {
    const config : MatDialogConfig<SzCommonDialogOptions> = JSON.parse(JSON.stringify(defaults));
    if (options) {
      for (const key in options) {
        if (config.hasOwnProperty(key) && (key !== 'data')) {
          if (key !== 'panelClass' || !this.handleArrayConcat(config, options, config, key)) {
            config[key] = options[key];
          }
        }
      }
      if (options.data) {
        for (const key in options.data) {
          if (config.data.hasOwnProperty(key)) {
            config.data[key] = options.data[key];
          }
        }
      }
    }
    return config;
  }
}

/**
 * Utility class for working with dialog configuration for a Senzing alert dialog.
 */
export class SzAlertDialogConfig extends SzDialogConfig {

  private static readonly alertDefaults: MatDialogConfig<SzCommonDialogOptions>
    = SzDialogConfig.extendDefaults(<MatDialogConfig<SzCommonDialogOptions>>{
        autoFocus: false,
        disableClose: true,
        hasBackdrop: true,
        backdropClass: 'sz-dialog-alert-backdrop',
        panelClass: 'sz-dialog-alert',
        role: 'alertdialog',
        data: {
          bodyClass: 'sz-dialog-alert-body',
          bodyMinWidth: 250,
          bodyMaxWidth: 300,
          actionConfirmText: SZ_DIALOG_DEFAULT_LABEL,
          actionConfirmClass: null,
          actionNextText: null,
          actionNextClass: null,
          actionPreviousText: null,
          actionPreviousClass: null
        }});

  /**
   * Gets the defaults for a Senzing alert dialog and optionally overrides settings in the defaults with
   * the specified options.  The returned object may be directly modified as it is a new object.
   *
   * @param options The optional overrides for the defaults.
   *
   * @return The MatDialogConfig<SzCommonDialogOptions> describing the default options for a Senzing
   *         alert dialog, optionally with the specified overrides.
   */
  public static override defaults(options: MatDialogConfig<SzCommonDialogOptions>)
    : MatDialogConfig<SzCommonDialogOptions>
  {
    return SzDialogConfig.override(options, SzAlertDialogConfig.alertDefaults);
  }

  /**
   * Extends the defaults for a Senzing alert dialog by using the specified extensions to override
   * and augment the properties associated with defaults.  This is useful if deriving from
   * SzCommonDialogComponent and you want to use the defaults but add values for additional properties.
   * The returned object may be directly modified as it is a new object.
   *
   * @param extensions The properties and values to use to override and extend the defaults.
   *
   * @return The MatDialogConfig<E> describing the extended config.
   */
  protected static override extendDefaults<E extends SzCommonDialogOptions>(extensions: MatDialogConfig<E>)
    : MatDialogConfig<E>
  {
    return SzDialogConfig.doExtendDefaults(extensions, SzAlertDialogConfig.alertDefaults);
  }
}

/**
 * Utility class for working with dialog configuration for a Senzing confirmation dialog.
 */
export class SzConfirmDialogConfig extends SzAlertDialogConfig {

  private static readonly confirmDefaults: MatDialogConfig<SzCommonDialogOptions>
    = SzAlertDialogConfig.extendDefaults(<MatDialogConfig<SzCommonDialogOptions>>{
      backdropClass: 'sz-dialog-confirm-backdrop',
      panelClass: 'sz-dialog-confirm',
      data: {
        bodyClass: 'sz-dialog-confirm-body',
        bodyMinWidth: 300,
        bodyMaxWidth: 400,
        bodyMinHeight: 50,
        bodyMaxHeight: 300,
        actionCancelText: SZ_DIALOG_DEFAULT_LABEL,
        actionCancelClass: null
      }});

  /**
   * Gets the defaults for a Senzing confirmation dialog and optionally overrides settings in the
   * defaults with the specified options.  The returned object may be directly modified as it is a
   * new object.
   *
   * @param options The optional overrides for the defaults.
   *
   * @return The MatDialogConfig<SzCommonDialogOptions> describing the default options for a Senzing
   *         confirmation dialog, optionally with the specified overrides.
   */
  public static override defaults(options: MatDialogConfig<SzCommonDialogOptions>)
    : MatDialogConfig<SzCommonDialogOptions>
  {
    return SzAlertDialogConfig.override(options, SzConfirmDialogConfig.confirmDefaults);
  }

  /**
   * Extends the defaults for a Senzing confirmation dialog by using the specified extensions to
   * override and augment the properties associated with defaults.  This is useful if deriving
   * from SzCommonDialogComponent and you want to use the defaults but add values for additional
   * properties.  The returned object may be directly modified as it is a new object.
   *
   * @param extensions The properties and values to use to override and extend the defaults.
   *
   * @return The MatDialogConfig<E> describing the extended config.
   */
  protected static override extendDefaults<E extends SzCommonDialogOptions>(extensions: MatDialogConfig<E>)
    : MatDialogConfig<E>
  {
    return SzDialogConfig.doExtendDefaults(extensions, SzConfirmDialogConfig.confirmDefaults);
  }
}

export interface ComponentType<T> {
  new (...args: any[]): T;
}

/**
 * Dialog Service
 * has convenience methods for quickly opening Confirms, Alerts, and Modals.
 *
 */
@Injectable()
export class SzDialogService {
  public isDialogOpen: Subject<boolean> = new Subject<boolean>();

  constructor(private dialog: MatDialog) {
    // convenience checker
    this.dialog.afterOpened.subscribe(dRef => this.isDialogOpen.next(true) );
    this.dialog.afterAllClosed.subscribe(dRef => this.isDialogOpen.next(false) );
  }

  private openDialog(options: MatDialogConfig<SzCommonDialogOptions>)
    : MatDialogRef<SzCommonDialogComponent>
  {
    let dialogRef: MatDialogRef<SzCommonDialogComponent>;
    dialogRef = this.dialog.open(SzCommonDialogComponent, options);

    return dialogRef;
  }

  public openFromComponent<T, D = any>(componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
                                       options?: MatDialogConfig<D>)
    : Observable<any>
  {
    SzDialogConfig.injectDefaults(options);

    let dialogRef: MatDialogRef<T>;
    dialogRef = this.dialog.open(componentOrTemplateRef, options);
    return dialogRef.afterClosed();
  }


  private doOpen(messageOrMessages: string|string[], title?: string, options?: MatDialogConfig<SzCommonDialogOptions>)
    : Observable<boolean | SzCommonDialogResult>
  {
    const dialogOptions = SzDialogConfig.defaults(options);
    dialogOptions.data.title = title;
    if (typeof messageOrMessages === 'string') {
      dialogOptions.data.message = messageOrMessages;
    } else {
      dialogOptions.data.messages = messageOrMessages;
    }

    const dialogRef: MatDialogRef<SzCommonDialogComponent> = this.openDialog(dialogOptions);

    return dialogRef.afterClosed();
  }

  public open(messageOrMessages: string|string[], title?: string, options?: MatDialogConfig<SzCommonDialogOptions>)
    : Observable<boolean>
  {
    return this.doOpen(messageOrMessages, title, options)
      .pipe(
        map( result => {
          if (typeof result === "object") {
            return result.confirmed;
          } else {
            return <boolean> result;
          }
        })
      );
  }

  public openWithResults(messageOrMessages: string|string[], title?: string, options?: MatDialogConfig<SzCommonDialogOptions>)
    : Observable<SzCommonDialogResult>
  {
    return this.doOpen(messageOrMessages, title, options)
      .pipe(
        map( result => {
          if (typeof result === "object") {
            return <SzCommonDialogResult> result;
          } else {
            return { confirmed: <boolean> result };
          }
        })
      );
  }

  private doConfirm(messageOrMessages: string|string[], title?: string, options?: MatDialogConfig<SzCommonDialogOptions>)
    : Observable<boolean|SzCommonDialogResult>
  {
    const dialogOptions = SzConfirmDialogConfig.defaults(options);
    dialogOptions.data.title = title;
    if (typeof messageOrMessages === 'string') {
      dialogOptions.data.message = messageOrMessages;
    } else {
      dialogOptions.data.messages = messageOrMessages;
    }
    if (!dialogOptions.data.actionConfirmText) dialogOptions.data.actionConfirmText = SZ_DIALOG_DEFAULT_LABEL;
    if (!dialogOptions.data.actionCancelText) dialogOptions.data.actionCancelText = SZ_DIALOG_DEFAULT_LABEL;

    const dialogRef: MatDialogRef<SzCommonDialogComponent> = this.openDialog(dialogOptions);

    return dialogRef.afterClosed();
  }

  public confirm(messageOrMessages: string|string[], title?: string, options?: MatDialogConfig<SzCommonDialogOptions>)
    : Observable<boolean>
  {
    return this.doConfirm(messageOrMessages, title, options)
      .pipe(
        map( result => {
          if (typeof result === "object") {
            return result.confirmed;
          } else {
            return <boolean> result;
          }
        })
      );
  }

  public confirmWithResults(messageOrMessages: string|string[], title?: string, options?: MatDialogConfig<SzCommonDialogOptions>)
    : Observable<SzCommonDialogResult>
  {
    return this.doConfirm(messageOrMessages, title, options)
      .pipe(
        map( result => {
          if (typeof result === "object") {
            return <SzCommonDialogResult> result;
          } else {
            return { confirmed: <boolean> result };
          }
        })
      );
  }

  private doAlert(messageOrMessages: string|string[], title?: string, options?: MatDialogConfig<SzCommonDialogOptions>)
    : Observable<boolean|SzCommonDialogResult> {
    const dialogOptions = SzAlertDialogConfig.defaults(options);
    dialogOptions.data.title = title;
    if (typeof messageOrMessages === 'string') {
      dialogOptions.data.message = messageOrMessages;
    } else {
      dialogOptions.data.messages = messageOrMessages;
    }
    if (!dialogOptions.data.actionConfirmText) dialogOptions.data.actionConfirmText = SZ_DIALOG_DEFAULT_LABEL;
    dialogOptions.data.actionCancelText = null;

    const dialogRef: MatDialogRef<SzCommonDialogComponent> = this.openDialog(dialogOptions);

    return dialogRef.afterClosed();
  }

  public alert(messageOrMessages: string|string[], title?: string, options?: MatDialogConfig<SzCommonDialogOptions>)
    : Observable<boolean>
  {
    return this.doAlert(messageOrMessages, title, options)
      .pipe(
        map( result => {
          if (typeof result === "object") {
            return result.confirmed;
          } else {
            return <boolean> result;
          }
        })
      );
  }

  public alertWithResults(messageOrMessages: string|string[], title?: string, options?: MatDialogConfig<SzCommonDialogOptions>)
    : Observable<SzCommonDialogResult>
  {
    return this.doAlert(messageOrMessages, title, options)
      .pipe(
        map( result => {
          if (typeof result === "object") {
            return <SzCommonDialogResult> result;
          } else {
            return { confirmed: <boolean> result };
          }
        })
      );
  }

}
