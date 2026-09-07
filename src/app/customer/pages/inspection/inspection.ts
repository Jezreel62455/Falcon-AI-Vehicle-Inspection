import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';

import {
  CommonModule,
} from '@angular/common';

import {
  Router,
} from '@angular/router';

import {
  CustomerInspectionService,
  InspectionPhoto,
} from '../../services/customer-inspection';


interface PhotoStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}


@Component({
  selector: 'app-inspection',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './inspection.html',
  styleUrl: './inspection.css',
})
export class Inspection implements OnDestroy {

  private readonly router =
    inject(Router);

  private readonly inspectionService =
    inject(CustomerInspectionService);

  private readonly zone =
    inject(NgZone);

  private readonly changeDetector =
    inject(ChangeDetectorRef);


  /*
   * =========================================================
   * INSPECTION
   * =========================================================
   */

  get inspection() {
    return this.inspectionService.getInspection();
  }


  /*
   * =========================================================
   * CURRENT PHOTO
   * =========================================================
   */

  currentIndex = 0;

  selectedFile: File | null = null;

  selectedImage: string | null = null;

  savingPhoto = false;

  private previewUrl: string | null = null;


  /*
   * =========================================================
   * PHOTO STEPS
   * =========================================================
   */

  readonly photoSteps: PhotoStep[] = [

    {
      id: 'front',
      title: 'Front of Vehicle',
      description: 'Capture a complete front view of the vehicle.',
      icon: '🚗',
    },

    {
      id: 'rear',
      title: 'Rear of Vehicle',
      description: 'Capture a complete rear view of the vehicle.',
      icon: '🚙',
    },

    {
      id: 'left',
      title: 'Left Side',
      description: 'Capture the complete left side of the vehicle.',
      icon: '◀',
    },

    {
      id: 'right',
      title: 'Right Side',
      description: 'Capture the complete right side of the vehicle.',
      icon: '▶',
    },

    {
      id: 'front-left',
      title: 'Front Left Corner',
      description: 'Capture the front left corner clearly.',
      icon: '↙',
    },

    {
      id: 'front-right',
      title: 'Front Right Corner',
      description: 'Capture the front right corner clearly.',
      icon: '↘',
    },

    {
      id: 'rear-left',
      title: 'Rear Left Corner',
      description: 'Capture the rear left corner clearly.',
      icon: '↖',
    },

    {
      id: 'rear-right',
      title: 'Rear Right Corner',
      description: 'Capture the rear right corner clearly.',
      icon: '↗',
    },

    {
      id: 'vin',
      title: 'VIN Plate',
      description: 'Capture the VIN plate so the number is readable.',
      icon: '▣',
    },

    {
      id: 'odometer',
      title: 'Odometer',
      description: 'Capture the odometer so the mileage is clearly visible.',
      icon: '◉',
    },

    {
      id: 'engine',
      title: 'Engine Bay',
      description: 'Capture a clear view of the engine compartment.',
      icon: '⚙',
    },

    {
      id: 'interior',
      title: 'Interior',
      description: 'Capture a clear view of the vehicle interior.',
      icon: '⌂',
    },

  ];


  /*
   * =========================================================
   * GETTERS
   * =========================================================
   */

  get currentPhotoStep(): PhotoStep {
    return this.photoSteps[
      this.currentIndex
    ];
  }


  get currentInspectionPhoto(): InspectionPhoto {
    return this.inspection.photos[
      this.currentIndex
    ];
  }


  get photoNumber(): number {
    return this.currentIndex + 1;
  }


  get totalPhotos(): number {
    return this.photoSteps.length;
  }


  get completedPhotoCount(): number {
    return this.inspectionService
      .getCompletedPhotos();
  }


  get progress(): number {

    if (this.totalPhotos === 0) {
      return 0;
    }

    return Math.round(
      (
        this.completedPhotoCount /
        this.totalPhotos
      ) * 100
    );
  }


  get isLastPhoto(): boolean {
    return this.currentIndex ===
      this.totalPhotos - 1;
  }


  /*
   * ONLY a newly selected photo.
   */

  get hasSelectedPhoto(): boolean {
    return !!this.selectedImage;
  }


  /*
   * =========================================================
   * SAVED PHOTO
   * =========================================================
   */

  get savedImage(): string | null {

    const photo =
      this.currentInspectionPhoto;

    if (
      !photo ||
      !photo.uploaded
    ) {
      return null;
    }

    return photo.imageUrl ?? null;
  }


  /*
   * =========================================================
   * DISPLAYED IMAGE
   * =========================================================
   */

