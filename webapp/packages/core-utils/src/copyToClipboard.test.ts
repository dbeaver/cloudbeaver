import { copyToClipboard } from './copyToClipboard';

describe('copyToClipboard', () => {
  beforeAll(() => {
    document.execCommand = jest.fn();
  });

  it('should copy data to clipboard', () => {
    copyToClipboard('test');

    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('should focus on active element after copy', () => {
    document.body.focus = jest.fn();

    copyToClipboard('test');

    expect(document.activeElement).toBe(document.body);
    expect(document.body.focus).toHaveBeenCalled();
  });

  it('should have no children after copy', () => {
    copyToClipboard('test');

    expect(document.body.children.length).toBe(0);
  });
});
