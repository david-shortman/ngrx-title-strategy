import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { createSelector, MemoizedSelector, Store } from '@ngrx/store';
import { combineLatest, map, Observable, Subscription } from 'rxjs';

type TitleSegmentSelector =
  | MemoizedSelector<object, string>
  | MemoizedSelector<object, number>;

const _createSegmentTemplate = (
  selectorOrStringish: string | number | TitleSegmentSelector
): string => {
  let segmentTemplate: string;
  if (
    typeof selectorOrStringish !== 'string' &&
    typeof selectorOrStringish !== 'number'
  ) {
    const uuid = NgRxTitleStrategy.getUuid(selectorOrStringish);
    segmentTemplate = `${NgRxTitleStrategy.selectorTemplatePrefix}${uuid}${NgRxTitleStrategy.selectorTemplateSuffix}`;
  } else {
    segmentTemplate = String(selectorOrStringish);
  }
  return segmentTemplate;
};

export const ngrxTitle = (
  plainSegments: TemplateStringsArray,
  ...templatedSegments: Array<TitleSegmentSelector | string | number>
): string => {
  const segmentTemplates = templatedSegments.map(_createSegmentTemplate);
  return plainSegments.reduce(
    (template, segment, i) => template + segment + (segmentTemplates[i] ?? ''),
    ''
  );
};

@Injectable({ providedIn: 'root' })
export class NgRxTitleStrategy extends TitleStrategy {
  constructor(private readonly store: Store, private readonly title: Title) {
    super();
  }

  static selectorTemplatePrefix = 'NgRxTitleSelector${';
  static selectorTemplateSuffix = '}';

  private static selectorTemplatePrefixRegExp =
    NgRxTitleStrategy.selectorTemplatePrefix.replace('$', '\\$');
  private static selectorTemplateRegExp = new RegExp(
    `(${NgRxTitleStrategy.selectorTemplatePrefixRegExp}.*?${NgRxTitleStrategy.selectorTemplateSuffix})`
  );

  private static _selectorRefsByUuid = new Map<string, TitleSegmentSelector>();
  private static _uuidsBySelectorRef = new WeakMap<
    TitleSegmentSelector,
    string
  >();

  private titleSubscription: Subscription | undefined;

  updateTitle(snapshot: RouterStateSnapshot): void {
    this.titleSubscription?.unsubscribe();

    const titleTemplate = this.buildTitle(snapshot);
    const title$ = this.selectTitleFromTemplate(titleTemplate);
    this.titleSubscription = title$.subscribe((t) => this.title.setTitle(t));
  }

  public static getUuid(selector: TitleSegmentSelector): string {
    const cachedUuid = NgRxTitleStrategy._uuidsBySelectorRef.get(selector);
    const uuid = cachedUuid ?? self.crypto.randomUUID();
    NgRxTitleStrategy._selectorRefsByUuid.set(uuid, selector);
    NgRxTitleStrategy._uuidsBySelectorRef.set(selector, uuid);
    return uuid;
  }

  public static getSelector(uuid: string): TitleSegmentSelector {
    return (
      NgRxTitleStrategy._selectorRefsByUuid.get(uuid) ??
      createSelector(
        (state) => state,
        () => ''
      )
    );
  }

  private selectTitleFromTemplate(titleTemplate?: string): Observable<string> {
    const segmentSelectors = titleTemplate
      ? this.getTitleSegmentSelectors(titleTemplate)
      : [];
    const segments$ = this.selectSegments(segmentSelectors);
    return segments$.pipe(map((segments) => segments.join('')));
  }

  private getTitleSegmentSelectors(title: string): Array<TitleSegmentSelector> {
    return title
      .split(NgRxTitleStrategy.selectorTemplateRegExp)
      .map((s) => this.getTitleSegment(s));
  }

  private getTitleSegment(segmentTemplate: string): TitleSegmentSelector {
    let segmentSelector: TitleSegmentSelector;
    if (segmentTemplate.includes(NgRxTitleStrategy.selectorTemplatePrefix)) {
      const selectorUuid = segmentTemplate
        .replace(NgRxTitleStrategy.selectorTemplatePrefix, '')
        .replace(NgRxTitleStrategy.selectorTemplateSuffix, '');
      segmentSelector = NgRxTitleStrategy.getSelector(selectorUuid);
    } else {
      segmentSelector = createSelector(
        (state) => state,
        () => segmentTemplate
      );
    }
    return segmentSelector;
  }

  private selectSegments(
    segments: Array<TitleSegmentSelector>
  ): Observable<Array<string>> {
    const s = segments.map((segment) =>
      this.store.select(createSelector(segment, (s) => String(s)))
    );
    return combineLatest(s);
  }
}

export const provideNgRxTitleStrategy = () => ({
  provide: TitleStrategy,
  useClass: NgRxTitleStrategy,
});
