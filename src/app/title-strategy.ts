import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { createSelector, MemoizedSelector, Store } from '@ngrx/store';
import { combineLatest, map, Observable, Subscription } from 'rxjs';

type TitleSegmentSelector =
  | MemoizedSelector<object, string>
  | MemoizedSelector<object, number>;

class TitleSelectorUtility {
  private static _ngRxTitleMaps = {
    uuidsBySelectorRef: new WeakMap<TitleSegmentSelector, string>(),
    selectorRefsByUuid: new Map<string, TitleSegmentSelector>(),
  };

  public static getUuid(selector: TitleSegmentSelector): string {
    const cachedUuid =
      TitleSelectorUtility._ngRxTitleMaps.uuidsBySelectorRef.get(selector);
    const uuid = cachedUuid ?? self.crypto.randomUUID();
    TitleSelectorUtility._ngRxTitleMaps.selectorRefsByUuid.set(uuid, selector);
    return uuid;
  }

  public static getSelector(uuid: string): TitleSegmentSelector {
    return (
      TitleSelectorUtility._ngRxTitleMaps.selectorRefsByUuid.get(uuid) ??
      createSelector(
        (state) => state,
        () => ''
      )
    );
  }
}

const selectorTemplatePrefix = 'NgRxTitleSelector${';
const selectorTemplatePrefixRegExp = selectorTemplatePrefix.replace('$', '\\$');
const selectorTemplateSuffix = '}';
const selectorTemplateRegExp = new RegExp(
  `(${selectorTemplatePrefixRegExp}.*?${selectorTemplateSuffix})`
);

export const ngrxTitle = (
  strings: TemplateStringsArray,
  ...segment: Array<TitleSegmentSelector | string | number>
): string => {
  const templatedSegments = segment.map((selectorOrPlain) => {
    let templatedSegment: string;
    if (
      typeof selectorOrPlain !== 'string' &&
      typeof selectorOrPlain !== 'number'
    ) {
      const uuid = TitleSelectorUtility.getUuid(selectorOrPlain);
      templatedSegment = `${selectorTemplatePrefix}${uuid}${selectorTemplateSuffix}`;
    } else {
      templatedSegment = String(selectorOrPlain);
    }
    return templatedSegment;
  });
  return strings.reduce(
    (agg, s, i) => `${agg}${s}${templatedSegments[i] ?? ''}`,
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
    this.titleSubscription?.unsubscribe();

    const titleTemplate = this.buildTitle(snapshot);
    const title$ = this.selectTitleFromTemplate(titleTemplate);
    this.titleSubscription = title$.subscribe((t) => this.title.setTitle(t));
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
      .split(selectorTemplateRegExp)
      .map((s) => this.getTitleSegment(s));
  }

  private getTitleSegment(segmentTemplate: string): TitleSegmentSelector {
    let segmentSelector: TitleSegmentSelector;
    if (segmentTemplate.includes(selectorTemplatePrefix)) {
      const selectorUuid = segmentTemplate
        .replace(selectorTemplatePrefix, '')
        .replace(selectorTemplateSuffix, '');
      segmentSelector = TitleSelectorUtility.getSelector(selectorUuid);
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
