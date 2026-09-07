import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Submitted } from './submitted';

describe('Submitted', () => {
  let component: Submitted;
  let fixture: ComponentFixture<Submitted>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Submitted],
    }).compileComponents();

    fixture = TestBed.createComponent(Submitted);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
