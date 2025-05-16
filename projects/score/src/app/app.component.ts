import {Component, Injector, OnDestroy, Signal} from '@angular/core';
import {Router} from '@angular/router';
import {debounceTime, Subject} from "rxjs";
import {CdsUtils, StatefulCdsService} from "common";
import {SmartOnFhirService} from "smart-on-fhir";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

}
