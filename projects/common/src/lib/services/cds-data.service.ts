import { Injectable } from '@angular/core';
import {PrefetchStateChangeOptions, StatefulCdsService} from "./stateful-cds.service";
import { SmartOnFhirService } from 'ng-smart-on-fhir';

@Injectable()
export class CdsDataService {
  conceptDefinitions: any[] = [];
  patient: fhir4.Patient|undefined;
  Id: string = '';
  private initialized: Promise<void>|undefined;

  constructor(private statefulCdsService: StatefulCdsService, private sof: SmartOnFhirService) { }

  private async _init(patient: fhir4.Patient | undefined, serviceId: string, resources?: fhir4.Resource[]) {
    this.Id = serviceId;
    this.patient = patient;
    this.conceptDefinitions = await this.statefulCdsService?.createState({
      patient: this.patient,
      serviceId: this.Id,
      language: 'en',
      resources
    }) || []
  }

  init(patient: fhir4.Patient | undefined, serviceId: string, resources?: fhir4.Resource[]) {
    if (!this.initialized) {
      this.initialized = this._init(patient, serviceId, resources)
    }
    return this.initialized
  }

  resetState() {
    this.statefulCdsService?.resetState(this.conceptDefinitions)
  }

  onPrefetchStateChange(options: PrefetchStateChangeOptions) {
    if (!this.initialized) {
      throw new Error( this.Id + ' service should be initialized.')
    }
    this.statefulCdsService?.onPrefetchStateChange({
      patient: this.patient,
      serviceId: this.Id,
      language: 'en',
      onPrefetchStateChange: options
    })
  }

}
