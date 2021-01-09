const fs = require('fs');
const resolve = require('path').resolve;
const exec = require('child_process').exec;
const extract = require('extract-zip');
const download = require('download');
require('dotenv/config');


const {staticDataUrl} = require('./consts'); 
const extractToTarget = resolve('./gtfsStaticDataUnzipped');  // or some other folder in project root.
const dbName = process.env.DB_NAME;

// Download Zip File
async function downloadZip() {
  console.log('Downloading zip file...');
  try {
    const data = await download(staticDataUrl);
    fs.writeFileSync('gtfsStaticData/gtfsData.zip', data);
    console.log('Zip downloaded okay.');
  } catch (err) {
    console.log(err);
    throw new Error('Download zip files error.');
  }
}

// Extract Zip
async function extractZip() {
  // extractToTarget must be an absolute path
  try {
    console.log('Extracting zip.');
    await extract('./gtfsStaticData/gtfsData.zip', {
      dir: extractToTarget,
    });
    console.log(`Zip files extracted to ${extractToTarget}.`);
  } catch (err) {
    console.log('Extract zip files failed.');
    throw new Error(err);
  }
}



/**
 * GTFS File requirements (https://developers.google.com/transit/gtfs/reference/#file_requirements)
 * -All files must be saved as comma-delimited text
 * -All dataset files must be zipped together
 * 
 */
async function saveExtractedFilesToDb() {
  console.log('reading files...');
  await fs.readdir(extractToTarget, function (err, files) {
    if (err) {
      throw new Error(err);
		}
		
		// Do some basic checks on the extracted files before saving to db.

		// Check folder not empty.
    if (files.length === 0) {
      throw new Error('No .txt files found.');
    }


		// Check extracted zip contains only .txt files.
    files.forEach((fileName) => {
      if (
        fileName.trim().substring(fileName.length - 4, fileName.length) !==
        '.txt'
      ) {
        throw new Error('Found a non .txt file in unzipped folder');
      }
    });

    // Save to DB. Each .txt file will be it's own collection.
    files.forEach(async function (fileName) {
      const collectionName = fileName.trim().substring(0, fileName.length - 4);
      console.log(`Saving ${collectionName}...`);
      await executeMongoImport(
        `./gtfsStaticDataUnzipped/${fileName}`,
        collectionName
      );
    });
  });
}

function executeMongoImport(file, collection) {
  let command = `mongoimport -d ${dbName} -c ${collection} --type csv --drop --file ${file} --headerline`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.log('Error cmd', err);
    }
    console.log('stdout', stdout);
    console.log('stderr', stderr);
  });
}

async function updateStaticGTFS() {
  await downloadZip();
  await extractZip();
  await saveExtractedFilesToDb();
}

updateStaticGTFS();