  get displayedImage(): string | null {

    if (this.selectedImage) {
      return this.selectedImage;
    }

    return this.savedImage;
  }


  get currentPhotoCompleted(): boolean {
    return !!this.currentInspectionPhoto?.uploaded;
  }


  get canGoBack(): boolean {
    return this.currentIndex > 0;
  }


  get allPhotosComplete(): boolean {
    return this.completedPhotoCount ===
      this.totalPhotos;
  }


  /*
   * =========================================================
   * CHECKLIST
   * =========================================================
   */

  isCompleted(
    index: number
  ): boolean {

    return !!this.inspection
      .photos[index]
      ?.uploaded;
  }


  /*
   * =========================================================
   * FIND FIRST INCOMPLETE PHOTO
   * =========================================================
   */

  private findFirstIncompletePhoto(): number {

    const photos =
      this.inspection.photos;

    const index =
      photos.findIndex(
        photo => !photo.uploaded
      );

    if (index === -1) {

      return Math.max(
        0,
        photos.length - 1
      );
    }

    return index;
  }


  /*
   * =========================================================
   * INITIALISE CURRENT PHOTO
   * =========================================================
   */

  constructor() {

    this.currentIndex =
      this.findFirstIncompletePhoto();
  }


  /*
   * =========================================================
   * OPEN CAMERA
   * =========================================================
   */

  takePhoto(): void {

    if (this.savingPhoto) {
      return;
    }

    const input =
      document.getElementById(
        'vehicle-photo-input'
      ) as HTMLInputElement | null;

    if (!input) {
      console.error(
        'Vehicle photo input was not found.'
      );

      return;
    }

    input.value = '';

    input.click();
  }


  /*
   * =========================================================
   * PHOTO SELECTED
   * =========================================================
   */

  onPhotoSelected(
    event: Event
  ): void {

    if (this.savingPhoto) {
      return;
    }

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {
      console.warn(
        'Selected file is not an image.'
      );

      return;
    }

    this.releasePreview();

    this.selectedFile = file;

    this.previewUrl =
      URL.createObjectURL(
        file
      );

    this.selectedImage =
      this.previewUrl;

    this.zone.run(() => {

      this.changeDetector
        .detectChanges();

    });
  }


  /*
   * =========================================================
   * RETAKE PHOTO
   * =========================================================
   */

  retakePhoto(): void {

    if (this.savingPhoto) {
      return;
    }

    this.selectedFile = null;

    this.releasePreview();

    this.selectedImage = null;

    this.changeDetector
      .detectChanges();

    this.takePhoto();
  }


  /*
   * =========================================================
   * CONFIRM PHOTO
   * =========================================================
   *
   * IMPORTANT:
   *
   * This method ONLY saves the current photo.
   *
   * It does not submit the inspection.
   *
   * It does not navigate to Review unless the user
   * explicitly presses Continue to Review on the final
   * photo.
   */

  async confirmPhoto(): Promise<void> {

    if (
      !this.selectedFile ||
      !this.selectedImage ||
      this.savingPhoto
    ) {
      return;
    }

    this.savingPhoto = true;

    this.changeDetector
      .detectChanges();

    try {

      /*
       * Keep a local reference because the temporary
       * selection is cleared after the save.
       */

      const fileToSave =
        this.selectedFile;

      const photoToSave =
        this.currentInspectionPhoto;

      if (!fileToSave) {
        throw new Error(
          'No photo selected.'
        );
      }

      if (!photoToSave) {
        throw new Error(
          'Current inspection photo was not found.'
        );
      }


      /*
       * Compress the image.
       */

      const compressedImage =
        await this.compressImage(
          fileToSave
        );


      /*
       * Save the compressed image into the
       * CustomerInspectionService.
       */

      this.inspectionService.updatePhoto(
        photoToSave.id,
        compressedImage
      );


      /*
       * The photo is now safely stored.
       *
       * Remove only the temporary camera preview.
       */

      this.releasePreview();

      this.selectedFile = null;

      this.selectedImage = null;


      /*
       * Force Angular to immediately recognise that:
       *
       * - Saving is finished
       * - Photo is completed
       * - Progress changed
       * - Next photo can be displayed
       */

      this.zone.run(() => {

        this.savingPhoto = false;

        this.changeDetector
          .detectChanges();

      });


      /*
       * =====================================================
       * LAST PHOTO
       * =====================================================
       *
       * IMPORTANT:
       *
       * Do NOT navigate automatically.
       *
       * The HTML will now show:
       *
       * Continue to Review
       *
       * and the customer must click it.
       */

      if (this.isLastPhoto) {

        this.zone.run(() => {

          this.changeDetector
            .detectChanges();

        });

        return;
      }


      /*
       * =====================================================
       * NEXT PHOTO
       * =====================================================
       *
       * Move to the next photo only after the current
       * photo has been successfully saved.
       */

      this.currentIndex++;

      this.zone.run(() => {

        this.changeDetector
          .detectChanges();

      });

    } catch (error) {

      console.error(
        'Unable to save inspection photo:',
        error
      );

      /*
       * Make absolutely sure the page does not remain
       * permanently stuck on "Saving..."
       */

      this.zone.run(() => {

        this.savingPhoto = false;

        this.changeDetector
          .detectChanges();

      });

    } finally {

      /*
       * Safety net.
       *
       * If anything unexpected happens anywhere in the
       * save process, savingPhoto can never remain true.
       */

      this.zone.run(() => {

        this.savingPhoto = false;

        this.changeDetector
          .detectChanges();

      });
    }
  }


