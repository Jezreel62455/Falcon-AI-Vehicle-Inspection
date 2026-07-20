import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-new-inspection',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './new-inspection.html',
  styleUrl: './new-inspection.css'
})
export class NewInspection {

  private fb = inject(FormBuilder);

  customerForm = this.fb.group({
    firstName:['', Validators.required],
    surname:['', Validators.required],
    phone:[''],
    email:['']
  });

  policyForm = this.fb.group({
    policy:['', Validators.required],
    company:[''],
    assessor:['']
  });

  vehicleForm = this.fb.group({
    registration:[''],
    vin:[''],
    make:[''],
    model:[''],
    year:[''],
    colour:[''],
    mileage:['']
  });

}