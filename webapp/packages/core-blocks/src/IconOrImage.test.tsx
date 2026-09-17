/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { IconOrImage, type IconOrImageProps } from './IconOrImage.js';
import { renderInApp } from '@cloudbeaver/tests-runner';

vi.mock('./Icon.js', () => ({
  Icon: vi.fn(({ ...props }) => (
    <svg {...props} role="svg">
      <use href={`/icons/preload/icons.svg#${props.name}`} />
    </svg>
  )),
}));

vi.mock('./StaticImage.js', () => ({
  StaticImage: vi.fn(({ ...props }) => <img {...props} />),
}));

describe('IconOrImage', () => {
  test('should render StaticImage for platform: prefixed icon', () => {
    const { getByRole } = renderInApp(<IconOrImage icon="platform:/image.png" />);
    expect(getByRole('img')).toHaveAttribute('icon', 'platform:/image.png');
  });

  test('should render StaticImage for / prefixed icon', () => {
    const { getByRole } = renderInApp(<IconOrImage icon="/image.jpg" />);
    expect(getByRole('img')).toHaveAttribute('icon', '/image.jpg');
  });

  test('should render StaticImage for valid URL', () => {
    const { getByRole } = renderInApp(<IconOrImage icon="https://example.com/image.png" />);
    expect(getByRole('img')).toHaveAttribute('icon', 'https://example.com/image.png');
  });

  test('should render Icon for regular icon name', () => {
    const { getByRole } = renderInApp(<IconOrImage icon="test" />);
    const svg = getByRole('svg');
    expect(svg).toHaveAttribute('name', 'test');
  });

  test('should render Icon when svg prop is true even for platform: icon', () => {
    const { getByRole } = renderInApp(<IconOrImage icon="platform:/image.png" svg />);
    const svg = getByRole('svg');
    expect(svg).toHaveAttribute('name', 'platform:/image.png');
  });

  test('should render Icon when svg prop is true even for URL', () => {
    const { getByRole } = renderInApp(<IconOrImage icon="https://example.com/image.png" svg />);
    const svg = getByRole('svg');
    expect(svg).toHaveAttribute('name', 'https://example.com/image.png');
  });

  test('should pass all props to StaticImage', () => {
    const handleClick = vi.fn();
    const props: IconOrImageProps = {
      icon: '/image.jpg',
      className: 'custom-class',
      title: 'Test Title',
      width: 24,
      onClick: handleClick,
    };
    const { getByRole } = renderInApp(<IconOrImage {...props} />);
    const element = getByRole('img');

    expect(element).toHaveClass(props.className!);
    expect(element).toHaveAttribute('title', props.title!);
    expect(element).toHaveAttribute('width', props.width!.toString());
    expect(element).toHaveAttribute('icon', props.icon);

    fireEvent.click(element);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('should pass all props to Icon', () => {
    const handleClick = vi.fn();
    const props: IconOrImageProps = {
      icon: 'test',
      className: 'custom-class',
      viewBox: '0 0 24 24',
      width: 24,
      onClick: handleClick,
    };
    const { getByRole } = renderInApp(<IconOrImage {...props} />);
    const element = getByRole('svg');

    expect(element).toHaveAttribute('name', props.icon);
    expect(element).toHaveClass(props.className!);
    expect(element).toHaveAttribute('viewBox', props.viewBox!);
    expect(element).toHaveAttribute('width', props.width!.toString());
    expect(element).toHaveAttribute('height', props.width!.toString());

    fireEvent.click(element);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('should use default viewBox for Icon when not provided', () => {
    const { getByRole } = renderInApp(<IconOrImage icon="svg" />);
    const element = getByRole('svg');
    expect(element).toHaveAttribute('viewBox', '0 0 32 32');
  });
});
