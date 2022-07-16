import { Component } from '@angular/core';
import { getSelectors } from '@ngrx/router-store';
import { Store } from '@ngrx/store';
import { actionIntent } from './counter';

@Component({
  selector: 'app-root',
  template: `<label for="actionInput">Action </label>
    <br />
    <input #actionInput id="actionInput" />
    <button style="margin-left:2px" (click)="performAction(actionInput.value)">
      Do action
    </button>
    <br /><br />
    Raw title selected from router store is: {{ title$ | async }}`,
})
export class AppComponent {
  constructor(private readonly store: Store) {}

  title$ = this.store.select(getSelectors().selectTitle);

  performAction(event: string) {
    this.store.dispatch(actionIntent({ event }));
  }
}
