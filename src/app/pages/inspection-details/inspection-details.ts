import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  Inspection,
  InspectionService
} from '../../services/inspection.service';


@Component({
  selector: 'app-inspection-details',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl:
    './inspection-details.html',

  styleUrls: [
    './inspection-details.css'
  ]
})
export class InspectionDetails implements OnInit, OnDestroy {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly inspectionService =
    inject(InspectionService);

  private readonly cdr =
    inject(ChangeDetectorRef);


  inspection:
    Inspection | null =
    null;

  isLoading =
    false;

  errorMessage =
    '';


  /* =========================================================
     AI REFRESH / POLLING
     ========================================================= */

  private refreshTimer:
    ReturnType<typeof setTimeout> | null =
    null;

  private readonly refreshIntervalMs =
    3000;

  private readonly maximumRefreshAttempts =
    40;

  private refreshAttempts =
    0;

  private destroyed =
    false;


  /* =========================================================
     INIT
     ========================================================= */

  ngOnInit(): void {

    this.loadInspection();

  }


  /* =========================================================
     DESTROY
     ========================================================= */

  ngOnDestroy(): void {

    this.destroyed = true;

    this.stopAutoRefresh();

  }


  /* =========================================================
     LOAD INSPECTION
     ========================================================= */

  loadInspection(): void {

    this.stopAutoRefresh();

    this.refreshAttempts = 0;

    const routeId =
      this.route.snapshot.paramMap.get('id');

    if (!routeId) {

      this.isLoading = false;

      this.errorMessage =
        'No inspection reference was provided.';

      this.cdr.detectChanges();

      return;
    }

    this.isLoading = true;

    this.errorMessage = '';

    this.inspection = null;

    this.cdr.detectChanges();


    /*
     * First attempt to load using the database ID.
     */
    this.inspectionService
      .getInspectionById(routeId)
      .subscribe({

        next: inspection => {

          console.log(
            'INSPECTION DETAILS LOADED BY ID:',
            inspection
          );

          this.setInspection(
            inspection
          );

        },

        error: error => {

          console.warn(
            'ID lookup failed. Trying reference lookup:',
            error
          );

          this.loadByReference(
            routeId
          );

        }

      });

  }


  /* =========================================================
     LOAD BY REFERENCE
     ========================================================= */

  private loadByReference(
    reference: string
  ): void {

    this.inspectionService
      .getInspectionByReference(reference)
      .subscribe({

        next: inspection => {

          console.log(
            'INSPECTION DETAILS LOADED BY REFERENCE:',
            inspection
          );

          this.setInspection(
            inspection
          );

        },

        error: error => {

          console.error(
            'INSPECTION DETAILS LOOKUP FAILED:',
            error
          );

          this.inspection = null;

          this.isLoading = false;

          this.errorMessage =
            'Unable to load this inspection.';

          this.cdr.detectChanges();

        }

      });

  }


  /* =========================================================
     SET / NORMALISE INSPECTION
     ========================================================= */

  private setInspection(
    inspection: Inspection
  ): void {

    if (!inspection) {

      this.inspection = null;

      this.isLoading = false;

      this.errorMessage =
        'Inspection information was not returned.';

      this.stopAutoRefresh();

      this.cdr.detectChanges();

      return;
    }


    this.inspection =
      this.inspectionService
        .normalizeInspection(
          inspection
        );


    console.log(
      'NORMALISED INSPECTION DETAILS:',
      this.inspection
    );


    console.log(
      'NORMALISED AI DATA:',
      (this.inspection as any)?.ai
    );


    this.isLoading = false;

    this.errorMessage = '';

    this.cdr.detectChanges();


    if (this.isAiProcessing()) {

      this.startAutoRefresh();

    } else {

      this.stopAutoRefresh();

    }

  }


  /* =========================================================
     AI STATUS
     ========================================================= */

