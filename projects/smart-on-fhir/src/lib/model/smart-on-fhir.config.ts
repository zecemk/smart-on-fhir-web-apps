import {LoginClientConfig} from "./login-client.config";
import {LaunchClientConfig} from "./launch-client.config";

export interface SmartOnFhirConfig {
  shcLoginEnabled?: boolean;
  shcCallbackUrl?: string;
  clientIds?: { [iss: string]: string };
  clientId?: string;
  redirectUrl?: string;
  loginClients?: LoginClientConfig[];
  launchClients?: LaunchClientConfig[];
  logo?: string;
  title?: string;
}
