import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { SzPrefsService } from '@senzing/eval-tool-ui-common';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    imports: [
      CommonModule,
      FormsModule
    ]
  })
  export class AppSettingsComponent implements OnInit, OnDestroy {
    /** subscription to notify subscribers to unbind */
    public unsubscribe$ = new Subject<void>();

    constructor(
      private titleService: Title,
      public prefs: SzPrefsService
    ) {}

    ngOnInit() {
      this.titleService.setTitle('Settings');
    }

    ngOnDestroy() {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
}
