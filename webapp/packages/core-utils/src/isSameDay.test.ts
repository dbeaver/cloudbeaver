import { isSameDay } from './isSameDay';

describe('isSameDay', () => {
  it('should be same day', () => {
    isSameDay(new Date(), new Date());
    isSameDay(new Date(2020, 1, 1), new Date(2020, 1, 1));
  });

  it('should not be same day', () => {
    isSameDay(new Date(2020, 1, 1), new Date(2020, 1, 2));
    isSameDay(new Date(2020, 1, 1), new Date(2020, 2, 1));
    isSameDay(new Date(2020, 1, 1), new Date(2021, 1, 1));
    isSameDay(new Date(), new Date(2020, 1, 1));
  });
});
