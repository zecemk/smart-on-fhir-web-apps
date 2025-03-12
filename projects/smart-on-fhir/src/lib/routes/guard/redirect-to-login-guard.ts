import {CanActivateFn, Router} from "@angular/router";
import {inject} from "@angular/core";
import {SmartAuthService} from "../../services/smart-auth.service";
import {SmartOnFhirService} from "../../services/smart-on-fhir.service";
import {ShlService} from "../../services/shl.service";

export const redirectUnauthorizedToLogin: CanActivateFn = async function (route, state) {
  const router = inject(Router);
  const auth = inject(SmartAuthService);
  const sof = inject(SmartOnFhirService);
  const shl = inject(ShlService)
  if (auth.isLoggedIn()) { return true; }
  try {
    const context = auth.restoreSession()
    if (context?.shc) {
      await Promise.all(context.shc.map(async (shc: string) => sof.importSHCData(await shl.handleShc(shc))))
    }
    await auth.start();
    return auth.isLoggedIn();
  } catch (err) {}
  if (auth.isLoggedIn()) { return true; }
  await router.navigate(['/login'])
  return false;
}
