import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { MemoizedSelector, Store } from '@ngrx/store';
import { combineLatest, map, of, Subscription, tap } from 'rxjs';

const __ngRxTitleMaps = {
  titleToSelectorUuid: new Map<MemoizedSelector<object, string>, string>(),
  uuidToTitleSelector: new Map<string, MemoizedSelector<object, string>>(),
};

export const provideNgRxTitleStrategy = () => ({
  provide: TitleStrategy,
  useClass: NgRxTitleStrategy,
});

export const ngRxTitle = (
  strings: TemplateStringsArray,
  ...selectors: Array<MemoizedSelector<object, string>>
): string => {
  const selectorKeys = selectors.map((selector) => {
    const savedUuid = __ngRxTitleMaps.titleToSelectorUuid.get(selector);
    const uuid = savedUuid ?? self.crypto.randomUUID();
    __ngRxTitleMaps.uuidToTitleSelector.set(uuid, selector);
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
            ? __ngRxTitleMaps.uuidToTitleSelector.get(
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
