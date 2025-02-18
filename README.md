## Torah Platform

This library is a platform for building Torah content. The platform includes the text and web interface for basic functionality and is meant to be used as a base for building more complex applications.

### Getting started

To get started, clone the repository and install the dependencies.

```bash
npm install
```

The DB is not included in this repository. The main data is extracted from the [otzaria-library](https://github.com/Sivan22/otzaria-library) repository. To get started, you'll need to clone the library repository and process the data. Included in the following section is how to download just the data you need from the repo since the repo is quite large.

```bash

# In the root folder of this project
git clone --filter=blob:none --no-checkout https://github.com/Sivan22/otzaria-library.git
cd otzaria-library

# Set up sparse checkout before any files are downloaded
git sparse-checkout init --cone
git sparse-checkout set links/ אוצריא/ 'books lists/ספריא/'

# Here's where the files get downloaded, this will still take some time to run
git checkout HEAD

```

Now we need to process flat files into a SQLITE DB. The following script will do that for you. Node v23 is required to run the .ts files directly. Back in the root folder of this project, run the following commands.

```bash

# Create a master db
node ./scripts/build-db.ts

# Slice the db into smaller files for client syncing
node ./scripts/slice-db.ts

```

Now you can run the project.

```bash
npm run dev
```
