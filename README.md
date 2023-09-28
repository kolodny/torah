Run the following:

```bash
pip install -r requirements.txt
python -m allosaurus.bin.download_model
python -m allosaurus.bin.update_phone --lang heb --input heb_phones.txt
```

To run on a file

```bash
python -m allosaurus.run -e 1.2 --lang heb -k 3 -i <input> -o <output>
```

For reference the best IPA I got for the first verse is:

```
bə̆.ɹe.ʔʃ.ɪs bɑ.ɹɑ ʔə̆.lo.him eɪs ha.ʃːɑ.ma.jim və̆.eɪs hɑː.ɑ.ɹɛts
```
