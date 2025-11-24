/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { renderInApp } from '@cloudbeaver/tests-runner';

import { StaticImage } from './StaticImage.js';

vi.mock('@cloudbeaver/core-utils', () => ({
  isValidUrl: vi.fn((url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }),
  GlobalConstants: {
    absoluteUrl: vi.fn((path: string) => `/absolute${path}`),
  },
}));

vi.mock('./useS.js', async () => {
  const { useSMock } = await import('./tests/useSMock.js');
  return {
    useS: vi.fn(() =>
      useSMock({
        block: 'block',
      }),
    ),
  };
});

vi.mock('./s.js', async () => {
  const { sMock } = await import('./tests/sMock.js');
  return {
    s: vi.fn(sMock),
  };
});

describe('StaticImage', () => {
  test('should return null when icon is not provided', () => {
    const { container } = renderInApp(<StaticImage />);
    expect(container.firstChild).toBeNull();
  });

  test('should render img element when icon is provided', () => {
    const { container } = renderInApp(<StaticImage icon="/image.png" />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
  });

  test('should use valid URL as-is', () => {
    const validUrl = 'https://example.com/image.png';
    const { container } = renderInApp(<StaticImage icon={validUrl} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', validUrl);
  });

  test('should convert relative path to absolute URL', () => {
    const relativePath = '/icons/test.png';
    const { container } = renderInApp(<StaticImage icon={relativePath} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', `/absolute${relativePath}`);
  });

  test('should pass title prop as alt and title attributes', () => {
    const title = 'Test Image';
    const { container } = renderInApp(<StaticImage icon="/image.png" title={title} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', title);
    expect(img).toHaveAttribute('title', title);
  });

  test('should pass width prop', () => {
    const width = 48;
    const { container } = renderInApp(<StaticImage icon="/image.png" width={width} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('width', width.toString());
  });

  test('should pass className prop', () => {
    const className = 'custom-class';
    const { container } = renderInApp(<StaticImage icon="/image.png" className={className} />);
    const img = container.querySelector('img');
    expect(img).toHaveClass(className);
  });

  test('should handle onClick event', () => {
    const handleClick = vi.fn();
    const { container } = renderInApp(<StaticImage icon="/image.png" onClick={handleClick} />);
    const img = container.querySelector('img');

    fireEvent.click(img!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('should pass additional img props', () => {
    const { container } = renderInApp(<StaticImage icon="/image.png" id="test-id" loading="lazy" crossOrigin="anonymous" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('id', 'test-id');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('crossOrigin', 'anonymous');
  });

  test('should apply block class when block prop is true', () => {
    const { container } = renderInApp(<StaticImage icon="/image.png" block />);
    const img = container.querySelector('img');
    expect(img).toHaveClass('block');
  });

  test('should not apply block class when block prop is false', () => {
    const { container } = renderInApp(<StaticImage icon="/image.png" block={false} />);
    const img = container.querySelector('img');
    expect(img).not.toHaveClass('block');
  });
});
