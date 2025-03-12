export interface LoginClientConfig {
  promptLogin?: boolean;
  label: string;
  image?: string;
  icon?: string;
  background?: string;
  color?: string;
  clientId: string;
  iss: string;
  redirectUri: string;
  scope: string;
  aud?: string;
  logoutUri?: string;
  isPublic?: boolean;
}
