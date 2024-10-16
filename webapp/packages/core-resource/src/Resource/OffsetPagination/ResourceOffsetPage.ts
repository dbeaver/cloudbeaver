/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { type IResourceOffsetPage } from './IResourceOffsetPage.js';

export class ResourceOffsetPage implements IResourceOffsetPage {
  from: number;
  to: number;
  items: any[];
  outdated: boolean;

  constructor() {
    this.from = 0;
    this.to = 0;
    this.items = [];
    this.outdated = false;

    makeObservable(this, {
      from: true,
      to: true,
      items: observable.shallow,
      outdated: observable,
    });
  }

  get(from: number, to: number): any[] {
    return this.items.slice(from - this.from, to - this.from);
  }

  isOutdated(): boolean {
    return this.outdated;
  }

  isHasCommonSegment(segment: IResourceOffsetPage): boolean;
  isHasCommonSegment(from: number, to: number): boolean;
  isHasCommonSegment(from: number | IResourceOffsetPage, to?: number): boolean {
    if (to === undefined) {
      to = (from as IResourceOffsetPage).to;
      from = (from as IResourceOffsetPage).from;
    }
    return !(to < this.from || this.to <= (from as number));
  }

  isInRange(from: number, to: number): boolean {
    return this.from >= from && this.to <= to;
  }

  setSize(from: number, to: number): this {
    const prevForm = this.from;
    const prevTo = this.to;

    this.from = from;
    this.to = to;

    if (from >= prevForm) {
      this.items.splice(0, from - prevForm);
    } else {
      this.items.unshift(...new Array(prevForm - from));
      this.setOutdated(true);
    }

    if (to - from <= prevTo - prevForm) {
      this.items.splice(to - from);
    } else {
      this.items.push(...new Array(to - from - (prevTo - prevForm)));
      this.setOutdated(true);
    }

    return this;
  }

  update(from: number, items: any[]): this {
    this.items.splice(from - this.from, items.length, ...items);

    return this;
  }

  setOutdated(outdated: boolean): this {
    this.outdated = outdated;

    return this;
  }
}
