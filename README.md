Run the following:

```bash
pip install -r requirements.txt
python -m allosaurus.bin.download_model
python -m allosaurus.bin.update_phone --lang heb --input heb_phones.txt
```

You also need to have node installed and run the following to install the dependencies:

```bash
npm install
```

You then need to run these two commands to start the server:

```bash
npx tsx --watch server.ts
```

```bash
npx run dev
```

Now go to http://localhost:5173/ and you should see the app running.

The basic flow of the app is as follows:

- User goes to the app and chooses which text to read (right now we only have one text)
- User records themselves reading the text
- Audio is sent to the server which uses [`allosaurus`](https://github.com/xinjli/allosaurus) to extract the sounds it heard
  - For each distinct sound, allosaurus will return a list of what it thinks the sound is
- The server sends the sounds back to the browser
- The browser uses a sequence aligner algorithm to try to find the best match between the sounds and the text
  - The algorithm goes through each distinct sound heard and sees if any of the candidates match the expected sound
- The browser displays the results in a diff-like format
