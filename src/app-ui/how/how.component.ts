import { Component, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UiService } from '../services/ui.service';
import { SzHowEntityGrpcComponent } from '@senzing/eval-tool-ui-common';

@Component({
    selector: 'app-how',
    templateUrl: './how.component.html',
    styleUrls: ['./how.component.scss'],
    imports: [
        CommonModule,
        SzHowEntityGrpcComponent
    ]
})
export class HowComponent implements OnDestroy {
    private unsubscribe$ = new Subject<void>();
    @ViewChild('howEntityComponent') howEntityComponent: SzHowEntityGrpcComponent;

    private _entityId: number;

    /** local setter that sets selected entity at service level */
    public set entityId(value: number) {
        this._entityId = value;
    }

    /** get the currently selected entity from service level */
    public get entityId(): number {
        return this._entityId;
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        public uiService: UiService,
        private titleService: Title
    ) {
        this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            this.entityId = parseInt(params['entityId'], 10);
            this.titleService.setTitle(`How Entity ${this.entityId} Was Resolved`);
        });
    }

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    onDataChanged(data: any) {
        console.log('How report data changed:', data);
    }

    onLoading(isLoading: boolean) {
        console.log('How report loading:', isLoading);
    }
}
