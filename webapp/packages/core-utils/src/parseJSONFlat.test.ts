import { parseJSONFlat } from './parseJSONFlat';

describe('parseJSONFlat', () => {
  it('should parse empty object', () => {
    const object = {};
    const setValue = jest.fn();

    parseJSONFlat(object, setValue);

    expect(setValue).not.toHaveBeenCalled();
  });

  it('should parse one level JSON', () => {
    const object = {
      test: 'test',
    };
    const setValue = jest.fn();

    parseJSONFlat(object, setValue);

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith('test', 'test');
  });

  it('should parse multi level JSON', () => {
    const object = {
      test: 'test',
      test2: {
        test3: 'test3',
      },
    };
    const setValue = jest.fn();

    parseJSONFlat(object, setValue);

    expect(setValue).toHaveBeenCalledTimes(2);
    expect(setValue).toHaveBeenCalledWith('test', 'test');
    expect(setValue).toHaveBeenCalledWith('test2.test3', 'test3');
  });

  it('should set object value in scope', () => {
    const object = {
      test: 'test',
    };
    const setValue = jest.fn();

    parseJSONFlat(object, setValue, 'scope');

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith('scope.test', 'test');
  });

  it('should set array value in scope', () => {
    const object = ['test'];
    const setValue = jest.fn();

    parseJSONFlat(object, setValue, 'scope');

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith('scope', object);
  });
});
