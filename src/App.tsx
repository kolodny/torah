import { useState } from 'react';
import { dtw } from './dtw';
import { toPhones } from './toPhones';
import data from './text.json';

const text = data[130].normalize('NFC');

const reference = toPhones(text);

console.log(reference);

type Heard = Array<Array<{ phone: string; prob: number }>>;

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
