//const KEEP_ROUTES = [401, 402, 403, 404, 405, 406, 407, 408, 409];
const KEEP_ROUTES = [
  '401',
  '402',
  '403',
  '404',
  '405',
  '406',
  '407',
  '408',
  '409',
];
module.exports = {
  deleteUnwantedData: async function (db) {
    try {

      await doRoutes(db);
      await doTrips(db);
      await doStopTimes(db);
      await doStops(db);
      await doShapes(db);
			await doTransfers(db);
      return true;
    } catch (e) {
      console.log('deleteUnwantedData', e);
      return e;
    }
  },
};

async function doRoutes(db) {
  try {
    console.log('Trying routes collection...');
    console.log(
      `Deleting unwanted routes. Keeping routes related to ${KEEP_ROUTES.length} route ids`
    );
    const galwayOnlyRoutes = await db.collection('routes').deleteMany({
      route_short_name: { $nin: KEEP_ROUTES },
    });

    console.log('No. routes deleted: ', galwayOnlyRoutes.deletedCount);
  } catch (e) {
    throw new Error(e);
  }
}

async function doTrips(db) {
  try {
    console.log('Trying trips collection...');
    const cursor = await db.collection('routes').find();
    const galwayRoutes = await cursor.toArray();

    const galwayRouteIds = await galwayRoutes.map((route) => route.route_id);
    console.log(
      `Deleting unwanted trips. Keeping trips related to ${galwayRouteIds.length} route ids`
    );
    const galwayOnlyTrips = await db.collection('trips').deleteMany({
      route_id: { $nin: galwayRouteIds },
    });
    console.log(`Deleted ${galwayOnlyTrips.deletedCount} trips.`);
  } catch (e) {
    throw new Error('doTrips Error', e);
  }
}

async function doStopTimes(db) {
  try {
    console.log('Trying stop_times collection...');
    const cursor = await db.collection('trips').find();
    const galwayTrips = await cursor.toArray();
    const galwayTripIds = await galwayTrips.map((trip) => trip.trip_id);
    console.log(
      `Deleting unwanted stop_times. Keeping stop_times related to ${galwayTripIds.length} route ids.`
    );
    const galwayOnlyStopTimes = await db.collection('stop_times').deleteMany({
      trip_id: { $nin: galwayTripIds },
    });
    console.log(`Deleted ${galwayOnlyStopTimes.deletedCount} stop_times.`);
  } catch (e) {
    throw new Error(e);
  }
}

async function doStops(db) {
  try {
    console.log('Trying stops collection...');
    const distinctGalwayStopIds = await db
      .collection('stop_times')
      .distinct('stop_id');
    console.log(
      `Deleting unwanted stops. Keeping stops related to ${distinctGalwayStopIds.length} stop ids.`
    );
    const galwayOnlyStops = await db.collection('stops').deleteMany({
      stop_id: { $nin: distinctGalwayStopIds },
    });
    console.log(`Deleted ${galwayOnlyStops.deletedCount} stops.`);
  } catch (e) {
    throw new Error('doStops Error', e);
  }
}

async function doShapes(db) {
  try {
    console.log('Trying shapes collection...');
    const distinctGalwayShapeIds = await db
      .collection('trips')
      .distinct('shape_id');

    const shapesCollection = db.collection('shapes');

    console.log(
      `Deleting unwanted shapes. Keeping shapes related to ${distinctGalwayShapeIds.length} shape ids.`
    );
    const bulkAns = await shapesCollection.bulkWrite([
      {
        deleteMany: {
          filter: { shape_id: { $nin: distinctGalwayShapeIds } },
        },
      },
    ]);
    console.log(`Deleted ${bulkAns.deletedCount} shapes.`);
  } catch (e) {
    throw new Error(e);
  }
}

async function doTransfers(db) {
  try {
    console.log('Trying transfers...');
    const transfers = db.collection('transfers');
    const stops = db.collection('stops');
    const galwayOnlyStopIds = await stops.distinct('stop_id');
    console.log(
      `deleting transfers related to ${galwayOnlyStopIds.length} stop ids`
    );

    const galwayOnlyTransfers = await transfers.deleteMany({
      from_stop_id: { $nin: galwayOnlyStopIds },
    });
  } catch (e) {
    throw new Error(e);
  }
}


