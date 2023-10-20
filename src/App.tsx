import { useState } from 'react';
import { dtw } from './dtw';
import { toPhones } from './toPhones';
import data from './text.json';
import { response } from './response';
import { needleman } from './needleman';

const text = data[130].normalize('NFC');

type Heard = Array<Array<{ phone: string; prob: number }>>;
const reference = toPhones(text);

console.log(reference);

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

// referencePhones.length = 0;
// referencePhones.push('a', 'b', 'c');

// response.length = 0;
// response.push(
//   // [{ phone: 'x', prob: 0.8 }],
//   [{ phone: 'a', prob: 0.8 }],
//   // [{ phone: '1', prob: 0.8 }],
//   // [{ phone: 'b', prob: 0.8 }],
//   [{ phone: 'c', prob: 0.8 }],
//   // [{ phone: 'd', prob: 0.8 }],
//   [{ phone: 'e', prob: 0.8 }]
//   // [{ phone: 'f', prob: 0.8 }]
// );

console.log(referencePhones.join(''));
console.log(response);

const ops = needleman(referencePhones, response, (ref, res) => {
  const found = res.find((p) => p.phone.replace('<blk>', '') === ref);
  return found?.prob ?? 0;
});
console.log(ops);

// console.log(test([10, 30, 40], [10, 30]));
// console.log(test([10, 30, 40], [10, 40]));
// console.log(test([10, 30], [10, 30, 40]));
// console.log(test([10], [10, 30, 40]));
// console.log(test([30], [10, 30, 40]));

// referencePhones.unshift('*');
// response.unshift([]);

// const diffed = dtw(referencePhones, response, (reference, potentialPhones) => {
//   const found = potentialPhones.find(
//     (p) => p.phone.replace('<blk>', '') === reference
//   );
//   return 1 - (found?.prob ?? 0);
// });
// console.log(diffed);

// // debugger;
// const path = diffed.path;
// for (let index = 0; index < path.length; index++) {
//   const point = path[index];
//   const lastPoint = index === 0 ? [-1, -1] : path[index - 1];
//   const lastScore = index === 0 ? 0 : diffed.matrix[lastPoint[0]][lastPoint[1]];
//   const score = diffed.matrix[point[0]][point[1]];
//   const scoreDiff = score - lastScore;
//   const movedX = point[0] === lastPoint[0] + 1;
//   const movedY = point[1] === lastPoint[1] + 1;
//   // console.log(lastPoint, point, movedX, movedY);
//   if (movedX && movedY) {
//     console.log(
//       'matched',
//       referencePhones[point[0]].trim() || '<blk>',
//       response[point[1]].map((p) => p.phone).join(', '),
//       scoreDiff,
//       { lastPoint, point }
//     );
//   } else if (movedX) {
//     console.log(
//       'missed',
//       referencePhones[point[0]].trim() || '<blk>',
//       scoreDiff,
//       { lastPoint, point, score, lastScore }
//     );
//   } else if (movedY) {
//     // console.log('extra', response[lastPoint[0]] || '<blk>', scoreDiff);
//     console.log('extra', response[point[0]] || '<blk>', scoreDiff, {
//       lastPoint,
//       point,
//       score,
//       lastScore,
//     });
//   }
// }

// let lastPoint = path[0];
// for (const p of path.slice(1)) {
//   if (p[0] === p[1])
//   if (p[0] === lastPoint[0] + 1) {
//     if (p[1] === lastPoint[1] + 1) {
//       console.log('match', lastPoint[1], referencePhones[lastPoint[1]]);
//     } else {
//       console.log('missed', referencePhones[p[1]]);
//     }
//   } else {
//     console.log('extra', response[p[0]]);
//   }
//   lastPoint = p;
// }

export const App: React.FunctionComponent = () => {
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);

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
    </>
  );
};

export default App;
