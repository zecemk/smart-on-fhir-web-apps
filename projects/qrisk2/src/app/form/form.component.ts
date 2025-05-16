import {Component} from '@angular/core';
import {CdsBaseComponent, CDSFormStateHandler} from "common";
import {environment} from "../../environments/environment";

@Component({
  selector: 'qrisk2-form',
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss'
})
export class FormComponent extends CdsBaseComponent implements CDSFormStateHandler {

  serviceName = environment.cds.serviceName
  override autoCallCdsService: false = false;
  valid = false

  override handleState(state: any) {
    this.valid = this.checkIfAllRequiredFieldsHaveValue(state)
  }
}

