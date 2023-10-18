import { useState } from 'react';

// navigator.mediaDevices
//   .getUserMedia(
//     // constraints - only audio needed for this app
//     {
//       audio: true,
//     }
//   )

//   // Success callback
//   .then((stream) => {
//     console.log('YO', stream);
//     const mediaRecorder = new MediaRecorder(stream);
//     mediaRecorder.start();
//     console.log(mediaRecorder.state);
//     setTimeout(() => {
//       mediaRecorder.stop();
//     }, 3000);
//   })

//   // Error callback
//   .catch((err) => {
//     console.error(`The following getUserMedia error occurred: ${err}`);
//   });

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
            (window as any).recorder = recorder;
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
                const json = await fetched.json();
                console.log(json);
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
