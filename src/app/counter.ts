import { Injectable } from '@angular/core';
import { createEffect } from '@ngrx/effects';
import { createAction, createFeature, createReducer, on } from '@ngrx/store';
import { interval, map } from 'rxjs';

const initialState = { count: '0', event: 'Something' };

const secondElapsed = createAction('second elapsed');

export const counterFeature = createFeature({
  name: 'counterFeature',
  reducer: createReducer(
    initialState,
    on(secondElapsed, (state) => ({
      ...state,
      count: `${Number(state.count) + 1}`,
    }))
  ),
});

@Injectable({ providedIn: 'root' })
export class CounterEffects {
  count$ = createEffect(() => {
    return interval(1000).pipe(map(() => secondElapsed()));
  });
}
