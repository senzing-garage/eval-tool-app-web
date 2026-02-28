import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Overlay } from '@angular/cdk/overlay';
import { Title } from '@angular/platform-browser';
import { Subject, BehaviorSubject, of } from 'rxjs';
import { GraphComponent } from './graph.component';
import { EntitySearchService } from '../services/entity-search.service';
import { UiService } from '../services/ui.service';
import { SzPrefsService, SzSearchService } from '@senzing/eval-tool-ui-common';

describe('GraphComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({}), params: of({}) },
        },
        {
          provide: Router,
          useValue: { navigate: jest.fn() },
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
          provide: UiService,
          useValue: {
            createPdfClicked: new Subject(),
            spinnerActive: false,
            graphOpen: false,
          },
        },
        {
          provide: SzPrefsService,
          useValue: {
            prefsChanged: new BehaviorSubject({}),
            graph: {
              prefsChanged: new BehaviorSubject({}),
              showLinkLabels: false,
            },
            entityDetail: {
              prefsChanged: new BehaviorSubject({}),
              hideGraphWhenZeroRelations: false,
            },
          },
        },
        {
          provide: SzSearchService,
          useValue: {},
        },
        Overlay,
        Title,
      ],
    })
      .overrideComponent(GraphComponent, {
        set: { imports: [], template: '' },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(GraphComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