// module.exports = {

// 	doRoutes:  async function (db) {
// 		try{
// 			console.log("Trying routes collection...");
// 			console.log(`Deleting unwanted routes. Keeping routes related to ${KEEP_ROUTES.length} route ids`);
// 			const galwayOnlyRoutes = await db.collection('routes').deleteMany({
// 				route_short_name: { $nin: KEEP_ROUTES },
// 			});

// 			 console.log("No. routes deleted: ", galwayOnlyRoutes.deletedCount);

// 		} catch(e) {
// 			throw new Error('doRoutes Error', e);
// 		}
// 	},

// 	doTrips: async function(db) {
// 		try{
// 			console.log("Trying trips collection...")
// 			const cursor = await db.collection('routes').find();
// 			const galwayRoutes = await cursor.toArray();

// 			const galwayRouteIds = await galwayRoutes.map((route) => route.route_id);
// 			console.log(`Deleting unwanted trips. Keeping trips related to ${galwayRouteIds.length} route ids`);
// 			const galwayOnlyTrips = await db.collection('trips').deleteMany({
// 				route_id: { $nin: galwayRouteIds },
// 			});
// 			console.log(`Deleted ${galwayOnlyTrips.deletedCount} trips.`);
// 		} catch(e) {
// 			throw new Error('doTrips Error', e);
// 		}
// 	},

// 	doStopTimes: async function (db) {

// 		try {
// 			console.log("Trying stop_times collection...")
// 			const cursor = await db.collection('trips').find();
// 			const galwayTrips = await cursor.toArray();
// 			const galwayTripIds = await galwayTrips.map((trip) => trip.trip_id);
// 			console.log(`Deleting unwanted stop_times. Keeping stop_times related to ${galwayTripIds.length} route ids.`);
// 			const galwayOnlyStopTimes = await db.collection('stop_times').deleteMany({
// 				trip_id: { $nin: galwayTripIds },
// 			});
// 			console.log(`Deleted ${galwayOnlyStopTimes.deletedCount} stop_times.`);

// 		} catch(e) {
// 			throw new Error(e);
// 		}
// 	},

// 	doStops: async function(db)  {

// 		try {
// 			console.log("Trying stops collection...")
// 			const distinctGalwayStopIds = await db.collection('stop_times').distinct('stop_id');
// 			console.log(`Deleting unwanted stops. Keeping stops related to ${distinctGalwayStopIds.length} stop ids.`);
// 			const galwayOnlyStops = await db.collection('stops').deleteMany({
// 				stop_id: { $nin: distinctGalwayStopIds },
// 			});
// 			console.log(`Deleted ${galwayOnlyStops.deletedCount} stops.`);
// 		} catch(e) {
// 			throw new Error('doStops Error', e);
// 		}
// 	},

// 	doShapes: async function (db) {

// 		try {
// 			console.log("Trying shapes collection...")
// 			const distinctGalwayShapeIds = await db.collection('trips').distinct('shape_id');

// 			const shapesCollection = db.collection('shapes');

// 			console.log(`Deleting unwanted shapes. Keeping shapes related to ${distinctGalwayShapeIds.length} shape ids.`);
// 			const bulkAns = await shapesCollection.bulkWrite([
// 				{
// 					deleteMany: {
// 						filter: { shape_id: { $nin: distinctGalwayShapeIds } },
// 					},
// 				},
// 			]);
// 			console.log(`Deleted ${bulkAns.deletedCount} shapes.`);
// 		} catch(e) {
// 			throw new Error(e);
// 		}
// 	},

// 	doTransfers: async function (db) {

// 		try {
// 			console.log("Trying transfers...")
// 			const transfers = db.collection('transfers');
// 			const stops = db.collection('stops');
// 			const galwayOnlyStopIds = await stops.distinct('stop_id');
// 			console.log(`deleting transfers related to ${galwayOnlyStopIds.length} stop ids`);

// 			const galwayOnlyTransfers = await transfers.deleteMany({
// 				from_stop_id: { $nin: galwayOnlyStopIds },
// 			});
// 		} catch(e) {
// 			throw new Error(e);
// 		}
// 	},

// }
