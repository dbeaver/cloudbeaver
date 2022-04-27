/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const top = 0;
function parent(i: number): number {
  return ((i + 1) >>> 1) - 1;
}
function left(i: number): number {
  return  (i << 1) + 1;
}
function right(i: number): number {
  return  (i + 1) << 1;
}

type Comparator<T> = (a: T, b: T) => boolean;

export class PriorityQueue<T = number> {
  private _heap: T[];
  private readonly _comparator: Comparator<T>;

  constructor(comparator: Comparator<T> = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparator;
  }

  size(): number {
    return this._heap.length;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  peek(): T {
    return this._heap[top];
  }

  push(...values: T[]) {
    values.forEach(value => {
      this._heap.push(value);
      this.siftUp();
    });
    return this.size();
  }

  pop(): T {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;

    if (bottom > top) {
      this.swap(top, bottom);
    }

    this._heap.pop();
    this.siftDown();
    return poppedValue;
  }

  replace(value: T): T {
    const replacedValue = this.peek();
    this._heap[top] = value;
    this.siftDown();
    return replacedValue;
  }

  private greater(i: number, j: number) {
    return this._comparator(this._heap[i], this._heap[j]);
  }

  private swap(i: number, j: number) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }

  private siftUp() {
    let node = this.size() - 1;
    while (node > top && this.greater(node, parent(node))) {
      this.swap(node, parent(node));
      node = parent(node);
    }
  }

  private siftDown() {
    let node = top;
    while (
      (left(node) < this.size() && this.greater(left(node), node))
      || (right(node) < this.size() && this.greater(right(node), node))
    ) {
      const maxChild = (right(node) < this.size() && this.greater(right(node), left(node))) ? right(node) : left(node);
      this.swap(node, maxChild);
      node = maxChild;
    }
  }
}