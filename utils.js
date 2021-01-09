const { KEEP_ROUTES } = require('./consts');

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
      `Deleting unwanted routes. Keeping routes related to ${KEEP_ROUTES.length} route ids.`
    );
    const keepOnlyRoutes = await db.collection('routes').deleteMany({
      route_short_name: { $nin: KEEP_ROUTES },
    });

    console.log('No. routes deleted: ', keepOnlyRoutes.deletedCount);
  } catch (e) {
    throw new Error(e);
  }
}

async function doTrips(db) {
  try {
    console.log('Trying trips collection...');
    const cursor = await db.collection('routes').find();
    const keepRoutes = await cursor.toArray();

    const keepRouteIds = await keepRoutes.map((route) => route.route_id);
    console.log(
      `Deleting unwanted trips. Keeping trips related to ${keepRouteIds.length} route ids.`
    );
    const keepOnlyTrips = await db.collection('trips').deleteMany({
      route_id: { $nin: keepRouteIds },
    });
    console.log(`Deleted ${keepOnlyTrips.deletedCount} trips.`);
  } catch (e) {
    throw new Error('doTrips Error', e);
  }
}

async function doStopTimes(db) {
  try {
    console.log('Trying stop_times collection...');
    const cursor = await db.collection('trips').find();
    const keepTrips = await cursor.toArray();
    const keepTripIds = await keepTrips.map((trip) => trip.trip_id);
    console.log(
      `Deleting unwanted stop_times. Keeping stop_times related to ${keepTripIds.length} trip ids.`
    );
    const keepOnlyStopTimes = await db.collection('stop_times').deleteMany({
      trip_id: { $nin: keepTripIds },
    });
    console.log(`Deleted ${keepOnlyStopTimes.deletedCount} stop_times.`);
  } catch (e) {
    throw new Error(e);
  }
}

async function doStops(db) {
  try {
    console.log('Trying stops collection...');
    const distinctKeepStopIds = await db
      .collection('stop_times')
      .distinct('stop_id');
    console.log(
      `Deleting unwanted stops. Keeping stops related to ${distinctKeepStopIds.length} stop ids.`
    );
    const keepOnlyStops = await db.collection('stops').deleteMany({
      stop_id: { $nin: distinctKeepStopIds },
    });
    console.log(`Deleted ${keepOnlyStops.deletedCount} stops.`);
  } catch (e) {
    throw new Error('doStops Error', e);
  }
}

async function doShapes(db) {
  try {
    console.log('Trying shapes collection...');
    const distinctKeepShapeIds = await db
      .collection('trips')
      .distinct('shape_id');

    const shapesCollection = db.collection('shapes');

    console.log(
      `Deleting unwanted shapes. Keeping shapes related to ${distinctKeepShapeIds.length} shape ids.`
    );
    const bulkAns = await shapesCollection.bulkWrite([
      {
        deleteMany: {
          filter: { shape_id: { $nin: distinctKeepShapeIds } },
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
    const keepOnlyStopIds = await stops.distinct('stop_id');
    console.log(
      `Deleting unwanted transfers. Keeping transfers related to ${keepOnlyStopIds.length} stop ids.`
    );

    const keepOnlyTransfers = await transfers.deleteMany({
      from_stop_id: { $nin: keepOnlyStopIds },
    });
    console.log(`Deleted ${keepOnlyTransfers.deletedCount} transfers.`);
  } catch (e) {
    throw new Error(e);
  }
}
