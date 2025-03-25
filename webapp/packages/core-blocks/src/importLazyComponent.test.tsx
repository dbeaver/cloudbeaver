/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it, vitest } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';

import { addKnownError } from '@cloudbeaver/tests-runner';

import ErrorBoundary from './__custom__mocks__/ErrorBoundaryMock.js';
import { importLazyComponent } from './importLazyComponent.js';

addKnownError(/The above error occurred in one of your React components.*/);

describe('importLazyComponent', () => {
  const TestComponent = () => <div>Test Component</div>;

  it('should render loading component while lazy component is loading', () => {
    const LazyComponent = importLazyComponent(() => new Promise<typeof TestComponent>(() => {}));

    render(
      <Suspense fallback={<div>Fallback</div>}>
        <LazyComponent />
      </Suspense>,
    );

    expect(screen.getByText('Fallback')).toBeInTheDocument();
  });

  it('should render component after loading', async () => {
    const LazyComponent = importLazyComponent(() => Promise.resolve(TestComponent));

    render(
      <Suspense fallback={<div>Fallback</div>}>
        <LazyComponent />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });

  it('should render error component when loading fails', async () => {
    // so we don't see the error in the console
    const consoleSpy = vitest.spyOn(console, 'error').mockImplementation(() => {});
    const LazyComponent = importLazyComponent(() => Promise.reject(new Error('Failed to load'))) as React.ComponentType<any>;

    render(
      <ErrorBoundary>
        <Suspense fallback={<div>Fallback</div>}>
          <LazyComponent />
        </Suspense>
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
    consoleSpy.mockRestore();
  });

  it('should pass props to loaded component', async () => {
    const PropsTestComponent = ({ text }: { text: string }) => <div>{text}</div>;
    const LazyComponent = importLazyComponent(() => Promise.resolve(PropsTestComponent));

    render(
      <Suspense fallback={<div>Fallback</div>}>
        <LazyComponent text="Passed Props" />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByText('Passed Props')).toBeInTheDocument();
    });
  });
});
