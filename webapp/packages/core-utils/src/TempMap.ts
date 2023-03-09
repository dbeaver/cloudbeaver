/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action } from 'mobx';

const combine = <T>(a: IterableIterator<T>, b: IterableIterator<T>): IterableIterator<T> => (
  function* () { yield* a; yield* b; }
)();

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

  constructor(
    private readonly target: Map<TKey, TValue>
  ) {
    this.temp = new Map();
    this.flushTask = null;
    this.deleted = [];
  }

  isDeleted(key: TKey): boolean {
    return this.deleted.includes(key);
  }

  clear(): void {
    this.deleted.splice(0, this.deleted.length);
    this.temp.clear();
    this.target.clear();
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
    this.scheduleFlush();
    return this;
  }

  entries(): IterableIterator<[TKey, TValue]> {
    return Array.from(this.keys())
      .map<[TKey, TValue]>(key => [key, this.get(key)!])
      .values();
  }

  keys(): IterableIterator<TKey> {
    return Array.from(new Set(combine(this.target.keys(), this.temp.keys())))
      .filter(key => !this.isDeleted(key))
      .values();
  }

  values(): IterableIterator<TValue> {
    return Array.from(this.keys())
      .map<TValue>(key => this.get(key)!)
      .values();
  }

  private scheduleFlush(): void {
    if (this.flushTask !== null) {
      return;
    }

    this.flushTask = setTimeout(action(() => {
      for (const deleted of this.deleted) {
        this.target.delete(deleted);
      }
      this.deleted.splice(0, this.deleted.length);

      for (const [key, value] of this.temp) {
        this.target.set(key, value);
      }
      this.temp.clear();

      this.flushTask = null;
    }), 0);
  }
}