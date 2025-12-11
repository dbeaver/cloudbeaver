/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { fireEvent } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { renderInApp } from '@cloudbeaver/tests-runner';
import { StaticImage } from './StaticImage.js';
import * as sModule from './s.js';

describe('StaticImage', () => {
  beforeAll(() => {
    (globalThis as any)._ROOT_URI_ = '/absolute';
  });

  afterAll(() => {
    (globalThis as any)._ROOT_URI_ = undefined;
  });

  test('should return null when icon is not provided', () => {
    const { container } = renderInApp(<StaticImage />);
    expect(container.firstChild).toBeNull();
  });

  test('should render img element when icon is provided', () => {
    const { getByRole } = renderInApp(<StaticImage icon="/image.png" />);
    const img = getByRole('img');
    expect(img).toBeInTheDocument();
  });

  test('should use valid URL as-is', () => {
    const validUrl = 'https://example.com/image.png';
    const { getByRole } = renderInApp(<StaticImage icon={validUrl} />);
    const img = getByRole('img');
    expect(img).toHaveAttribute('src', validUrl);
  });

  test('should convert relative path to absolute URL', () => {
    const relativePath = '/icons/test.png';
    const { getByRole } = renderInApp(<StaticImage icon={relativePath} />);
    const img = getByRole('img');
    expect(img).toHaveAttribute('src', `/absolute${relativePath}`);
  });

  test('should pass title prop as alt and title attributes', () => {
    const title = 'Test Image';
    const { getByRole } = renderInApp(<StaticImage icon="/image.png" title={title} />);
    const img = getByRole('img');
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
    const { getByRole } = renderInApp(<StaticImage icon="/image.png" className={className} />);
    const img = getByRole('img');
    expect(img).toHaveClass(className);
  });

  test('should handle onClick event', () => {
    const handleClick = vi.fn();
    const { getByRole } = renderInApp(<StaticImage icon="/image.png" onClick={handleClick} />);
    const img = getByRole('img');

    fireEvent.click(img!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('should pass additional img props', () => {
    const { getByRole } = renderInApp(<StaticImage icon="/image.png" id="test-id" loading="lazy" crossOrigin="anonymous" />);
    const img = getByRole('img');
    expect(img).toHaveAttribute('id', 'test-id');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('crossOrigin', 'anonymous');
  });

  test('should apply block class when block prop is true', () => {
    const sMock = vi.spyOn(sModule, 's');
    renderInApp(<StaticImage icon="/image.png" block />);
    expect(sMock).toHaveBeenCalledWith({}, { block: true }, undefined);
  });

  test('should not apply block class when block prop is false', () => {
    const sMock = vi.spyOn(sModule, 's');
    renderInApp(<StaticImage icon="/image.png" block={false} />);
    expect(sMock).toHaveBeenCalledWith({}, { block: false }, undefined);
  });
});
