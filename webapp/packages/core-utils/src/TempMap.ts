/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { cacheValue, ICachedValueObject } from './cacheValue';

const combine = <T>(a: IterableIterator<T>, b: IterableIterator<T>): IterableIterator<T> =>
  (function* () {
    yield* a;
    yield* b;
  })();

export class TempMap<TKey, TValue> implements Map<TKey, TValue> {
  get size(): number {
    return Array.from(this.keys()).length;
  }

  [Symbol.iterator](): IterableIterator<[TKey, TValue]> {
    return this.entries();
  }

  get [Symbol.toStringTag](): string {
    return 'TempMap';
  }

  private readonly deleted: TKey[];
  private readonly temp: Map<TKey, TValue>;
  private flushTask: NodeJS.Timeout | null;
  private readonly keysTemp: ICachedValueObject<TKey[]>;
  private readonly valuesTemp: ICachedValueObject<TValue[]>;
  private readonly entriesTemp: ICachedValueObject<[TKey, TValue][]>;

  constructor(private readonly target: Map<TKey, TValue>, private readonly onSync?: () => void) {
    this.temp = new Map();
    this.flushTask = null;
    this.deleted = [];
    this.keysTemp = cacheValue();
    this.entriesTemp = cacheValue();
    this.valuesTemp = cacheValue();

    makeObservable<this, 'deleted' | 'scheduleFlush'>(this, {
      deleted: observable.shallow,
      scheduleFlush: action,
    });
  }

  isDeleted(key: TKey): boolean {
    return this.deleted.includes(key);
  }

  /**
   * This function will not call clear on target map
   */
  clear(): void {
    if (this.flushTask) {
      clearTimeout(this.flushTask);
      this.flushTask = null;
    }
    this.deleted.splice(0, this.deleted.length);
    this.temp.clear();
    this.keysTemp.invalidate();
    this.valuesTemp.invalidate();
    this.entriesTemp.invalidate();
  }

  delete(key: TKey): boolean {
    this.temp.delete(key);
    this.deleted.push(key);
    this.scheduleFlush();
    return this.has(key);
  }

  forEach(callbackfn: (value: TValue, key: TKey, map: Map<TKey, TValue>) => void, thisArg?: any): void {
    for (const [key, value] of this.entries()) {
      if (this.isDeleted(key)) {
        continue;
      }
      callbackfn.call(thisArg, value, key, this);
    }
  }

  get(key: TKey): TValue | undefined {
    const getTargetMobxSub = this.target.get(key);

    if (this.isDeleted(key)) {
      return undefined;
    }

    if (this.temp.has(key)) {
      return this.temp.get(key);
    }
    return getTargetMobxSub;
  }

  has(key: TKey): boolean {
    const hasTargetMobxSub = this.target.has(key);

    if (this.isDeleted(key)) {
      return false;
    }

    return this.temp.has(key) || hasTargetMobxSub;
  }

  set(key: TKey, value: TValue): this {
    this.temp.set(key, value);

    const indexOfDeleted = this.deleted.indexOf(key);
    if (indexOfDeleted !== -1) {
      this.deleted.splice(indexOfDeleted, 1);
    }

    this.scheduleFlush();
    return this;
  }

  entries(): IterableIterator<[TKey, TValue]> {
    return this.entriesTemp.value(() => Array.from(this.keys()).map<[TKey, TValue]>(key => [key, this.get(key)!])).values();
  }

  keys(): IterableIterator<TKey> {
    return this.keysTemp.value(() => Array.from(new Set(combine(this.target.keys(), this.temp.keys()))).filter(key => !this.isDeleted(key))).values();
  }

  values(): IterableIterator<TValue> {
    return this.valuesTemp.value(() => Array.from(this.keys()).map<TValue>(key => this.get(key)!)).values();
  }

  private scheduleFlush(): void {
    this.keysTemp.invalidate();
    this.valuesTemp.invalidate();
    this.entriesTemp.invalidate();

    if (this.flushTask !== null) {
      return;
    }

    this.flushTask = setTimeout(
      action(() => {
        for (const deleted of this.deleted) {
          this.target.delete(deleted);
        }
        this.deleted.splice(0, this.deleted.length);

        for (const [key, value] of this.temp) {
          this.target.set(key, value);
        }
        this.onSync?.();
        this.temp.clear();
        this.keysTemp.invalidate();
        this.valuesTemp.invalidate();
        this.entriesTemp.invalidate();

        this.flushTask = null;
      }),
      0,
    );
  }
}