  private isAiProcessing(): boolean {

    if (!this.inspection) {

      return false;

    }


    const inspectionStatus =
      this.normaliseStatus(
        this.inspection.status
      );


    const aiStatus =
      this.normaliseAiStatus(
        this.inspection.ai?.status
      );


    const inspectionStillWaiting =
      inspectionStatus === 'submitted' ||
      inspectionStatus === 'processing' ||
      inspectionStatus === 'in-progress' ||
      inspectionStatus === 'inprogress';


    const aiStillProcessing =
      aiStatus === 'processing' ||
      aiStatus === 'pending' ||
      aiStatus === 'in-progress' ||
      aiStatus === 'inprogress' ||
      aiStatus === 'queued';


    if (aiStillProcessing) {

      return true;

    }


    if (
      inspectionStillWaiting &&
      (
        !this.inspection.ai ||
        !this.inspection.ai.status
      )
    ) {

      return true;

    }


    return false;

  }


  private normaliseAiStatus(
    status:
      string | undefined |
      null
  ): string {

    return (
      status || ''
    )
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');

  }


  /* =========================================================
     AUTOMATIC REFRESH
     ========================================================= */

  private startAutoRefresh(): void {

    if (this.destroyed) {

      return;

    }


    if (this.refreshTimer !== null) {

      return;

    }


    this.refreshAttempts = 0;


    console.log(
      'AI ANALYSIS STILL PROCESSING - AUTO REFRESH STARTED'
    );


    this.scheduleNextRefresh();

  }


  private scheduleNextRefresh(): void {

    if (this.destroyed) {

      return;

    }


    if (this.refreshTimer !== null) {

      clearTimeout(
        this.refreshTimer
      );

    }


    this.refreshTimer =
      setTimeout(
        () => {

          this.refreshTimer = null;

          this.refreshInspection();

        },
        this.refreshIntervalMs
      );

  }


  private refreshInspection(): void {

    if (
      this.destroyed ||
      !this.inspection
    ) {

      return;

    }


    if (
      this.refreshAttempts >=
      this.maximumRefreshAttempts
    ) {

      console.warn(
        'AI AUTO REFRESH STOPPED AFTER MAXIMUM ATTEMPTS'
      );

      this.stopAutoRefresh();

      return;

    }


    this.refreshAttempts++;


    const reference =
      this.inspection.reference;


    if (!reference) {

      console.warn(
        'Cannot refresh inspection: no reference available.'
      );

      this.stopAutoRefresh();

      return;

    }


    console.log(
      `REFRESHING INSPECTION FROM BACKEND - ATTEMPT ${this.refreshAttempts}`
    );


    this.inspectionService
      .getInspectionByReference(reference)
      .subscribe({

        next: updatedInspection => {

          if (this.destroyed) {

            return;

          }


          if (!updatedInspection) {

            console.warn(
              'Inspection refresh returned no inspection.'
            );

            this.scheduleNextRefresh();

            return;

          }


          console.log(
            'INSPECTION DETAILS REFRESHED:',
            updatedInspection
          );


          this.inspection =
            this.inspectionService
              .normalizeInspection(
                updatedInspection
              );


          console.log(
            'REFRESHED NORMALISED INSPECTION:',
            this.inspection
          );


          console.log(
            'REFRESHED AI DATA:',
            (this.inspection as any)?.ai
          );


          this.cdr.detectChanges();


          if (!this.isAiProcessing()) {

            console.log(
              'AI ANALYSIS COMPLETE - AUTO REFRESH STOPPED'
            );

            this.stopAutoRefresh();

            return;

          }


          this.scheduleNextRefresh();

        },

        error: error => {

          if (this.destroyed) {

            return;

          }


          console.warn(
            'INSPECTION AUTO REFRESH FAILED:',
            error
          );


          this.scheduleNextRefresh();

        }

      });

  }


  private stopAutoRefresh(): void {

    if (
      this.refreshTimer !== null
    ) {

      clearTimeout(
        this.refreshTimer
      );

      this.refreshTimer = null;

    }

  }


