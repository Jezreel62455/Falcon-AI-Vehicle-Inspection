import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateInspectionRequest } from './create-inspection-request';

describe('CreateInspectionRequest', () => {
  let component: CreateInspectionRequest;
  let fixture: ComponentFixture<CreateInspectionRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateInspectionRequest],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateInspectionRequest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
