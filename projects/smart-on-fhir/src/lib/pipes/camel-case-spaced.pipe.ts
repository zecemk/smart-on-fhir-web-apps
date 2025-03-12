import {Pipe, PipeTransform} from "@angular/core";

@Pipe({
  name: 'camelCaseSpaced'
})
export class CamelCaseSpacedPipe implements PipeTransform {
  transform(value: string): any {
    return value.replaceAll(/([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g, '$1$4 $2$3$5')
  }
}