  /* =========================================================
     STATUS
     ========================================================= */

  getStatus(): string {

    return this.formatStatus(
      this.inspection?.status
    );

  }


  getStatusClass(): string {

    const status =
      this.normaliseStatus(
        this.inspection?.status
      );


    switch (status) {

      case 'completed':
        return 'status-completed';

      case 'submitted':
        return 'status-submitted';

      case 'review':
      case 'under-review':
        return 'status-review';

      case 'in-progress':
      case 'inprogress':
        return 'status-progress';

      case 'pending':
        return 'status-pending';

      case 'draft':
        return 'status-draft';

      default:
        return 'status-default';

    }

  }


  private normaliseStatus(
    status:
      string | undefined |
      null
  ): string {

    return (
      status || 'pending'
    )
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');

  }


  private formatStatus(
    status:
      string | undefined |
      null
  ): string {

    const value =
      this.normaliseStatus(
        status
      );


    switch (value) {

      case 'in-progress':
      case 'inprogress':
        return 'In Progress';

      case 'review':
      case 'under-review':
        return 'Under Review';

      case 'submitted':
        return 'Submitted';

      case 'completed':
        return 'Completed';

      case 'pending':
        return 'Pending';

      case 'draft':
        return 'Draft';

      default:

        return value
          .split('-')
          .map(
            word =>
              word.charAt(0).toUpperCase() +
              word.slice(1)
          )
          .join(' ');

    }

  }


  /* =========================================================
     INSPECTION TYPE
     ========================================================= */

  getInspectionType(): string {

    const type =
      this.inspection?.inspectionType ||
      this.inspection?.type ||
      'pre-cover';


    if (type === 'accident') {

      return 'Accident Claim Inspection';

    }


    return 'Pre-Cover Inspection';

  }


  getInspectionTypeLabel(): string {

    return this.getInspectionType();

  }


  isAccidentInspection(): boolean {

    return (
      this.inspection?.inspectionType === 'accident' ||
      this.inspection?.type === 'accident'
    );

  }


  /* =========================================================
     CUSTOMER
     ========================================================= */

  getCustomerFirstName(): string {

    return (
      this.inspection?.customer?.firstName ||
      this.inspection?.customerFirstName ||
      'Not provided'
    );

  }


  getCustomerSurname(): string {

    return (
      this.inspection?.customer?.surname ||
      this.inspection?.customer?.lastName ||
      this.inspection?.customerSurname ||
      this.inspection?.customerLastName ||
      'Not provided'
    );

  }


  getCustomerPhone(): string {

    return (
      this.inspection?.customer?.phone ||
      this.inspection?.customerPhone ||
      'Not provided'
    );

  }


  getCustomerEmail(): string {

    return (
      this.inspection?.customer?.email ||
      this.inspection?.customerEmail ||
      'Not provided'
    );

  }


  /* =========================================================
     POLICY
     ========================================================= */

  getPolicyNumber(): string {

    return (
      this.inspection?.policy?.policyNumber ||
      this.inspection?.policyNumber ||
      'Not provided'
    );

  }


  getInsuranceCompany(): string {

    return (
      this.inspection?.policy?.insuranceCompany ||
      this.inspection?.insuranceCompany ||
      'Not provided'
    );

  }


  /* =========================================================
     VEHICLE
     ========================================================= */

  getRegistration(): string {

    return (
      this.inspection?.vehicle?.registration ||
      this.inspection?.registration ||
      'Not provided'
    );

  }


  getVehicleName(): string {

    const make =
      this.inspection?.vehicle?.make ||
      this.inspection?.make ||
      '';


    const model =
      this.inspection?.vehicle?.model ||
      this.inspection?.model ||
      '';


    const result =
      `${make} ${model}`.trim();


    return (
      result ||
      'Vehicle not provided'
    );

  }


