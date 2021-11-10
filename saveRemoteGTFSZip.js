const fs = require('fs');
const resolve = require('path').resolve;
const exec = require('child_process').exec;
const extract = require('extract-zip');
const download = require('download');
require('dotenv/config');

const { staticDataUrl } = require('./consts');
const extractToTarget = resolve('./gtfsStaticDataUnzipped'); // or some other folder in project root.
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
			const collectionTypes = getFieldTypes(collectionName);
			console.log(`Saving ${collectionName}...`);
			await executeMongoImport(
				`./gtfsStaticDataUnzipped/${fileName}`,
				collectionName,
				collectionTypes
			);
		});
	});
}

function executeMongoImport(file, collection, collectionTypes) {
	const command = `mongoimport -d ${dbName} -c ${collection} --type csv --drop --columnsHaveTypes --fields=${collectionTypes} --file ${file} --parseGrace=skipRow`;
	// const command = `mongoimport -d ${dbName} -c ${collection} --type csv --drop --file ${file} --headerline`;

	exec(command, (err, stdout, stderr) => {
		if (err) {
			console.log('Error cmd', err);
		}
		console.log('stdout', stdout);
		console.log('stderr', stderr);
	});
}
//trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign,pickup_type,drop_off_type,shape_dist_traveled
function getFieldTypes(collection) {
	const typeDefinitions = {
		agency:
			'agency_id.string(),agency_name.string(),agency_url.string(),agency_timezone.string(),agency_lang.string()',
		calendar_dates: 'service_id.string(),date.string(),exception_type.string()',
		calendar:
			'service_id.string(),monday.int32(),tuesday.int32(),wednesday.int32(),thursday.int32(),friday.int32(),saturday.int32(),sunday.int32(),start_date.int32(),end_date.int32()',
		routes:
			'route_id.string(),agency_id.string(),route_short_name.string(),route_long_name.string(),route_type.string()',
		shapes:
			'shape_id.string(),shape_pt_lat.decimal(),shape_pt_lon.decimal(),shape_pt_sequence.int32(),shape_dist_traveled.double()',
		stop_times:
			'trip_id.string(),arrival_time.string(),departure_time.string(),stop_id.string(),stop_sequence.int32(),stop_headsign.string(),pickup_type.string(),drop_off_type.string(),shape_dist_traveled.double()',
		stops:
			'stop_id.string(),stop_name.string(),stop_lat.decimal(),stop_lon.decimal()',
		transfers:
			'from_stop_id.string(),to_stop_id.string(),transfer_type.string(),min_transfer_time.int32()',
		trips:
			'route_id.string(),service_id.string(),trip_id.string(),shape_id.string(),trip_headsign.string(),direction_id.string()',
	};
	if (typeof typeDefinitions[collection] === 'string') {
		return typeDefinitions[collection];
	}
	return '';
}
async function updateStaticGTFS() {
	await downloadZip();
	await extractZip();
	await saveExtractedFilesToDb();
}

updateStaticGTFS();
