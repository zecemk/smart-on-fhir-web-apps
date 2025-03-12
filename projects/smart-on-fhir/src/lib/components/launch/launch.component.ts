import {Component, Inject} from '@angular/core';
import * as FHIR from 'fhirclient'
import {ActivatedRoute} from "@angular/router";

import {SmartOnFhirConfig} from "../../model/smart-on-fhir.config";
import {SmartAuthService} from "../../services/smart-auth.service";

@Component({
  selector: 'lib-launch',
  templateUrl: './launch.component.html',
  styleUrl: './launch.component.css'
})
export class LaunchComponent {
  constructor(@Inject('sofConfig') private config: SmartOnFhirConfig,private route: ActivatedRoute, private auth: SmartAuthService) {
    this.route.queryParams.subscribe(params => {
      const iss = decodeURIComponent(params['iss'])
      const launch = params['launch']
      this.auth.launch(iss, launch)
    })
  }
}
