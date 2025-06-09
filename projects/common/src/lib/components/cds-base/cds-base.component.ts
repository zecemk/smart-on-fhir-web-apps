import {Directive, Injector, OnDestroy, OnInit} from '@angular/core';
import {CdsDataService, StatefulCdsService} from "../../services";
import { SmartOnFhirService } from 'ng-smart-on-fhir';
import {Subject} from "rxjs";

export interface CDSInitializer {
  serviceName: string;
  handleState?(state: any): any;
  handleServiceError?(error: Error): any;
  handleServiceResponse?(response: any): any;
  transformState?(state: any): { prefetch: any, context: any };
}

export interface CDSFormStateHandler extends CDSInitializer {
  autoCallCdsService: false;
  handleState(state: any): any;
}

export interface CDSAutoExecutor extends CDSInitializer {
  autoCallCdsService: true;
  handleServiceResponse(response: any): any;
  handleServiceError(error: Error): any;
}

@Directive()
export abstract class CdsBaseComponent implements OnInit, OnDestroy, CDSInitializer {

  autoCallCdsService?: true|false;
  abstract serviceName: string;

  loadingPatientData: boolean = false;
  patient: fhir4.Patient|undefined;
  age: number = 0;
  private destroy$: Subject<void> = new Subject();


  constructor(public cdsDataService: CdsDataService, protected sof: SmartOnFhirService, protected injector: Injector,
              protected cdsService: StatefulCdsService) {
  }

  async ngOnInit() {
    await this.init();
    this.handlePrefetchStateChange()
  }

  async init() {
    this.loadingPatientData = true;
    this.patient = await this.sof.getPatient()
    this.age = (new Date().getFullYear()) - (new Date(<string>this.patient?.birthDate).getFullYear())
    await this.cdsDataService.init(this.patient, this.serviceName, this.sof.getAllImportedResources())
    this.loadingPatientData = false
  }

  handlePrefetchStateChange() {
    this.cdsDataService.onPrefetchStateChange({
      callService: this.autoCallCdsService,
      handleState: (state) => this.handleState(state),
      handleServiceError: (error) => this.handleServiceError(error),
      transformState: (state) => this.transformState(state),
      handleServiceResponse: (response) => this.handleServiceResponse(response),
      injector: this.injector,
      takeUntil: this.destroy$
    })
  }

  reset() {
    this.cdsDataService.resetState()
  }

  checkIfAllRequiredFieldsHaveValue(state: any) {
    return this.cdsDataService
      .conceptDefinitions?.every(definition => !definition.required
      || state[definition.id].value?.value || state[definition.id].value?.code)
  }

  ngOnDestroy() {
    this.destroy$.next()
  }

  logout() {
    this.patient = undefined
    this.sof.logout()
  }

  handleState(state: any) {}

  handleServiceError(error: Error) {}

  transformState(state: any) {
    return {context: undefined, prefetch: undefined};
  }

  handleServiceResponse(response: any) {}
}
