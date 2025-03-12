import {Component, Injector, OnDestroy, OnInit} from '@angular/core';
import {CdsDataService} from "common";
import Client from "fhirclient/lib/Client";
import {SmartOnFhirService} from "smart-on-fhir";
import {Subject} from "rxjs";

@Component({
  selector: 'qrisk2-form',
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss'
})
export class FormComponent implements OnInit, OnDestroy {
  loadingPatientData: boolean = false;
  private client: Client|undefined;
  private patient: fhir4.Patient|undefined;
  private destroy$: Subject<void> = new Subject();
  valid = false

  constructor(public qriskService: CdsDataService, private sof: SmartOnFhirService, private injector: Injector) {
  }

  async ngOnInit() {
    this.loadingPatientData = true
    this.client = await this.sof.getClient()
    this.patient = await this.sof.getPatient()
    await this.qriskService.init(undefined, this.patient, 'qrisk', Object.values(this.sof.importedResources).flat())
    this.loadingPatientData = false
    this.qriskService.onPrefetchStateChange({
      callService: false,
      handleState: (state) => {
        this.valid = this.qriskService
          .conceptDefinitions?.every(definition => !definition.required
            || state[definition.id].value?.value || state[definition.id].value?.code)
      },
      injector: this.injector,
      takeUntil: this.destroy$
    })
  }

  ngOnDestroy() {
    this.destroy$.next()
  }

  reset() {
    this.qriskService.resetState()
  }
}

