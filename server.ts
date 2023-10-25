import express from 'express';
import cors from 'cors';
import multer from 'multer';
import os from 'os';
import { exec } from 'child_process';
import { Heard } from './src/types';

const execAsync = (command: string) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve({ stdout, stderr });
    });
  });

const app = express();
const upload = multer({ dest: os.tmpdir() });

app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) return res.status(400).send('No file uploaded.');

  const wav = `${file.path}.wav`;

  await execAsync(`ffmpeg -i ${file.path} ${wav}`);

  const { stdout } = await execAsync(
    `python -m allosaurus.run -e 1.2 --lang heb -k 3 -t True -i ${wav}`
  );

  const parts = stdout.split('\n').filter(Boolean);
  const matches = parts.map((part) => {
    const [start, end, ...rest] = part.split(' ');

    const item: Heard = { start, end, sounds: [] };
    while (rest.length) {
      const phone = rest.shift()!;
      const prob = rest.shift()?.slice(1, -1);
      item.sounds.push({ phone, prob: +prob! });
    }
    return item;
    // const matched = part.matchAll(/(?<phone>.|<blk>) \((?<prob>[^)]*)\)/g);
    // return Array.from(matched)
    //   .map((m) => m.groups!)
    //   .filter(Boolean)
    //   .map(({ phone, prob }) => ({ phone, prob: +prob }));
  });

  res.json(matches);
});

app.listen(4000, () => {
  console.log('Server is listening on port 4000');
});
