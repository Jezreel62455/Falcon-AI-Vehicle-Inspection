import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inspection.html',
  styleUrl: './inspection.css',
})
export class Inspection {

  private readonly router = inject(Router);

  readonly photoSteps = [
    {
      title: 'Front of Vehicle',
      description:
        'Stand approximately 2 metres away and capture the entire front of the vehicle.',
      icon: '🚗',
    },
    {
      title: 'Rear of Vehicle',
      description:
        'Capture the full rear including the registration plate.',
      icon: '🚙',
    },
    {
      title: 'Driver Side',
      description:
        'Capture the complete driver side of the vehicle.',
      icon: '🚘',
    },
    {
      title: 'Passenger Side',
      description:
        'Capture the complete passenger side of the vehicle.',
      icon: '🚗',
    },
    {
      title: 'VIN Plate',
      description:
        'Take a clear photo of the VIN plate or VIN sticker.',
      icon: '🔖',
    },
    {
      title: 'Odometer',
      description:
        'Turn the ignition on and capture the mileage clearly.',
      icon: '📊',
    },
    {
      title: 'Engine Bay',
      description:
        'Open the bonnet and photograph the complete engine compartment.',
      icon: '🔧',
    },
    {
      title: 'Interior',
      description:
        'Capture the front interior including the steering wheel and dashboard.',
      icon: '💺',
    },
  ];

  currentStep = 0;

  get currentPhoto() {
    return this.photoSteps[this.currentStep];
  }

  get progress(): number {
    return ((this.currentStep + 1) / this.photoSteps.length) * 100;
  }

  next(): void {

    if (this.currentStep < this.photoSteps.length - 1) {

      this.currentStep++;

      return;

    }

    this.router.navigate([
      '/customer/review',
    ]);

  }

  previous(): void {

    if (this.currentStep > 0) {

      this.currentStep--;

      return;

    }

    this.router.navigate([
      '/customer/vehicle',
    ]);

  }

  uploadPhoto(): void {

    // AWS upload and camera integration
    // will be implemented later.

    this.next();

  }

}