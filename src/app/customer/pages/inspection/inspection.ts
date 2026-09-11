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
   * INSPECTION TYPE
   * =========================================================
   */

  get inspectionType(): string {

    const type = String(
      this.inspection?.inspectionType ?? ''
    ).toUpperCase();

    if (
      type === 'ACCIDENT_CLAIM' ||
      type === 'ACCIDENT'
    ) {
      return 'ACCIDENT_CLAIM';
    }

    return 'PRE_COVER';
  }


  get isAccidentClaim(): boolean {
    return this.inspectionType === 'ACCIDENT_CLAIM';
  }


  get isPreCover(): boolean {
    return this.inspectionType === 'PRE_COVER';
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

  private readonly preCoverPhotoSteps: PhotoStep[] = [

    {
      id: 'front',
      title: 'Front of Vehicle',
      description:
        'Capture a complete, clear front view of the vehicle.',
      icon: '🚗',
    },

    {
      id: 'rear',
      title: 'Rear of Vehicle',
      description:
        'Capture a complete, clear rear view of the vehicle.',
      icon: '🚙',
    },

    {
      id: 'left',
      title: 'Left Side',
      description:
        'Capture the complete left side of the vehicle.',
      icon: '◀',
    },

    {
      id: 'right',
      title: 'Right Side',
      description:
        'Capture the complete right side of the vehicle.',
      icon: '▶',
    },

    {
      id: 'odometer',
      title: 'Odometer Reading',
      description:
        'Capture a clear photo showing the current odometer reading.',
      icon: '🔢',
    },

    {
      id: 'windscreen',
      title: 'Windscreen',
      description:
        'Capture a clear photo of the windscreen, including any visible chips or cracks.',
      icon: '🪟',
    },

    {
      id: 'vehicle-interior',
      title: 'Vehicle Interior',
      description:
        'Capture a clear photograph of the vehicle interior and dashboard area.',
      icon: '🚘',
    },

  ];


  private readonly accidentPhotoSteps: PhotoStep[] = [

    {
      id: 'front',
      title: 'Front of Vehicle',
      description:
        'Capture a complete front view showing the vehicle and any visible accident damage.',
      icon: '🚗',
    },

    {
      id: 'rear',
      title: 'Rear of Vehicle',
      description:
        'Capture a complete rear view showing the vehicle and any visible accident damage.',
      icon: '🚙',
    },

    {
      id: 'left',
      title: 'Left Side',
      description:
        'Capture the complete left side and any visible impact damage.',
      icon: '◀',
    },

    {
      id: 'right',
      title: 'Right Side',
      description:
        'Capture the complete right side and any visible impact damage.',
      icon: '▶',
    },

    {
      id: 'damage-close',
      title: 'Damage Close-up',
      description:
        'Capture a clear close-up of the main damaged or impacted area.',
      icon: '🔍',
    },

    {
      id: 'damage-wide',
      title: 'Damage Wider View',
      description:
        'Capture a wider view showing the full extent and location of the damage.',
      icon: '📷',
    },

    {
      id: 'accident-scene',
      title: 'Accident Scene',
      description:
        'Capture the relevant accident scene or surrounding area where appropriate.',
      icon: '📍',
    },

  ];


  get photoSteps(): PhotoStep[] {

    if (this.isAccidentClaim) {
      return this.accidentPhotoSteps;
    }

    return this.preCoverPhotoSteps;
  }


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
        Math.min(
          photos.length - 1,
          this.totalPhotos - 1
        )
      );
    }

    return Math.min(
      index,
      this.totalPhotos - 1
    );
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

      this.changeDetector.detectChanges();

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

    this.clearTemporarySelection();

    this.changeDetector.detectChanges();

    this.takePhoto();
  }


  /*
   * =========================================================
   * CONFIRM PHOTO
   * =========================================================
   *
   * IMPORTANT:
   *
   * CustomerInspectionService.updatePhoto() is synchronous.
   * It does NOT return a Promise and does NOT return a photo.
   *
   * The previous implementation was doing unnecessary
   * change-detection work around this synchronous operation.
   *
   * This version deliberately performs the state transition
   * in one controlled Angular zone.
   * =========================================================
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

    this.changeDetector.detectChanges();


    const fileToSave =
      this.selectedFile;

    const photoToSave =
      this.currentInspectionPhoto;


    if (!fileToSave) {

      this.savingPhoto = false;

      this.changeDetector.detectChanges();

      return;
    }


    if (!photoToSave) {

      this.savingPhoto = false;

      this.changeDetector.detectChanges();

      return;
    }


    try {

      /*
       * =====================================================
       * PROCESS IMAGE
       * =====================================================
       */

      const compressedImage =
        await this.compressImage(
          fileToSave
        );


      /*
       * =====================================================
       * SAVE INTO INSPECTION
       * =====================================================
       */

      this.inspectionService.updatePhoto(
        photoToSave.id,
        compressedImage
      );


      /*
       * =====================================================
       * READ THE UPDATED PHOTO DIRECTLY
       * =====================================================
       */

      const updatedInspection =
        this.inspectionService.getInspection();

      const updatedPhoto =
        updatedInspection.photos.find(
          photo =>
            photo.id === photoToSave.id
        );


      if (
        !updatedPhoto ||
        !updatedPhoto.uploaded
      ) {

        throw new Error(
          'The photo was not marked as uploaded after saving.'
        );
      }


      /*
       * =====================================================
       * RELEASE CAMERA PREVIEW
       * =====================================================
       */

      this.releasePreview();

      this.selectedFile = null;

      this.selectedImage = null;


      /*
       * =====================================================
       * UPDATE SCREEN
       * =====================================================
       *
       * Everything below happens together so Angular sees:
       *
       *   photo completed
       *   progress updated
       *   saving stopped
       *   next photo selected
       *
       * in the same UI update.
       * =====================================================
       */

      this.zone.run(() => {

        if (
          this.currentIndex <
          this.totalPhotos - 1
        ) {

          this.currentIndex =
            this.currentIndex + 1;
        }

        this.savingPhoto = false;

        this.changeDetector.detectChanges();

      });


    } catch (error) {

      console.error(
        'Unable to save inspection photo:',
        error
      );

      /*
       * Keep the selected image visible when saving fails.
       * This lets the customer retry instead of losing the photo.
       */

      this.zone.run(() => {

        this.savingPhoto = false;

        this.changeDetector.detectChanges();

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
      async (
        resolve,
        reject
      ) => {

        let timeoutId:
          ReturnType<typeof setTimeout> | null =
          null;

        let objectUrl: string | null =
          null;

        let finished = false;


        const cleanup = (): void => {

          if (timeoutId !== null) {

            clearTimeout(
              timeoutId
            );

            timeoutId = null;
          }

          if (objectUrl) {

            URL.revokeObjectURL(
              objectUrl
            );

            objectUrl = null;
          }
        };


        const fail = (
          message: string
        ): void => {

          if (finished) {
            return;
          }

          finished = true;

          cleanup();

          reject(
            new Error(message)
          );
        };


        const succeed = (
          value: string
        ): void => {

          if (finished) {
            return;
          }

          finished = true;

          cleanup();

          resolve(value);
        };


        timeoutId =
          setTimeout(() => {

            fail(
              'Photo processing timed out. Please retake the photo.'
            );

          }, 10000);


        try {

          if (!file) {

            fail(
              'No photo file was provided.'
            );

            return;
          }


          if (
            !file.type.startsWith(
              'image/'
            )
          ) {

            fail(
              'The selected file is not an image.'
            );

            return;
          }


          /*
           * =================================================
           * CREATE IMAGE BITMAP
           * =================================================
           */

          let bitmap:
            ImageBitmap | null =
            null;


          if (
            typeof createImageBitmap ===
            'function'
          ) {

            try {

              bitmap =
                await createImageBitmap(
                  file
                );

            } catch (error) {

              console.warn(
                'createImageBitmap failed. Falling back to Image element.',
                error
              );

            }

          }


          /*
           * =================================================
           * FALLBACK IMAGE ELEMENT
           * =================================================
           */

          let sourceWidth = 0;

          let sourceHeight = 0;

          let drawSource:
            CanvasImageSource | null =
            null;


          if (bitmap) {

            sourceWidth =
              bitmap.width;

            sourceHeight =
              bitmap.height;

            drawSource =
              bitmap;

          } else {

            objectUrl =
              URL.createObjectURL(
                file
              );


            const image =
              await new Promise<HTMLImageElement>(
                (
                  imageResolve,
                  imageReject
                ) => {

                  const image =
                    new Image();

                  let imageFinished =
                    false;


                  image.onload =
                    () => {

                      if (imageFinished) {
                        return;
                      }

                      imageFinished =
                        true;

                      imageResolve(
                        image
                      );
                    };


                  image.onerror =
                    () => {

                      if (imageFinished) {
                        return;
                      }

                      imageFinished =
                        true;

                      imageReject(
                        new Error(
                          'Unable to decode selected photo.'
                        )
                      );
                    };


                  image.src =
                    objectUrl!;
                }
              );


            sourceWidth =
              image.naturalWidth ||
              image.width;

            sourceHeight =
              image.naturalHeight ||
              image.height;

            drawSource =
              image;
          }


          if (
            sourceWidth <= 0 ||
            sourceHeight <= 0 ||
            !drawSource
          ) {

            if (bitmap) {
              bitmap.close();
            }

            fail(
              'The selected image has invalid dimensions.'
            );

            return;
          }


          /*
           * =================================================
           * RESIZE
           * =================================================
           */

          const maxSize =
            1800;

          let width =
            sourceWidth;

          let height =
            sourceHeight;


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
                  ) *
                  maxSize
                );

              width =
                maxSize;

            } else {

              width =
                Math.round(
                  (
                    width /
                    height
                  ) *
                  maxSize
                );

              height =
                maxSize;
            }
          }


          /*
           * =================================================
           * CANVAS
           * =================================================
           */

          const canvas =
            document.createElement(
              'canvas'
            );

          canvas.width =
            width;

          canvas.height =
            height;


          const context =
            canvas.getContext(
              '2d'
            );


          if (!context) {

            if (bitmap) {
              bitmap.close();
            }

            fail(
              'Unable to process image.'
            );

            return;
          }


          context.drawImage(
            drawSource,
            0,
            0,
            width,
            height
          );


          if (bitmap) {
            bitmap.close();
          }


          /*
           * =================================================
           * JPEG ENCODING
           * =================================================
           */

          const blob =
            await new Promise<Blob | null>(
              (
                blobResolve
              ) => {

                canvas.toBlob(
                  (
                    generatedBlob
                  ) => {

                    blobResolve(
                      generatedBlob
                    );

                  },
                  'image/jpeg',
                  0.82
                );

              }
            );


          if (!blob) {

            fail(
              'Unable to compress selected photo.'
            );

            return;
          }


          /*
           * =================================================
           * BLOB TO DATA URL
           * =================================================
           */

          const reader =
            new FileReader();


          reader.onload =
            () => {

              const result =
                reader.result;


              if (
                typeof result !== 'string' ||
                !result ||
                result === 'data:,'
              ) {

                fail(
                  'Unable to create the processed photo.'
                );

                return;
              }


              succeed(
                result
              );
            };


          reader.onerror =
            () => {

              fail(
                'Unable to read processed photo.'
              );
            };


          reader.onabort =
            () => {

              fail(
                'Photo processing was cancelled.'
              );
            };


          reader.readAsDataURL(
            blob
          );

        } catch (error) {

          console.error(
            'Photo compression failed:',
            error
          );

          fail(
            'Unable to process selected photo.'
          );
        }
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