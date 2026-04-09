import {Injectable} from '@angular/core';

@Injectable()
export class MenuService {

  menuItems: {
    label: string,
    header?: boolean,
    href?: string,
    routerLink?: string,
    routerLinkActive?: string[]|string,
    callback?: (...args: any[]) => any
  }[] = []

  constructor() {
  }
}
