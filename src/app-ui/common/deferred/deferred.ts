export enum SzPromiseState {
  PENDING,
  FULFILLED,
  REJECTED
};

export class SzDeferred<T> {
  private _promise: Promise<T>;
  private _state : SzPromiseState = SzPromiseState.PENDING;
  private _result : any;
  private _resolve: (val: T) => void;
  private _reject: (reason: any) => void;

  constructor() {
    this._promise = new Promise((resolve,reject) => {
      this._resolve = resolve;
      this._reject  = reject;
    });
  }

  public get state() : SzPromiseState {
    return this._state;
  }

  public resolve(value: T): void {
    this._assertPending();
    this._resolve(value);
    this._state = SzPromiseState.FULFILLED;
  }

  public reject(reason: string): void {
    this._assertPending();
    this._reject(reason);
    this._state = SzPromiseState.REJECTED;
  }

  get promise(): Promise<T> {
    return this._promise;
  }

  private _assertPending(): void {
    if (this._state !== SzPromiseState.PENDING) {
      throw ("Promise already "
             + ((this._state === SzPromiseState.FULFILLED)
                ? "fulfilled" : "rejected"));
    }
  }

}
