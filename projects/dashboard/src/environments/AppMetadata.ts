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
  modelCardUrl?: string;
}

export interface ModelCardMetadata {
  header?: {
    name?: string;
    version?: string;
    version_date?: string;
    release_stage?: string;
    regulatory_status?: string;
  };

  summary?: string;

  intended_use?: {
    primary?: string;
    target_population?: string;
    human_oversight_required?: boolean;
    human_oversight_description?: string;
  };

  cautioned_out_of_scope_uses?: string[];

  known_limitations?: string[];
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
