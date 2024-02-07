import { render, screen, waitFor } from '@testing-library/react';
import React, { Suspense } from 'react';

import ErrorBoundary from './__custom__mocks__/ErrorBoundaryMock';
import { importLazyComponent } from './importLazyComponent';

describe('importLazyComponent', () => {
  const fallback = 'Loading...';

  it('should render the lazy component', async () => {
    const loadedText = 'Lazy Component';
    const mockComponent: React.FC<any> = () => <div>{loadedText}</div>;
    const componentImporter = jest.fn(() => Promise.resolve(mockComponent));
    const LazyComponent = importLazyComponent(componentImporter);
    render(
      <Suspense fallback={fallback}>
        <LazyComponent />
      </Suspense>,
    );

    expect(screen.getByText(fallback)).toBeTruthy();
    await waitFor(() => expect(screen.getByText(loadedText)).toBeTruthy());
    expect(componentImporter).toHaveBeenCalled();
  });

  it('should render the error boundary if rejects with an error', async () => {
    const errorText = 'Error';
    const componentImporter = jest.fn(() => Promise.reject(new Error(errorText)));
    const LazyComponent = importLazyComponent(componentImporter as any);

    render(
      <ErrorBoundary>
        <Suspense fallback={fallback}>
          <LazyComponent />
        </Suspense>
      </ErrorBoundary>,
    );

    expect(screen.getByText(fallback)).toBeTruthy();
    await waitFor(() => expect(screen.getByText(errorText)).toBeTruthy());
    expect(componentImporter).toHaveBeenCalled();
  });
});
