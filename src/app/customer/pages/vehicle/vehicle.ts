import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import {
  CustomerInspectionService,
  VehicleDetails,
} from '../../services/customer-inspection';

@Component({
  selector: 'app-vehicle',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './vehicle.html',
  styleUrl: './vehicle.css',
})
export class Vehicle {

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly inspectionService = inject(CustomerInspectionService);

  readonly vehicleForm = this.fb.nonNullable.group({

    registration: [
      '',
      Validators.required,
    ],

    vin: [
      '',
      Validators.required,
    ],

    make: [
      '',
      Validators.required,
    ],

    model: [
      '',
      Validators.required,
    ],

    year: [
      '',
      Validators.required,
    ],

    colour: [
      '',
      Validators.required,
    ],

    mileage: [
      0,
      [
        Validators.required,
        Validators.min(0),
      ],
    ],

  });

  constructor() {

    const vehicle =
      this.inspectionService.getInspection().vehicle;

    this.vehicleForm.patchValue({

      registration: vehicle.registration,
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      colour: vehicle.colour,
      mileage: vehicle.mileage ?? 0,

    });

  }

  back(): void {

    this.router.navigate([
      '/customer/details',
    ]);

  }

  continue(): void {

    if (this.vehicleForm.invalid) {

      this.vehicleForm.markAllAsTouched();

      return;

    }

    const vehicle: VehicleDetails = {

      registration:
        this.vehicleForm.getRawValue().registration,

      vin:
        this.vehicleForm.getRawValue().vin,

      make:
        this.vehicleForm.getRawValue().make,

      model:
        this.vehicleForm.getRawValue().model,

      year:
        this.vehicleForm.getRawValue().year,

      colour:
        this.vehicleForm.getRawValue().colour,

      mileage:
        this.vehicleForm.getRawValue().mileage,

    };

    this.inspectionService.updateVehicle(vehicle);

    this.router.navigate([
      '/customer/inspection',
    ]);

  }

}