  getVehicleMake(): string {

    return (
      this.inspection?.vehicle?.make ||
      this.inspection?.make ||
      'Not provided'
    );

  }


  getVehicleModel(): string {

    return (
      this.inspection?.vehicle?.model ||
      this.inspection?.model ||
      'Not provided'
    );

  }


  getVehicleYear(): string {

    const year =
      this.inspection?.vehicle?.year ??
      this.inspection?.year;


    if (
      year !== undefined &&
      year !== null &&
      String(year).trim() !== ''
    ) {

      return String(year);

    }


    return 'Not provided';

  }


  getVehicleColour(): string {

    return (
      this.inspection?.vehicle?.colour ||
      this.inspection?.colour ||
      'Not provided'
    );

  }


  getVehicleMileage(): string {

    const mileage =
      this.inspection?.vehicle?.mileage ??
      this.inspection?.mileage;


    if (
      mileage !== undefined &&
      mileage !== null &&
      String(mileage).trim() !== ''
    ) {

      return String(mileage);

    }


    return 'Not provided';

  }


  getVehicleVin(): string {

    return (
      this.inspection?.vehicle?.vin ||
      this.inspection?.vin ||
      this.inspection?.ai?.vin ||
      'Not provided'
    );

  }


  /* =========================================================
     DATES
     ========================================================= */

  getCreatedDate(): string | null {

    return (
      this.inspection?.createdAt ||
      null
    );

  }


  formatDate(
    value:
      string | null | undefined
  ): string {

    if (!value) {

      return 'Not available';

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return 'Not available';

    }


    return new Intl.DateTimeFormat(
      'en-ZA',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(date);

  }


  /* =========================================================
     AI RESULTS
     ========================================================= */

  private getAiData(): any {

    return (
      (this.inspection as any)?.ai ??
      null
    );

  }


  /*
   * AI results may be returned in slightly different shapes
   * depending on how InspectionService normalises the backend
   * response.
   *
   * We do not modify the data.
   * We only search it for display purposes.
   */
  private getAiCandidates(): any[] {

    const ai =
      this.getAiData();


    if (!ai) {

      return [];

    }


    const candidates: any[] = [
      ai
    ];


    const nestedKeys = [
      'assessment',
      'result',
      'results',
      'analysis',
      'data',
      'response',
      'structuredAssessment',
      'structuredResult'
    ];


    for (const key of nestedKeys) {

      const value =
        ai?.[key];


      if (
        value &&
        typeof value === 'object'
      ) {

        candidates.push(
          value
        );

      }

    }


    return candidates;

  }


  private findAiValue(
    keys: string[]
  ): any {

    const candidates =
      this.getAiCandidates();


    for (const candidate of candidates) {

      if (!candidate) {

        continue;

      }


      for (const key of keys) {

        const value =
          candidate?.[key];


        if (
          value !== undefined &&
          value !== null &&
          value !== ''
        ) {

          return value;

        }

      }

    }


    return null;

  }


  private getCombinedAiSummary(): string {

    const value =
      this.findAiValue([
        'damageSummary',
        'summary',
        'assessmentSummary',
        'aiSummary'
      ]);


    if (
      typeof value === 'string' &&
      value.trim()
    ) {

      return value.trim();

    }


    return '';

  }


  private extractAiSection(
    sectionName: string
  ): string {

    const summary =
      this.getCombinedAiSummary();


    if (!summary) {

      return '';

    }


    const escapedName =
      sectionName.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );


    const nextSections =
      [
        'OVERALL CONDITION',
        'DAMAGE ASSESSMENT',
        'POTENTIAL CONCERNS',
        'RECOMMENDED FOLLOW-UP',
        'INSURANCE PROCESSING'
      ]
        .filter(
          section =>
            section !== sectionName
        )
        .join('|');


    const expression =
      new RegExp(
        `${escapedName}\\s*:\\s*(.*?)(?=\\s*(?:${nextSections})\\s*:|$)`,
        'i'
      );


    const match =
      summary.match(
        expression
      );


    if (
      !match ||
      !match[1]
    ) {

      return '';

    }


    return match[1]
      .trim()
      .replace(
        /\s+/g,
        ' '
      );

  }


