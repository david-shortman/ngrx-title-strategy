import { Component } from '@angular/core';
import { getSelectors } from '@ngrx/router-store';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-root',
  template: `Title selected from router store is: {{ title$ | async }}`,
})
export class AppComponent {
  constructor(private readonly store: Store) {}

  title$ = this.store.select(getSelectors().selectTitle);
}
