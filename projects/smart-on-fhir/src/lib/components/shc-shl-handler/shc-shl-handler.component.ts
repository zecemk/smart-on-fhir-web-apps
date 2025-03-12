import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ShlService} from "../../services/shl.service";
import * as jose from 'jose';
import {SmartOnFhirService} from "../../services/smart-on-fhir.service";
import {SmartAuthService} from "../../services/smart-auth.service";

@Component({
  selector: 'shc-shl-handler',
  template: `
    <div class="container">
      @if (invalidSignature) {
        <div class="alert alert-danger">
          Issuer verification failed for the Smart Health Card!
        </div>
        <button class="btn btn-danger" (click)="_window.history.back()"><i class="bi-arrow-left"></i> Back</button>
      } @else {
        <table class="table" id="shc-content">
          <tbody>
          <tr>
            <td><b>Patient</b></td>
            <td>{{ patientName }}</td>
          </tr>
          <tr>
            <td><b>Age</b></td>
            <td>{{ patientAge }}</td>
          </tr>
          <tr>
            <td><b>Gender</b></td>
            <td>{{ patient?.gender }}</td>
          </tr>
            @for (resources of sof.importedResources | keyvalue; track resources.key) {
              <tr>
                <td><b>{{resources.key | camelCaseSpaced}}</b></td>
                <td><span class="badge text-bg-primary text-light">{{resources.value?.length}}</span></td>
              </tr>
            }
          <tr>
            <td colspan="2" class="text-end">
              <button class="btn btn-primary" routerLink="/">Continue <i class="bi bi-arrow-right"></i></button>
            </td>
          </tr>
          </tbody>
        </table>
      }
    </div>
    <style>
      #shc-content td:first-child {
        width: 25em;
        max-width: 100%;
      }
    </style>
  `
})

export class ShcShlHandlerComponent implements OnInit {
  _window = window;

  invalidSignature: boolean = false;

  patient: fhir4.Patient|undefined;

  get patientName() {
    return this.patient?.name?.map(name => (name.given?.join(' ') || '') + ' ' + name.family).join(', ')
  }

  get patientAge() {
    if (this.patient?.birthDate) {
      return Math.ceil((Date.now() - new Date(this.patient.birthDate).getTime()) / (1000 * 3600 * 24 * 365))
    } else {
      return '';
    }
  }

  constructor(private route: ActivatedRoute, private auth: SmartAuthService, private shl: ShlService, public sof: SmartOnFhirService) {
    this.auth.getPatient().then(patient => this.patient = patient);
    route.fragment.subscribe(async fragment => {
      try {
        if (fragment?.startsWith('shlink:/')) {
          this.sof.importSHCData(await this.shl.handleShl(fragment))
        } else if (fragment?.startsWith('shc:/')) {
          this.sof.importSHCData(await this.shl.handleShc(fragment))
        } else {
          console.log(fragment)
        }
      } catch (error) {
        if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
          this.invalidSignature = true;
        }
      }
    })
  }

  ngOnInit() {
  }
}
