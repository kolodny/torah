import express from 'express';
import cors from 'cors';
import multer from 'multer';
import os from 'os';
import { exec } from 'child_process';

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
    `python -m allosaurus.run -e 1.2 --lang heb -k 3 -i ${wav}`
  );

  const parts = stdout.split(' | ');
  const matches = parts.map((part) => {
    const matched = part.matchAll(/(?<phone>.|<blk>) \((?<prob>[^)]*)\)/g);
    return Array.from(matched)
      .map((m) => m.groups!)
      .filter(Boolean)
      .map(({ phone, prob }) => ({ phone, prob: +prob }));
  });

  res.json(matches);
});

app.listen(4000, () => {
  console.log('Server is listening on port 4000');
});
