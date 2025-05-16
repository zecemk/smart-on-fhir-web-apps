import {Directive} from "@angular/core";
import {CDSAutoExecutor, CdsBaseComponent} from "../cds-base/cds-base.component";
import {CdsUtils} from "../../utils";

@Directive()
export abstract class CdsSimulationComponent extends CdsBaseComponent implements CDSAutoExecutor {

  override autoCallCdsService: true = true;
  error: any;
  suggestions: any[] = [];

  applySuggestions() {
    const state = this.cdsService.getState(this.cdsDataService.conceptDefinitions)
    const tmpPrefetch = CdsUtils.stateToPrefetch(state, this.cdsDataService.conceptDefinitions, <fhir4.Patient>this.patient, true)
    const prefetch = CdsUtils.applySuggestions(tmpPrefetch, this.suggestions, this.cdsDataService.conceptDefinitions)
    this.cdsService.callService({
      serviceId: this.serviceName,
      language: 'en',
      patient: this.patient
    }, {
      prefetch,
      context: {
        patientId: this.patient?.id
      }
    }).then(response => this.handleServiceResponseAndSuggestions(response, false), error => this.handleServiceError(error))
  }

  override transformState(state: any): { context: any, prefetch: any } {
    if (this.patient && !this.patient?.id) { this.patient.id = 'standalone' }
    this.resetScores()
    this.error = undefined
    return {
      context: {
        patientId: this.patient?.id
      },
      prefetch: CdsUtils.stateToPrefetch(state, this.cdsDataService.conceptDefinitions, <fhir4.Patient>this.patient, true)
    }
  }

  override handleServiceResponse(response: any) {
    this.handleServiceResponseAndSuggestions(response, true)
  }

  protected abstract resetScores(): void;

  protected abstract handleServiceResponseAndSuggestions(response: any, updateSuggestions: boolean): void;

}
