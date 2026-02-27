import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Overlay } from '@angular/cdk/overlay';
import { Title } from '@angular/platform-browser';
import { Subject, of } from 'rxjs';
import { DetailComponent } from './detail.component';
import { EntitySearchService } from '../services/entity-search.service';
import { UiService } from '../services/ui.service';

describe('DetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailComponent],
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
          },
        },
        {
          provide: UiService,
          useValue: {
            createPdfClicked: new Subject(),
            spinnerActive: false,
          },
        },
        Overlay,
        Title,
      ],
    })
      .overrideComponent(DetailComponent, {
        set: { imports: [], template: '' },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DetailComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
