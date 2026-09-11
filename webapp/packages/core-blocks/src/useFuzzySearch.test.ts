/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { act, cleanup, renderHook } from '@testing-library/react';
import { isObservableProp } from 'mobx';
import { afterEach, describe, expect, test } from 'vitest';

import { useFuzzySearch } from './useFuzzySearch.js';

interface ITestItem {
  name: string;
  description: string;
  category: string;
}

describe('useFuzzySearch', () => {
  const testData: ITestItem[] = [
    { name: 'Apple', description: 'A red fruit', category: 'fruit' },
    { name: 'Apricot', description: 'A sweet fruit', category: 'fruit' },
    { name: 'Carrot', description: 'An orange vegetable', category: 'vegetable' },
  ];

  afterEach(cleanup);

  test('should initialize with empty search results', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: testData,
        fields: ['name', 'description'],
      }),
    );

    expect(result.current.searchResult).toBeNull();
    expect(result.current.isIndexing).toBe(false);
  });

  test('should return matching proposals for a search query', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: testData,
        fields: ['name'],
      }),
    );

    act(() => result.current.search('Apple'));

    expect(result.current.searchResult).toEqual([expect.objectContaining(testData[0]!)]);
  });

  test('should support searching across multiple fields', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: testData,
        fields: ['name', 'description'],
      }),
    );

    act(() => result.current.search('orange'));

    expect(result.current.searchResult).toEqual([expect.objectContaining(testData[2]!)]);
  });

  test('should match proposals by prefix', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: testData,
        fields: ['name'],
        prefix: true,
      }),
    );

    act(() => result.current.search('Ap'));

    expect(result.current.searchResult).toEqual([expect.objectContaining(testData[0]!), expect.objectContaining(testData[1]!)]);
  });

  test('should clear search results', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: testData,
        fields: ['name'],
      }),
    );

    act(() => result.current.search('Apple'));
    expect(result.current.searchResult).not.toBeNull();
    act(() => result.current.clearSearch());

    expect(result.current.searchResult).toBeNull();
  });

  test('should replace indexed proposals when the source changes', () => {
    const { result, rerender } = renderHook(
      ({ proposals }) =>
        useFuzzySearch({
          sourceProposals: proposals,
          fields: ['name'],
        }),
      {
        initialProps: {
          proposals: testData,
        },
      },
    );

    const newData: ITestItem[] = [{ name: 'Grape', description: 'A purple fruit', category: 'fruit' }];

    rerender({ proposals: newData });

    act(() => result.current.search('Carrot'));
    expect(result.current.searchResult).toEqual([]);
    act(() => result.current.search('Grape'));
    expect(result.current.searchResult).toEqual([expect.objectContaining(newData[0]!)]);
  });

  test('should handle empty source proposals', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: [],
        fields: ['name'],
      }),
    );

    act(() => result.current.search('test'));

    expect(result.current.searchResult).toEqual([]);
  });

  test('should handle search with empty query', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: testData,
        fields: ['name'],
      }),
    );

    act(() => result.current.search(''));

    expect(result.current.searchResult).toEqual([]);
  });

  test('should use useObservableRef to make state observable', () => {
    const { result } = renderHook(() =>
      useFuzzySearch({
        sourceProposals: testData,
        fields: ['name', 'description'],
      }),
    );

    expect(isObservableProp(result.current, 'searchResult')).toBe(true);
    expect(isObservableProp(result.current, 'isIndexing')).toBe(true);
    expect(result.current).toHaveProperty('removeAll');
    expect(result.current).toHaveProperty('addAll');
    expect(result.current).toHaveProperty('search');
    expect(result.current).toHaveProperty('clearSearch');
  });
});
