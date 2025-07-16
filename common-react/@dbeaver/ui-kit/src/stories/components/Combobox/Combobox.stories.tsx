import { Combobox, ComboboxEmpty, ComboboxItem } from '../../../Combobox/Combobox.js';

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
    <Combobox className="tw:w-[300px]" placeholder="Search an animal">
      <ComboboxEmpty>No results found</ComboboxEmpty>
      {animals.map(animal => (
        <ComboboxItem key={animal} value={animal}>
          {animal}
        </ComboboxItem>
      ))}
    </Combobox>
  );
};
