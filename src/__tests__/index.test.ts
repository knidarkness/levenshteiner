import { levenshtein, levenshteinOnArray, levenshteinOnArrayAsync } from '../';

test('Distance between equal strings must be equal to 0.', () => {
  expect(levenshtein('This is a test example.', 'This is a test example.')).toBe(0);
});

test('Distance between two strings with different case must be equal to 1.', () => {
  expect(levenshtein('This is a Test eXample.', 'This is a test example.')).toBe(1);
});

test('Distance between two strings with 2 insertions required must be equal to 2.', () => {
  expect(levenshtein('Need t insertions to match', 'Need two insertions to match')).toBe(2);
});

test('Distance between two strings with 2 replacements required must be equal to 2.', () => {
  expect(levenshtein('Need tss insertions to match', 'Need two insertions to match')).toBe(2);
});

test('Distance between two strings with 2 replacements required must be equal to 2.', () => {
  expect(levenshtein('fasf', 'fair')).toBe(2);
});


test('Find closest string on the array with no overlaping items', () => {
  const testArray = [
    'value',
    'valuee',
    'evaluer'
  ];
  const givenString = 'valu';
  expect(levenshteinOnArray(givenString, testArray)).toEqual({
    value: 'value',
    distance: 1
  });
});


test('Find closest string on the array with no overlaping items for workers version of algo.', async () => {
  const testArray = [
    'valuee',
    'evaluer',
    'value'
  ];
  const givenString = 'valu';
  const a = __dirname;
  // expect(a).toBe(1);
  expect(await levenshteinOnArrayAsync(givenString, testArray)).toEqual({
    value: 'value',
    distance: 1
  });
  // process.exit(0);
});
