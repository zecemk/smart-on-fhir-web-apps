export interface SmartAppMetadata {
  smartAppId?: string;
  modelReference?: string;
  modelVersion?: string;
  name?: string;
  version?: string;
  keywords?: string[];
  description?: string;
  category?: string[];
  healthTheme?: string[];
  publisher?: string;
  trlLevel?: string;
  license?: string;
  contactPoint?: string;
  primaryUse?: string;
  secondaryUse?: string;
  intendedUsers?: string;
  contraindications?: string;
  ethicalConsiderations?: string;
  limitations?: string[];
  createdAt?: string;
  createdBy?: string;
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
  fhirCompatibility?: string;
  landingPage?: string;
  smartLaunchURI?: string;
  redirectURIs?: string[];
}

export interface AppMetadata {
  id: string,
  title: string,
  description: string,
  url: string,
  icon?: string,
  img?: string,
  metadata: SmartAppMetadata
}
