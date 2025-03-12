/** DO NOT USE */
export class InMemorySearch {
  public static queryResources(resources: fhir4.Resource[], query: string): fhir4.Resource[] {
    const [_, resourceType, idPart, queryPart] = /^([a-zA-Z]+)(\/[a-zA-Z]+)?(\?.*)?$/.exec(query) || []
    if (idPart) {
      return resources.filter(resource => resource.resourceType === resourceType && resource.id === idPart.slice(1))
    } else if (queryPart) {
      let matched = [...resources]
      const queryParams = queryPart.slice(1).split('&').map((p: string) => p.split('='))
      queryParams.forEach(param => {
        if (!param[1]) { return; }
        const [parameter, modifier] = param[0].split(':')
        const values = param[1].split(',')
        matched = matched.filter(resource => {
          if (resource.resourceType !== resourceType) { return false; }
          switch (parameter) {
            case 'code':
              const codings: fhir4.Coding[] = this.getCodes(resource)
              return this.compareCodings(values, modifier, codings)
            case 'patient':
            case 'subject':
            default:
              return true;
          }
        })
      })
      return matched;
    } else {
      return resources.filter(resource => resource.resourceType === resourceType)
    }
  }

  public static getCodes(resource: fhir4.Resource): fhir4.Coding[] {
    switch (resource.resourceType) {
      case 'Condition': return (<fhir4.Condition>resource).code?.coding || [];
      case 'Observation': return (<fhir4.Observation>resource).code?.coding || [];
      case 'MedicationStatement': return (<fhir4.MedicationStatement>resource).medicationCodeableConcept?.coding || [];
      default: return [];
    }
  }

  public static compareCodings(values: string[], modifier: string|undefined, codings: fhir4.Coding[]) {
    switch (modifier) {
      case 'sw':
        return values.some(value => {
          const [code, system] = value.split('|').reverse()
          return codings.some(coding => (!system || coding.system === system) && coding.code?.startsWith(code))
        });
      case 'not':
      case 'ne':
        return values.every(value => {
          const [code, system] = value.split('|').reverse()
          return !codings.some(coding => (!system || coding.system === system) && coding.code === code)
        });
      default:
        return values.some(value => {
          const [code, system] = value.split('|').reverse()
          return codings.some(coding => (!system || coding.system === system) && coding.code === code)
        });
    }
  }
}
