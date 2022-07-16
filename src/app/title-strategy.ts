import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { MemoizedSelector, Store } from '@ngrx/store';
import { combineLatest, map, of, Subscription, tap } from 'rxjs';

const ngRxTitleSelectorUuidMapSymbol = Symbol(
  '__NGRX_TITLE_SELECTOR_UUID_MAP__'
);
const ngRxUuidTitleSelectorMapSymbol = Symbol(
  '__NGRX_UUID_TITLE_SELECTOR_MAP__'
);

declare global {
  interface Window {
    [ngRxTitleSelectorUuidMapSymbol]: Map<
      MemoizedSelector<object, string>,
      string
    >;
    [ngRxUuidTitleSelectorMapSymbol]: Map<
      string,
      MemoizedSelector<object, string>
    >;
  }
}

export const provideNgRxTitleStrategy = () => ({
  provide: TitleStrategy,
  useClass: NgRxTitleStrategy,
});

export const ngRxTitle = (
  strings: TemplateStringsArray,
  ...selectors: Array<MemoizedSelector<object, string>>
): string => {
  if (!window[ngRxTitleSelectorUuidMapSymbol]) {
    window[ngRxTitleSelectorUuidMapSymbol] = new Map();
  }
  if (!window[ngRxUuidTitleSelectorMapSymbol]) {
    window[ngRxUuidTitleSelectorMapSymbol] = new Map();
  }
  const selectorKeys = selectors.map((selector) => {
    const savedUuid = window[ngRxTitleSelectorUuidMapSymbol].get(selector);
    const uuid = savedUuid ?? self.crypto.randomUUID();
    window[ngRxUuidTitleSelectorMapSymbol].set(uuid, selector);
    return `NgRxTitleSelector\$\{${uuid}\}`;
  });
  return strings.reduce(
    (agg, s, i) => `${agg}${s}${selectorKeys[i] ?? ''}`,
    ''
  );
};

@Injectable({ providedIn: 'root' })
export class NgRxTitleStrategy extends TitleStrategy {
  constructor(private readonly store: Store, private readonly title: Title) {
    super();
  }

  private titleSubscription: Subscription | undefined;

  updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    this.titleSubscription?.unsubscribe();
    if (title) {
      const segments = title
        ?.split(/(NgRxTitleSelector\${.*?})/)
        .map((s) =>
          s.includes('NgRxTitleSelector${')
            ? window[ngRxUuidTitleSelectorMapSymbol].get(
                s.replace('NgRxTitleSelector${', '').replace('}', '')
              )
            : s
        );
      this.titleSubscription = combineLatest(
        segments.map((s) =>
          typeof s === 'string' ? of(s) : this.store.select(s ?? (() => ''))
        )
      )
        .pipe(
          map((selectedSegments) => selectedSegments.join('')),
          tap((newTitle) => this.title.setTitle(newTitle))
        )
        .subscribe();
    }
  }
}
