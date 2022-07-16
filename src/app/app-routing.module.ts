import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { counterFeature } from './counter';
import { ngRxTitle } from './title-strategy';

const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    title: ngRxTitle`${counterFeature.selectCount} Seconds Since ${counterFeature.selectEvent}`,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
