import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CdsBaseComponent, CDSInitializer } from "common";
import { environment } from "../environments/environment";
import { SmartOnFhirService } from "ng-smart-on-fhir";


@Component({
  selector: 'rp-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})


export class AppComponent extends CdsBaseComponent implements CDSInitializer {
  override serviceName = environment.cds.serviceName;
  sidebarRows: any[] = [];


  override async ngOnInit() {
    console.log('Service name:', this.serviceName);
    console.log('Environment:', environment.cds);

    await super.ngOnInit();
    this.prepareSidebarData();
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

  private prepareSidebarData() {
    if (!this.patient) return;

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

}
