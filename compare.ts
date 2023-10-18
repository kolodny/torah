import { dtw } from './src/dtw';

const template = [0, 10, 20, 30, 40];
const heard = [0, 0, 10, 30, 40, 40];
const distFunc = function (a, b) {
  return Math.abs(a - b);
};

const dtw2 = dtw(template, heard, distFunc);
console.log(dtw2.distance);
console.log(dtw2.path);
console.log(dtw2.matrix);

const path = dtw2.path;
let lastPoint = path[0];
for (const p of path.slice(1)) {
  if (p[0] === lastPoint[0] + 1) {
    if (p[1] === lastPoint[1] + 1) {
      console.log('match');
    } else {
      console.log('missed', template[p[0]]);
    }
  } else {
    console.log('extra', heard[p[0]]);
  }
  lastPoint = p;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function calculateAccuracy(reference, processedAudio, threshold = 0.3) {
  const audioPhones = processedAudio.map((soundList) =>
    soundList
      .filter((phone) => phone.prob >= threshold)
      .map((phone) => phone.phone)
  );
  const refPhonesArray = reference.split(' ').map((word) => word.split('.'));

  // Check for omitted words
  const omittedWords = refPhonesArray.filter(
    (wordArr) =>
      !wordArr.every((item) =>
        audioPhones.some((array) => array.includes(item))
      )
  );

  const ipaStringAudio: any[] = [];

  //Check for accuracy
  refPhonesArray.forEach((word, wordIndex) => {
    const temp: any[] = [];
    word.forEach((symbol) => {
      if (audioPhones[wordIndex] && audioPhones[wordIndex].includes(symbol)) {
        temp.push(symbol);
      }
    });
    ipaStringAudio.push(temp.join('.'));
  });

  const audioString = ipaStringAudio.join(' ');

  let matchingSymbols = 0;
  for (let i = 0; i < reference.length; i++) {
    if (reference[i] === audioString[i]) {
      matchingSymbols++;
    }
  }

  // Calculate and return the accuracy percentage
  const accuracy = (matchingSymbols / reference.length) * 100;

  return {
    accuracy,
    omittedWords: omittedWords.map((wordArray) => wordArray.join('.')),
  };
}

const reference =
  'bə̆.ɹe.ʔʃ.ɪs bɑ.ɹɑ ʔə̆.lo.him eɪs ha.ʃːɑ.ma.jim və̆.eɪs hɑː.ɑ.ɹɛts';
const processedAudio = [
  // insert processedAudio data here
];
console.log(calculateAccuracy(reference, processedAudio));
