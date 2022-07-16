import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StoreModule } from '@ngrx/store';
import { provideNgRxTitleStrategy } from './title-strategy';
import { EffectsModule } from '@ngrx/effects';
import { CounterEffects, counterFeature } from './counter';
import { routerReducer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    StoreModule.forRoot({ router: routerReducer }, {}),
    StoreRouterConnectingModule.forRoot({}),
    EffectsModule.forRoot([CounterEffects]),
    StoreModule.forFeature(counterFeature),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
    }),
  ],
  providers: [provideNgRxTitleStrategy()],
  bootstrap: [AppComponent],
})
export class AppModule {}
