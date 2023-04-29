import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformationValueModelComponent } from './information-value-model.component';

describe('InformationValueModelComponent', () => {
  let component: InformationValueModelComponent;
  let fixture: ComponentFixture<InformationValueModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InformationValueModelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InformationValueModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
