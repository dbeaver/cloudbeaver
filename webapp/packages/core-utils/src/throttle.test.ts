import { throttle } from './throttle';

describe('throttle', () => {
  jest.useFakeTimers();
  it('should throttle', () => {
    const callback = jest.fn();
    const throttled = throttle(callback, 100, false);

    throttled();
    throttled();
    throttled();

    jest.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should throttle with arguments', () => {
    const callback = jest.fn();
    const throttled = throttle(callback, 100, false);

    throttled(1, 2);
    throttled(3, 4);
    throttled(5, 6);

    jest.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(1, 2);
  });

  it('should throttle with arguments and return value', () => {
    const callback = jest.fn().mockReturnValue('foo');
    const throttled = throttle(callback, 100, false);

    const result = throttled(1, 2);
    throttled(3, 4);
    throttled(5, 6);

    jest.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(1, 2);
    expect(result).toBe('foo');
  });

  it('should has tail execution', () => {
    jest.useFakeTimers();
    const callback = jest.fn();
    const throttled = throttle(callback, 100, true);

    throttled(1, 2);
    throttled(3, 4);
    throttled(4, 5);

    jest.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(2);

    expect(callback.mock.calls[0][0]).toBe(1);
    expect(callback.mock.calls[0][1]).toBe(2);

    expect(callback.mock.calls[1][0]).toBe(4);
    expect(callback.mock.calls[1][1]).toBe(5);
  });

  it('should has tail execution with return value', () => {
    jest.useFakeTimers();
    const callback = jest.fn((a, b) => a + b);
    const throttled = throttle(callback, 100, true);

    const result = throttled(1, 2);
    throttled(3, 4);
    const result2 = throttled(4, 5);

    jest.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(2);

    expect(callback.mock.calls[0][0]).toBe(1);
    expect(callback.mock.calls[0][1]).toBe(2);

    expect(callback.mock.calls[1][0]).toBe(4);
    expect(callback.mock.calls[1][1]).toBe(5);

    expect(result).toBe(3);
    expect(result2).toBeUndefined();
  });
});