  /*
   * =========================================================
   * PREVIOUS PHOTO
   * =========================================================
   */

  previousPhoto(): void {

    if (
      !this.canGoBack ||
      this.savingPhoto
    ) {
      return;
    }

    this.clearTemporarySelection();

    this.currentIndex--;

    this.changeDetector
      .detectChanges();
  }


  /*
   * =========================================================
   * BACK TO VEHICLE
   * =========================================================
   */

  back(): void {

    if (this.savingPhoto) {
      return;
    }

    this.clearTemporarySelection();

    this.router.navigate([
      '/customer/vehicle',
    ]);
  }


  /*
   * =========================================================
   * SELECT CHECKLIST PHOTO
   * =========================================================
   */

  selectPhoto(
    index: number
  ): void {

    if (
      this.savingPhoto ||
      index < 0 ||
      index >= this.totalPhotos
    ) {
      return;
    }

    this.clearTemporarySelection();

    this.currentIndex = index;

    this.changeDetector
      .detectChanges();
  }


  /*
   * =========================================================
   * CONTINUE TO REVIEW
   * =========================================================
   */

  continueToReview(): void {

    if (
      this.savingPhoto ||
      !this.allPhotosComplete
    ) {
      return;
    }

    this.clearTemporarySelection();

    this.inspectionService.setStatus(
      'review'
    );

    this.router.navigate([
      '/customer/review',
    ]);
  }


  /*
   * =========================================================
   * IMAGE COMPRESSION
   * =========================================================
   */

  private compressImage(
    file: File
  ): Promise<string> {

    return new Promise(
      (
        resolve,
        reject
      ) => {

        const reader =
          new FileReader();

        reader.onload = () => {

          const image =
            new Image();

          image.onload = () => {

            const maxSize = 1800;

            let width =
              image.width;

            let height =
              image.height;


            if (
              width > maxSize ||
              height > maxSize
            ) {

              if (width > height) {

                height =
                  Math.round(
                    (
                      height /
                      width
                    ) * maxSize
                  );

                width = maxSize;

              } else {

                width =
                  Math.round(
                    (
                      width /
                      height
                    ) * maxSize
                  );

                height = maxSize;
              }
            }


            const canvas =
              document.createElement(
                'canvas'
              );

            canvas.width = width;

            canvas.height = height;


            const context =
              canvas.getContext(
                '2d'
              );

            if (!context) {

              reject(
                new Error(
                  'Unable to process image.'
                )
              );

              return;
            }


            context.drawImage(
              image,
              0,
              0,
              width,
              height
            );


            resolve(
              canvas.toDataURL(
                'image/jpeg',
                0.82
              )
            );
          };


          image.onerror = () => {

            reject(
              new Error(
                'Unable to read image.'
              )
            );
          };


          image.src =
            String(
              reader.result
            );
        };


        reader.onerror = () => {

          reject(
            new Error(
              'Unable to read selected photo.'
            )
          );
        };


        reader.readAsDataURL(file);
      }
    );
  }


  /*
   * =========================================================
   * CLEAR TEMPORARY CAMERA PREVIEW
   * =========================================================
   */

  private clearTemporarySelection(): void {

    this.releasePreview();

    this.selectedFile = null;

    this.selectedImage = null;
  }


  /*
   * =========================================================
   * RELEASE OBJECT URL
   * =========================================================
   */

  private releasePreview(): void {

    if (this.previewUrl) {

      URL.revokeObjectURL(
        this.previewUrl
      );

      this.previewUrl = null;
    }
  }


  /*
   * =========================================================
   * DESTROY
   * =========================================================
   */

  ngOnDestroy(): void {

    this.releasePreview();
  }
}