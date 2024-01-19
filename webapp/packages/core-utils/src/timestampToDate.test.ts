import { timestampToDate } from './timestampToDate';

describe('timestampToDate', () => {
  it('should convert timestamp to date', () => {
    const date = timestampToDate(1591862400000);
    expect(date).toBe('6/11/2020, 10:00:00 AM');
  });

  it('should convert negative timestamp to date', () => {
    const date = timestampToDate(-1591862400000);
    expect(date).toBe('7/23/1919, 5:00:00 PM');
  });

  it('should convert zero timestamp to date', () => {
    const date = timestampToDate(0);
    expect(date).toBe('1/1/1970, 1:00:00 AM');
  });
});