  getDamageScore(): string {

    const score =
      this.findAiValue([
        'damagePercentage',
        'damagePercent',
        'damageScore',
        'score'
      ]);


    if (
      score === undefined ||
      score === null ||
      score === ''
    ) {

      return 'Not available';

    }


    const numericScore =
      Number(score);


    if (
      Number.isFinite(
        numericScore
      )
    ) {

      return `${numericScore}%`;

    }


    return String(score);

  }


  getAiConfidence(): string {

    const confidence =
      this.findAiValue([
        'confidence',
        'aiConfidence',
        'confidencePercentage',
        'confidencePercent'
      ]);


    if (
      confidence === undefined ||
      confidence === null ||
      confidence === ''
    ) {

      return 'Not available';

    }


    const numericConfidence =
      Number(confidence);


    if (
      Number.isFinite(
        numericConfidence
      )
    ) {

      return `${numericConfidence}%`;

    }


    return String(confidence);

  }


  getDamageDetected(): string {

    const detected =
      this.findAiValue([
        'damageDetected',
        'hasDamage',
        'damage'
      ]);


    if (detected === true) {

      return 'Yes';

    }


    if (detected === false) {

      return 'No';

    }


    if (
      typeof detected === 'string'
    ) {

      const normalised =
        detected
          .toLowerCase()
          .trim();


      if (
        normalised === 'true' ||
        normalised === 'yes'
      ) {

        return 'Yes';

      }


      if (
        normalised === 'false' ||
        normalised === 'no'
      ) {

        return 'No';

      }

    }


    return 'Not available';

  }


  getOverallCondition(): string {

    const condition =
      this.findAiValue([
        'overallCondition',
        'condition',
        'overall'
      ]);


    if (
      condition !== undefined &&
      condition !== null &&
      String(condition).trim()
    ) {

      return String(condition).trim();

    }


    const extracted =
      this.extractAiSection(
        'OVERALL CONDITION'
      );


    return (
      extracted ||
      'Not available'
    );

  }


  getDamageCategories(): string {

    const categories =
      this.findAiValue([
        'damageCategories',
        'damageCategory',
        'categories'
      ]);


    if (
      Array.isArray(categories) &&
      categories.length > 0
    ) {

      return categories
        .map(
          category =>
            String(category).trim()
        )
        .filter(Boolean)
        .join(', ');

    }


    if (
      typeof categories === 'string' &&
      categories.trim()
    ) {

      return categories.trim();

    }


    return 'None detected';

  }


  getPotentialConcerns(): string {

    const concerns =
      this.findAiValue([
        'potentialConcerns',
        'concerns',
        'potentialIssues'
      ]);


    if (
      Array.isArray(concerns) &&
      concerns.length > 0
    ) {

      return concerns
        .map(
          concern =>
            String(concern).trim()
        )
        .filter(Boolean)
        .join(' • ');

    }


    if (
      typeof concerns === 'string' &&
      concerns.trim()
    ) {

      return concerns.trim();

    }


    const extracted =
      this.extractAiSection(
        'POTENTIAL CONCERNS'
      );


    return (
      extracted ||
      'None identified'
    );

  }


  getRecommendedFollowUp(): string {

    const followUp =
      this.findAiValue([
        'recommendedFollowUp',
        'recommendedFollowup',
        'followUp',
        'followup',
        'recommendations'
      ]);


    if (
      Array.isArray(followUp) &&
      followUp.length > 0
    ) {

      return followUp
        .map(
          item =>
            String(item).trim()
        )
        .filter(Boolean)
        .join(' • ');

    }


    if (
      typeof followUp === 'string' &&
      followUp.trim()
    ) {

      return followUp.trim();

    }


    const extracted =
      this.extractAiSection(
        'RECOMMENDED FOLLOW-UP'
      );


    return (
      extracted ||
      'No additional follow-up recommended'
    );

  }


