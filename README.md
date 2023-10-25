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
