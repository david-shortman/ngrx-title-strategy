import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  createAction,
  createFeature,
  createReducer,
  on,
  props,
} from '@ngrx/store';
import { interval, map, switchMap } from 'rxjs';

const initialState = { count: '0', event: 'anything' };

const secondElapsed = createAction('second elapsed');
export const actionIntent = createAction(
  'action intent',
  props<{ event: string }>()
);

export const counterFeature = createFeature({
  name: 'counterFeature',
  reducer: createReducer(
    initialState,
    on(secondElapsed, (state) => ({
      ...state,
      count: `${Number(state.count) + 1}`,
    })),
    on(actionIntent, (state, { event }) => ({
      ...state,
      event,
    }))
  ),
});

@Injectable({ providedIn: 'root' })
export class CounterEffects {
  constructor(private readonly actions$: Actions) {}
  count$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(actionIntent),
      switchMap(() => interval(1000).pipe(map(() => secondElapsed())))
    );
  });
}
