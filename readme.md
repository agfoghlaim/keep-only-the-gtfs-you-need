# Keep Only GTFS You Need

Fetches static GTFS data, unzips and saves to a mongoDB database. Then deletes bus routes you're not interested in.

## Usage

### Download and save GTFS data
```bash
npm i
```

```
npm i dotenv
```
Save database details in a .env file.

```env
MONGO_URI=<your mongodb uri>
DB_NAME=<your db name>
```
* Define uri of the GTFS zip file you want to use in consts.js
* Create an empty folder in project root called gtfsStaticData
and run 

```bash
node saveRemoteGTFSZip
``` 
This will download and save the data to DB.


### Delete data you don't need

Static GTFS for Irish buses (https://www.transportforireland.ie/transitData/PT_Data.html) is over 500MB. If you're only interested in certain bus routes define them in consts.js. Example below keeps only Galway City bus routes.

```
module.exports = {
	KEEP_ROUTES: ['401', '402', '404', '405', '407', '409'],
	staticDataUrl: 'https://www.transportforireland.ie/transitData/google_transit_combined.zip'
}
```

Then run ```node keepOnlyGTFSYouNeed``` to delete everything else.