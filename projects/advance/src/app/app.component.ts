import {Component} from '@angular/core';
import {CdsBaseComponent, CDSInitializer} from "common";
import {environment} from "../environments/environment";

@Component({
  selector: 'advance-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent extends CdsBaseComponent implements CDSInitializer {
  override serviceName = environment.cds.serviceName;
}

