import {Component, OnDestroy, Signal} from '@angular/core';
import {SmartOnFhirService} from "smart-on-fhir";
import {Subject} from "rxjs";
import {CdsDataService} from "common";

@Component({
  selector: 'qrisk2-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent  implements OnDestroy {

  scores: number[] = [];
  error: string | undefined;
  patient: fhir4.Patient|undefined;

  age: number = 0;

  loadingPatientData: boolean = false;
  conceptDefinitions: { id: string, value: Signal<any>, [key: string]: any }[] = [];

  private destroy$: Subject<void> = new Subject();

  constructor(private sof: SmartOnFhirService, private qriskService: CdsDataService) {
  }

  ngOnDestroy() {
    this.destroy$.next()
  }

  async ngOnInit() {
    this.loadingPatientData = true;
    this.patient = await this.sof.getPatient()
    this.age = (new Date().getFullYear()) - (new Date(<string>this.patient?.birthDate).getFullYear())
    const client = await this.sof.getClient()
    await this.qriskService.init(client, this.patient, 'qrisk', Object.values(this.sof.importedResources).flat())
    this.loadingPatientData = false
  }

  logout() {
    this.patient = undefined
    this.sof.logout()
  }
}

