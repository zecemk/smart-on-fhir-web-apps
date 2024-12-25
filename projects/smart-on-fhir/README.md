# SmartOnFhir

An Angular library to provide SMART-on-FHIR authorization with:

- Login, Callback, Launch pages
- Routing wrapper
- Routing Guard
- Authenticated FHIR client service

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.0.

## Build

Run `ng build smart-on-fhir` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

You need credentials to be able to publish the library to the private Nexus Repository. Execute the following command with correct username and password for publishing. Also make sure that you execute the command under the dist folder.

```
cd dist/smart-on-fhir
npm publish --registry=http://nexus.srdc.com.tr/repository/npm-releases/ --//nexus.srdc.com.tr/repository/npm-releases/:_auth=$(echo -n 'username:password' | base64) --access public
```

After publishing the package, it will be available with srdc scope and can be installed via @srdc/smart-on-fhir dependency.


## Installation

### 1. Prerequisites

Install peer dependencies:

```
npm install bootstrap fhirclient --save
npm install @types/fhir --save-dev
```

### 2. Resolving the Nexus Repository

To resolve the Nexus Repository and install the `smart-on-fhir` library as a dependency in your project, first, you have to associate the scope `srdc` with the address of the private [Nexus Repository](http://nexus.srdc.com.tr/repository/npm-releases). To achieve this you need follow one of the 2 following ways:

**Way 1:** Global Configuration

Executing the following command will modify the `.npmrc` file located in your user folder (e.g. /home/User/.npmrc).

``npm config set @srdc:registry http://nexus.srdc.com.tr/repository/npm-releases/``

This will associate `srdc` scope with the address of the private [Nexus Repository](http://nexus.srdc.com.tr/repository/npm-releases/) for all the projects on your computer.

**Way 2:** Local Configuration

You can do the scope association local to your project by creating a `.npmrc` in the root folder of your project and simply enter:

`@srdc:registry=http://nexus.srdc.com.tr/repository/npm-releases/`

This configuration will only affect your current project.

### 3. Installing the Library

Once a scope is associated with a registry, any `npm install` for a package with that scope will request packages from that registry instead. Therefore, you can simply install the dependency by executing.

```npm install @srdc/smart-on-fhir --save```

## Usage

Here's an example of how to integrate the SmartOnFhir into your Angular project.

Importing the module:

```
import { SmartOnFhirModule } from '@srdc/smart-on-fhir';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SmartOnFhirModule.forRoot({ // import module with configurations
      clientIds: { // Client IDs to be used in Launch flow
        'https://lforms-smart-fhir.nlm.nih.gov/v/r4/fhir': 'srdc-qrisk'
      },
      redirectUrl: appBaseUrl + '/callback',
      loginClients: [ // buttons for initiating SMART Login flow
        {
          label: 'EPIC',
          image: 'asset/epic.png', // image to be displayed in login page
          // if image is not provided, a button with the label will be shown
          // you can set background, color, etc. to customize the button
          iss: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/',
          redirectUri: appBaseUrl + '/callback',
          clientId: '<epic-client-id>',
          scope: 'launch launch/patient patient/*.*'
        }
      ],
      launchClients: [ // links to the providers with SMART Launch flow
        {
          label: 'NIH - Smart Launch',
          background: '#326295',
          color: 'white',
          url: 'https://lforms-smart-fhir.nlm.nih.gov/'
        }
      ]
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Adding SMART authentication handling routes in your **Routing Module**:

```
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {withSmartHandlerRoutes} from "smart-on-fhir";
import {HomeComponent} from "./home/home.component";
import {ResultsComponent} from "./results/results.component";

const routes: Routes = withSmartHandlerRoutes( // wrap your own routes with the SMART routes
  [
    {
      path: '',
      component: HomeComponent
    }
  ], // your app routes
  '/', // base url to be redirected
  'both', // supported login methods; options are: 'launch'|'client'|'both'
  true // redirect to login page if not authorized
);

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

```

> The `withSmartHandlerRoutes` method adds an auth Guard to your routes automatically if `redirectToLoginIfUnauthorized` parameter is `true`.

Using the SMART Fhir Client Service in your components:

```
...
import {SmartOnFhirService} from "@srdc/smart-on-fhir"

@Component({
  selector: 'app-component',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  
  private client: Client|undefined;
  patient: fhir4.Patient|undefined;
  vitalSigns: fhir4.Bundle<fhir4.Observation>|undefined;
  
  constructor(private smartOnFhirService: SmartOnFhirService) {}
  
  async ngOnInit() {
    this.patient = await this.sof.getPatient();
    this.vitalSigns = await this.sof.search<fhir4.Observation>(
      "Observation",
      { category: 'vital-signs' }
    );
  }

...

```

Login, Callback, Launch pages uses `bootstrap`. You can import bootstrap css to your project in `angular.json`:

```
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
      ...
      "architect": {
        "build": {
          ...
            "styles": [
              "node_modules/bootstrap/dist/css/bootstrap.min.css",
              "src/styles.css"
            ],
            "scripts": []
          },
          ...
        "test": {
            ...
            "styles": [
              "node_modules/bootstrap/dist/css/bootstrap.min.css",
              "src/styles.css"
            ],
            "scripts": []
          }
        }
      }
    }
  }
}

```

Or you can import it to your `styles.scss` and customize theme variables:

```
/* You can add global styles to this file, and also import other style files */
@import "../../../node_modules/bootstrap/scss/functions";

$_primary: #761eb1;
$_secondary: #9328DA;

$theme-colors: (
  "light":      #f5f5f5,
  "dark":       adjust-hue(shade-color($_primary, 45), 10),
  "primary":    $_primary,
  "secondary": $_secondary,
  "info": #abedf6,
  "success":    #b8e186,
  "warning":    #fde47f,
  "danger": #f32509,
  "primary-text": #f8f9fa,
  "secondary-text": #f8f9fa
);

.btn {
  color: #f8f9fa !important;
}

.input-group > input:focus + .input-group-text {
  background: $_primary !important;
}

@import "../../../node_modules/bootstrap/scss/variables";
@import "../../../node_modules/bootstrap/scss/variables-dark";
@import "../../../node_modules/bootstrap/scss/maps";
@import "../../../node_modules/bootstrap/scss/mixins";
@import "../../../node_modules/bootstrap/scss/root";

@import "../../../node_modules/bootstrap/scss/buttons";
@import "../../../node_modules/bootstrap/scss/bootstrap";
```

## Development

You can continue development of this library by including it as a `devDependency` in your `package.json`. Before doing it, you will need to link the library.
First, build the library:

```
cd path/to/smart-on-fhir 
ng build smart-on-fhir
```

Then, link the `smart-on-fhir` library globally:

```
cd path/to/smart-on-fhir/dist/smart-on-fhir 
npm link
```

Next, link the `smart-on-fhir` library to your project:

```
cd path/to/your-project 
npm link smart-on-fhir
```

Finally, add your `smart-on-fhir` library as a `devDependency` in your `package.json`:

```
  "devDependencies": {
    "smart-on-fhir": "file:.path/to/smart-on-fhir/dist/smart-on-fhir",
  }
```

Import the module in your project with something like this:

```
import {
    SmartOnFhirModule
} from "../../../../../../smart-on-fhir/projects/smart-on-fhir/src/lib/smart-on-fhir.module";
```
