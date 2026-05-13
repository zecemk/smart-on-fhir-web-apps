import {Component, OnInit} from '@angular/core';
import {AppMetadata} from "../environments/AppMetadata";
import {SmartOnFhirService} from "ng-smart-on-fhir";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'dashboard';
  patient!: fhir4.Patient;
  sidebarRows: any;

  constructor(private sof: SmartOnFhirService) {
  }

  async ngOnInit() {
    this.patient = (await this.sof.getPatient()) as fhir4.Patient;
    this.sidebarRows = [
      {
        label: 'Name',
        value: this.patient.name?.[0]?.given?.join(' ') + ' ' + this.patient.name?.[0]?.family || 'N/A'
      },
      {
        label: 'Gender',
        value: this.patient.gender || 'N/A'
      },
      {
        label: 'Birth Date',
        value: this.patient.birthDate || 'N/A'
      },
      {
        label: 'Age',
        value: this.calculateAge(this.patient.birthDate)?.toString() || 'N/A'
      },
      {
        label: 'Patient ID',
        value: this.patient.id || 'N/A'
      }
    ];
  }

  private calculateAge(birthDate?: string): number | null {
    if (!birthDate) return 1;

    const dob = new Date(birthDate);
    if (Number.isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();

    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }
}
