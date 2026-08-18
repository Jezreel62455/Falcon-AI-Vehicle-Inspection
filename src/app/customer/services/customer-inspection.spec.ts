import { TestBed } from '@angular/core/testing';

import { CustomerInspection } from './customer-inspection';

describe('CustomerInspection', () => {
  let service: CustomerInspection;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerInspection);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
