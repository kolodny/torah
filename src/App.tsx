import { useState } from 'react';
import { dtw } from './dtw';
import { toPhones } from './toPhones';
import data from './text.json';
import { response } from './response';
import { Needleman, needleman } from './needleman';

const text = data[130].normalize('NFC');

type Phone = { phone: string; prob: number };
type Heard = Phone[][];
type Results = Needleman<string, Phone[]>[];

const reference = toPhones(text);

console.log(reference);

const verseWords = reference.verses
  .map((v) =>
    v.words
      .map((w) => w.graphemes.map((g) => g.letter!).filter(Boolean))
      .filter(Boolean)
  )
  .filter(Boolean);

console.log(verseWords);

const referencePhones = reference.verses
  .map((v) =>
    v.words
      .map((w) =>
        w.graphemes
          .map((g) => g.sound!)
          .filter(Boolean)
          .join('')
      )
      .filter(Boolean)
      .join(' ')
  )
  .filter(Boolean)
  .join(' ')
  .split('');

console.log(referencePhones.join(''));
console.log(response);

const compareFunction = (ref: string, res: Phone[]) => {
  const found = res.find((p) => p.phone.replace('<blk>', '') === ref);
  return found?.prob ?? 0;
};

const ops = needleman(referencePhones, response, compareFunction);
console.log(ops);

export const App: React.FunctionComponent = () => {
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);

  // const [results, setResults] = useState<Results>();
  const [match, setMatch] = useState(3);
  const [sub, setSub] = useState(-1);
  const [gap, setGap] = useState(-1);

  const results = needleman(referencePhones, response, compareFunction, {
    match,
    sub,
    gap,
  });

  let resultsContent: React.ReactNode = null;

  console.log({ verseWords });
  console.log(
    'a',
    verseWords
      .flatMap((verse) => verse.map((words) => words.join(' ')).join(':'))
      .join('! ')
  );
  if (results) {
    resultsContent = (
      <>
        <label>
          Match
          <input
            type="number"
            value={match}
            onChange={(e) => setMatch(+e.target.value)}
          />
        </label>
        <label>
          Sub
          <input
            type="number"
            value={sub}
            onChange={(e) => setSub(+e.target.value)}
          />
        </label>
        <label>
          Gap
          <input
            type="number"
            value={gap}
            onChange={(e) => setGap(+e.target.value)}
          />
        </label>
        <div>
          {verseWords
            .flatMap((verse) => verse.map((words) => words.join('')).join(' '))
            .join(': ')}
        </div>
        <pre>{referencePhones.join(' ')}</pre>
        <pre>
          {results.map((result) => {
            if (result.type === 'match') {
              const matching = result.got.find(
                (g) => result.expect === g.phone
              );
              if (!matching) {
                return (
                  <span
                    style={{ display: 'inline-flex', flexDirection: 'column' }}
                  >
                    <div style={{ color: 'pink' }}>{result.expect}</div>
                    <div style={{ color: 'red' }}>{result.got[0].phone} </div>
                  </span>
                );
              }
              return <span style={{ color: 'green' }}>{result.expect} </span>;
            }
            if (result.type === 'miss') {
              return <span style={{ color: 'pink' }}>{result.expect} </span>;
            }
            if (result.type === 'extra') {
              return (
                <span style={{ color: 'red' }}>{result.got[0].phone} </span>
              );
            }
          })}
        </pre>
      </>
    );
  }

  return (
    <>
      <button
        onClick={async () => {
          setRecording(!recording);
          if (!recording) {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            const chunks: Blob[] = [];
            const makeLink = () => {
              const blob = new Blob(chunks, { type: 'audio/ogg' }),
                url = URL.createObjectURL(blob),
                mt = document.createElement('audio'),
                hf = document.createElement('a');

              mt.src = url;
              mt.controls = true;

              hf.href = url;
              hf.download = `file`;
              hf.innerHTML = `donwload ${hf.download}`;
              document.body.appendChild(hf);
              document.body.appendChild(mt);
            };
            const recorder = new MediaRecorder(stream);
            setRecorder(recorder);
            recorder.ondataavailable = async (e) => {
              chunks.push(e.data);
              if (recorder.state == 'inactive') {
                makeLink();
                stream.getTracks().forEach(function (track) {
                  track.stop();
                });
                const file = new File(chunks, 'filename.ogg');
                const form = new FormData();
                form.append('file', file);
                const fetched = await fetch('http://localhost:4000/upload', {
                  method: 'POST',
                  body: form,
                });
                const heard: Heard = await fetched.json();
                const referencePhones = reference.verses
                  .flatMap((v) =>
                    v.words.flatMap((w) => w.graphemes.flatMap((g) => g.sound!))
                  )
                  .filter(Boolean);
                const warped = dtw(
                  referencePhones,
                  heard,
                  (referencePhone, potentialPhones) => {
                    return potentialPhones[0].phone === referencePhone ? 1 : 2;
                  }
                );
                console.log(warped);
                // setResults(ops);
              }
            };
            recorder.start();
          } else {
            recorder?.stop();
          }
        }}
      >
        {recording ? 'Stop recording' : 'Record'} audio
      </button>
      {resultsContent}
    </>
  );
};

export default App;
