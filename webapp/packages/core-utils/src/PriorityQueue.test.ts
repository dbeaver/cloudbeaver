/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { PriorityQueue } from './PriorityQueue.js';

describe('PriorityQueue', () => {
  let queue: PriorityQueue;

  beforeEach(() => {
    queue = new PriorityQueue();
  });

  it('should be empty when created', () => {
    expect(queue.isEmpty()).toBe(true);
  });

  it('should have a size of 0 when created', () => {
    expect(queue.size()).toBe(0);
  });

  it('should be able to add elements', () => {
    queue.push(10);

    expect(queue.size()).toBe(1);
    expect(queue.isEmpty()).toBe(false);
  });

  it('should be able to add multiple elements at once', () => {
    queue.push(10, 20, 30);

    expect(queue.size()).toBe(3);
    expect(queue.isEmpty()).toBe(false);
  });

  it('should be able to remove elements from the queue', () => {
    queue.push(10, 20, 30);
    const element = queue.pop();

    expect(element).toBe(30);
    expect(queue.size()).toBe(2);
  });

  it('should be able to peek at the top element of the queue', () => {
    queue.push(10, 20, 30);
    const element = queue.peek();

    expect(element).toBe(30);
    expect(queue.size()).toBe(3);
  });

  it('should be able to replace the top element of the queue', () => {
    queue.push(10, 20, 30);
    const replacedElement = queue.replace(40);

    expect(replacedElement).toBe(30);
    expect(queue.peek()).toBe(40);
    expect(queue.size()).toBe(3);
  });

  it('should prioritize elements based on the comparator function', () => {
    const queue = new PriorityQueue<string>((a, b) => a.length > b.length);
    queue.push('hello', 'world', 'hi');

    expect(queue.pop()).toBe('hello');
    expect(queue.pop()).toBe('world');
    expect(queue.pop()).toBe('hi');
  });
});
