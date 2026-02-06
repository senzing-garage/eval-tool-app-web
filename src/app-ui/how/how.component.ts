import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
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
export class HowComponent {
    @ViewChild('howEntityComponent') howEntityComponent: SzHowEntityGrpcComponent;

    private _entityId: number;
    sub: Subscription;
    overlayRef: OverlayRef | null;

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
        public overlay: Overlay,
        public uiService: UiService,
        private titleService: Title
    ) {
        this.route.params.subscribe((params) => {
            this.entityId = parseInt(params['entityId'], 10);
            this.titleService.setTitle(`How Entity ${this.entityId} Was Resolved`);
        });
    }

    onDataChanged(data: any) {
        console.log('How report data changed:', data);
    }

    onLoading(isLoading: boolean) {
        console.log('How report loading:', isLoading);
    }
}
