import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  private _active = false;
  private _label = 'Loading';
  public spinnerObservable = new Subject<boolean>();

  // hard logic (equivalent of state force)
  public get active(): boolean {
    return this._active;
  }
  public set active(value: boolean) {
    this._active = value;
  }

  public get label(): string {
    return this._label;
  }
  public set label(value: string) {
    this._label = value;
  }

  // soft logic (obeys minTime and maxTime)
  public show(label?: string) {
    if (label) {
      this._label = label;
    }
    this.spinnerObservable.next( true );
  }
  public hide() {
    this.spinnerObservable.next( false );
    this._label = 'Loading';
  }

  constructor() {
    this.spinnerObservable.asObservable().subscribe(
      (state) => this._active = state
    );
  }
}
