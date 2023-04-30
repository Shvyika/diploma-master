import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { InformationValueModelComponent } from './information-value-model/information-value-model.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'models'
  },
  {
    path: 'models',
    component: InformationValueModelComponent
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
