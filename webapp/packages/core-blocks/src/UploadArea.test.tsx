/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { renderInApp } from '@cloudbeaver/tests-runner';
import { UploadArea } from './UploadArea.js';

function createTestFileList(name = 'test.txt', content = 'content', type = 'text/plain') {
  const file = new File([content], name, { type });
  const fileList = {
    0: file,
    length: 1,
    item: (index: number) => (index === 0 ? file : null),
    *[Symbol.iterator]() {
      yield file;
    },
  } as unknown as FileList;
  return { file, fileList };
}

describe('UploadArea', () => {
  it('should render children correctly', async () => {
    const { getByText } = renderInApp(<UploadArea>Upload File</UploadArea>);
    const label = await vi.waitFor(() => getByText('Upload File'));

    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe('LABEL');
  });

  it('should render input file', () => {
    const { container } = renderInApp(<UploadArea>Upload File</UploadArea>);
    const input = container.querySelector('input[type="file"]');

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'file');
  });

  it('should apply custom className correctly', async () => {
    const { getByText } = renderInApp(<UploadArea className="custom-class">Upload File</UploadArea>);
    const label = await vi.waitFor(() => getByText('Upload File'));

    expect(label).toHaveClass('custom-class');
  });

  it('should handle onChange event', async () => {
    const handleChange = vi.fn();
    const { container, user } = renderInApp(<UploadArea onChange={handleChange}>Upload File</UploadArea>);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const { file } = createTestFileList();
    await user.upload(input, file);

    expect(handleChange).toHaveBeenCalled();
  });

  it('should reset input value when reset is true', async () => {
    const handleChange = vi.fn();
    const { container, user } = renderInApp(
      <UploadArea reset onChange={handleChange}>
        Upload File
      </UploadArea>,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const { file } = createTestFileList();
    await user.upload(input, file);

    expect(handleChange).toHaveBeenCalled();
    expect(input.value).toBe('');
  });

  it('should apply disabled state correctly', () => {
    const { container } = renderInApp(<UploadArea disabled>Upload File</UploadArea>);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    expect(input).toBeDisabled();
  });

  it('should forward ref correctly', () => {
    const ref = createRef<HTMLInputElement>();
    renderInApp(<UploadArea ref={ref}>Upload File</UploadArea>);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.type).toBe('file');
  });

  it('should apply custom id when provided', () => {
    const customId = 'custom-upload-id';
    const { container } = renderInApp(<UploadArea id={customId}>Upload File</UploadArea>);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const label = container.querySelector('label');

    expect(input).toHaveAttribute('id', customId);
    expect(label).toHaveAttribute('for', customId);
  });

  it('should accept multiple files when multiple attribute is set', () => {
    const { container } = renderInApp(<UploadArea multiple>Upload Files</UploadArea>);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    expect(input).toHaveAttribute('multiple');
  });

  it('should accept specific file types when accept attribute is set', () => {
    const { container } = renderInApp(<UploadArea accept=".jpg,.png">Upload Image</UploadArea>);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    expect(input).toHaveAttribute('accept', '.jpg,.png');
  });

  it('should apply title attribute to label', () => {
    const { container } = renderInApp(<UploadArea title="Click to upload">Upload File</UploadArea>);
    const label = container.querySelector('label');

    expect(label).toHaveAttribute('title', 'Click to upload');
  });

  it('should set files property when value is provided', () => {
    const { fileList } = createTestFileList();
    const { container } = renderInApp(<UploadArea value={fileList}>Upload File</UploadArea>);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.files).toBe(fileList);
  });

  it('should handle async onChange event', async () => {
    const handleChange = vi.fn(async () => {
      await Promise.resolve();
    });

    const { container, user } = renderInApp(<UploadArea onChange={handleChange}>Upload File</UploadArea>);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const { file } = createTestFileList();
    await user.upload(input, file);

    expect(handleChange).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
