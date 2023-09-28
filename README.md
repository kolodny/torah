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
bə̆.ɹeɪ.ʃɪs bɑ.ɹɑ ʔə̆.lo.him eɪs ha.ʃːɑ.ma.jim və̆.eɪs hɑː.ɑ.ɹɛts
```

We want output like:

```json
{
  "reference": "bə̆.ɹeɪ.ʃɪs bɑ.ɹɑ ʔə̆.lo.him eɪs ha.ʃːɑ.ma.jim və̆.eɪs hɑː.ɑ.ɹɛts",
  "words": [
    {
      "word": "bə̆.ɹeɪ.ʃɪs",
      "score": 0.45,
      "syllables": [
        { "syllable": "bə̆", "heard": "bɛ", "score": 0.15 }, // avg(0.31, 0)
        { "syllable": "ɹe", "heard": "ɹe", "score": 0.49 }, // avg(0.95, 0.03)
        { "syllable": "ʃɪs", "heard": "ʃɪs", "score": 0.72 } // avg (0.86, 0.45, 0.86)
      ]
    },
    {
      "word": "bɑ.ɹɑ",
      "score": 0.24,
      "syllables": [
        { "syllable": "bɑ", "heard": "bɑ", "score": 0.07 }, // avg(0.13, 0.018)
        { "syllable": "ɹɑ", "heard": "ɹo", "score": 0.41 } // avg(0.82, 0)
      ]
    },
    {
      "word": "eɪs",
      "score": 0.9,
      "syllables": [{ "syllable": "eɪs", "heard": "ɛɪs", "score": 9 }]
    },
    {
      "word": "ha.ʃːɑ.ma.jim",
      "score": 0,
      "skipped": true
    },
    {
      "word": "və̆.eɪs",
      "score": 0.54,
      "syllables": [
        { "syllable": "eɪs", "heard": "ɛs", "score": 0.54 } // avg(0, 0.93, 0.70)
      ]
    }
  ]
}
```
