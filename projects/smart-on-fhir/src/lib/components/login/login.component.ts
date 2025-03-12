import {Component, Inject} from '@angular/core';
import {LoginClientConfig} from "../../model/login-client.config";
import {SmartOnFhirConfig} from "../../model/smart-on-fhir.config";
import {SmartAuthService} from "../../services/smart-auth.service";
import {SmartOnFhirService} from "../../services/smart-on-fhir.service";
import {Router} from "@angular/router";
import Client from "fhirclient/lib/Client";

@Component({
  selector: 'lib-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  scanning: boolean = false;
  patientSelection: boolean = false;
  patientsLoading: boolean = false;
  selectedClient: LoginClientConfig|undefined;
  patients: fhir4.Patient[] = [];
  total: number = 0;
  page: number = 1;
  private _patientQuery: string = '';
  private client: Client|undefined;

  get patientQuery(): string {
    return this._patientQuery;
  }

  set patientQuery(value: string) {
    this._patientQuery = value;
    this.searchPatients();
  }

  hasPreviousPage(): boolean { return this.page > 1 }
  hasNextPage(): boolean { return this.page < (this.total / 10) }

  constructor(@Inject('sofConfig') public config: SmartOnFhirConfig, private auth: SmartAuthService,
              private sof: SmartOnFhirService, private router: Router) {
  }

  async login(config: LoginClientConfig) {
    if (config.isPublic) {
      this.client = this.auth.publicClient(config.iss)
      this.searchPatients()
      this.patientSelection = true;
      this.selectedClient = config;
    } else {
      this.auth.login(config)
    }
  }

  selectPatient(patient: fhir4.Patient) {
    if (this.selectedClient) {
      this.auth.login(this.selectedClient, patient)
      this.router.navigate(['/'])
    }
  }

  next() { this.page += 1; this.searchPatients(); }
  prev() {
    this.page = this.page > 1 ? this.page - 1 : 1;
    this.searchPatients();
  }

  async searchPatients() {
    this.patientsLoading = true;
    let query = 'Patient?_count=10&_page=' + this.page;
    if (this.patientQuery?.trim()) { query += '&' + this.patientQuery.trim().split(' ').map(name => 'name:contains=' + name).join('&') }
    const bundle = await this.client?.request<fhir4.Bundle<fhir4.Patient>>(query)
    if (bundle) {
      this.patients = <fhir4.Patient[]>bundle.entry?.map(entry => entry.resource)
        .filter(res => !!res) || []
      this.total = bundle.total || 0;
      if ((this.page - 1) * 10 > this.total) {
        this.page = 1
      }
    } else {
      this.patients = []
      this.total = 0;
      this.page = 1;
    }
    this.patientsLoading = false;
  }
}
