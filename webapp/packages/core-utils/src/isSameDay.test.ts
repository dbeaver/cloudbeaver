import { isSameDay } from './isSameDay';

describe('isSameDay', () => {
  it('should be same day', () => {
    isSameDay(new Date(), new Date());
    isSameDay(new Date(2020, 1, 1, 4), new Date(2020, 1, 1, 2));
    isSameDay(new Date(2020, 1, 1, 2), new Date(2020, 1, 1, 4, 1));
    isSameDay(new Date(2020, 1, 1, 2, 3), new Date(2020, 1, 1, 2, 4));
    isSameDay(new Date(2020, 1, 1, 2, 3, 4), new Date(2020, 1, 1, 2, 3, 5));
    isSameDay(new Date(2020, 1, 1, 2, 3, 4, 5), new Date(2020, 1, 1, 2, 3, 4, 6));
  });

  it('should not be same day', () => {
    isSameDay(new Date(2020, 1, 1), new Date(2020, 1, 2));
    isSameDay(new Date(2020, 1, 1), new Date(2020, 2, 1));
    isSameDay(new Date(2020, 1, 1), new Date(2021, 1, 1));
    isSameDay(new Date(), new Date(2020, 1, 1));
  });
});
