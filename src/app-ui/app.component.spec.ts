import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject, of } from 'rxjs';
import { AppComponent } from './app.component';
import { EntitySearchService } from './services/entity-search.service';
import { SpinnerService } from './services/spinner.service';
import { UiService } from './services/ui.service';
import { PrefsManagerService } from './services/prefs-manager.service';
import { SzGrpcConfigManagerService } from '@senzing/eval-tool-ui-common';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({}), params: of({}) },
        },
        {
          provide: Router,
          useValue: { navigate: jest.fn(), events: of() },
        },
        {
          provide: EntitySearchService,
          useValue: {
            currentlySelectedEntityId: undefined,
            results: of([]),
            searchTitle: '',
          },
        },
        {
          provide: BreakpointObserver,
          useValue: { observe: jest.fn(() => of({ matches: false })) },
        },
        {
          provide: SpinnerService,
          useValue: { active: false },
        },
        {
          provide: UiService,
          useValue: {
            searchExpanded: false,
            navExpanded: false,
            subNavExpanded: false,
            graphOpen: false,
            createPdfClicked: new Subject(),
            spinnerActive: false,
          },
        },
        {
          provide: PrefsManagerService,
          useValue: {
            storePrefsInLocalStorage: false,
            storePrefsInSessionStorage: false,
          },
        },
        {
          provide: SzGrpcConfigManagerService,
          useValue: {},
        },
      ],
    })
      .overrideComponent(AppComponent, {
        set: { imports: [], template: '' },
      })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
