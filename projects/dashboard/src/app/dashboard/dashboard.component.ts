import {Component} from '@angular/core';
import {environment} from "../../environments/environment";
import {AppMetadata} from "../../environments/AppMetadata";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  sections = environment.appSections;
  selectedApp!: AppMetadata;
}
