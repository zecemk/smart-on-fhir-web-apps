import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { environment } from "../../environments/environment";
import {
  AppMetadata,
  SmartAppMetadata,
  ModelCardMetadata
} from "../../environments/AppMetadata";

@Component({
  selector: 'app-application-metadata',
  templateUrl: './application-metadata.component.html',
  styleUrl: './application-metadata.component.scss'
})
export class ApplicationMetadataComponent {

  app: AppMetadata | undefined;
  appMetadata: SmartAppMetadata | undefined;

  // Loaded model-card JSON will be stored here
  modelCard: ModelCardMetadata | undefined;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.route.params.subscribe(params => {
      this.setApp(params['id']);
    });
  }

  private setApp(id: string) {

    this.app = environment.appSections
      .flatMap(section => section.apps)
      .find(app => app.id === id);

    this.appMetadata = this.app?.metadata || undefined;

    // Reset when navigating between applications
    this.modelCard = undefined;

    // Load model card only if this application has one
    if (this.appMetadata?.modelCardUrl) {
      this.loadModelCard(this.appMetadata.modelCardUrl);
    }

    console.log(this.app, this.appMetadata);
  }

  private loadModelCard(url: string) {

    this.http.get<ModelCardMetadata>(url).subscribe({
      next: modelCard => {
        this.modelCard = modelCard;
        console.log('Model card loaded:', modelCard);
      },
      error: error => {
        console.error('Failed to load model card:', error);
        this.modelCard = undefined;
      }
    });
  }

}