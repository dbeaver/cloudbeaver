import { ComboboxProvider, ComboboxInput, ComboboxEmpty, ComboboxItem } from '../../../Combobox/Combobox.js';
import { Icon } from '../../../Icon/Icon.js';

const animals = [
  'Dog',
  'Cat',
  'Elephant',
  'Lion',
  'Tiger',
  'Bear',
  'Giraffe',
  'Zebra',
  'Monkey',
  'Kangaroo',
  'Panda',
  'Koala',
  'Rabbit',
  'Fox',
  'Wolf',
  'Deer',
  'Squirrel',
  'Hedgehog',
  'Otter',
  'Raccoon',
  'Skunk',
  'Badger',
  '(d)Beaver',
  'Porcupine',
  'Opossum',
  'Armadillo',
  'Sloth',
  'Anteater',
  'Capybara',
  'Hippopotamus',
  'Crocodile',
  'Alligator',
  'Turtle',
  'Frog',
];

export const Example = () => {
  return (
    <ComboboxProvider defaultValue="Frog">
      <ComboboxInput className="tw:w-[300px]" placeholder="Search an animal">
        <ComboboxEmpty>No results found</ComboboxEmpty>
        {animals.map(animal => (
          <ComboboxItem className="tw:flex tw:items-center tw:gap-2" key={animal} value={animal}>
            <Icon name="case" className="tw-mr-2" />
            {animal}
          </ComboboxItem>
        ))}
      </ComboboxInput>
    </ComboboxProvider>
  );
};