  getInsuranceProcessing(): string {

    const processing =
      this.findAiValue([
        'insuranceProcessing',
        'insuranceAssessment',
        'insuranceRecommendation'
      ]);


    if (
      processing !== undefined &&
      processing !== null &&
      String(processing).trim()
    ) {

      return String(processing).trim();

    }


    const extracted =
      this.extractAiSection(
        'INSURANCE PROCESSING'
      );


    return (
      extracted ||
      'Not available'
    );

  }


  getAiStatus(): string {

    const status =
      this.findAiValue([
        'status',
        'aiStatus',
        'processingStatus'
      ]);


    if (!status) {

      return 'Not processed';

    }


    return this.formatAiStatus(
      String(status)
    );

  }


  private formatAiStatus(
    status: string
  ): string {

    return status
      .toLowerCase()
      .trim()
      .replace(/[-_]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(
        word =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(' ');

  }


  getAiProvider(): string {

    const provider =
      this.findAiValue([
        'provider',
        'aiProvider'
      ]);


    return (
      provider ||
      'Amazon Bedrock'
    );

  }


  getAiSummary(): string {

    const structuredSummary =
      this.findAiValue([
        'damageSummary',
        'summary',
        'assessmentSummary',
        'aiSummary'
      ]);


    if (
      typeof structuredSummary === 'string' &&
      structuredSummary.trim()
    ) {

      const summary =
        structuredSummary.trim();


      /*
       * If Bedrock has already returned a clean summary,
       * display it unchanged.
       *
       * If the value is the older combined section format,
       * extract only DAMAGE ASSESSMENT.
       */
      const damageAssessment =
        this.extractAiSection(
          'DAMAGE ASSESSMENT'
        );


      if (damageAssessment) {

        return damageAssessment;

      }


      return summary;

    }


    const extracted =
      this.extractAiSection(
        'DAMAGE ASSESSMENT'
      );


    return (
      extracted ||
      'No summary available.'
    );

  }


  /* =========================================================
     PHOTOS
     ========================================================= */

  getPhotoCount(): number {

    const vehiclePhotos =
      Array.isArray(
        this.inspection?.photos
      )
        ? this.inspection.photos.length
        : 0;


    const accidentPhotos =
      Array.isArray(
        this.inspection?.accidentPhotos
      )
        ? this.inspection.accidentPhotos.length
        : 0;


    return (
      vehiclePhotos +
      accidentPhotos
    );

  }


  getVehiclePhotos(): any[] {

    return Array.isArray(
      this.inspection?.photos
    )
      ? this.inspection.photos
      : [];

  }


  getAccidentPhotos(): any[] {

    return Array.isArray(
      this.inspection?.accidentPhotos
    )
      ? this.inspection.accidentPhotos
      : [];

  }


  getDamagePhotos(): any[] {

    return [];

  }


  getPhotoUrl(
    photo: any
  ): string {

    if (!photo) {

      return '';

    }


    const path =
      typeof photo === 'string'
        ? photo
        : (
          photo.imageUrl ||
          photo.url ||
          photo.path ||
          photo.fileName ||
          ''
        );


    return this.inspectionService
      .getPhotoUrl(path);

  }


  /* =========================================================
     REFERENCE
     ========================================================= */

  getReference(): string {

    return (
      this.inspection?.reference ||
      this.inspection?.id ||
      'Not available'
    );

  }


  /* =========================================================
     NAVIGATION
     ========================================================= */

  backToHistory(): void {

    this.stopAutoRefresh();

    this.router.navigate([
      '/history'
    ]);

  }


  goBack(): void {

    this.backToHistory();

  }


  retry(): void {

    this.stopAutoRefresh();

    this.loadInspection();

  }

}