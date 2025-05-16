import {Component} from '@angular/core';
import {CdsBaseComponent, CDSInitializer} from "common";
import {environment} from "../environments/environment";

@Component({
  selector: 'acc_aha-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent extends CdsBaseComponent implements CDSInitializer {
  override serviceName = environment.cds.serviceName;
  ageValid: boolean = false;

  override async ngOnInit() {
    await super.ngOnInit();
    this.ageValid = (this.age >= 40 && this.age <=79)
  }
}

