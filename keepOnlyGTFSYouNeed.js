const { deleteUnwantedData } = require('./utils');
const { connectToDb, closeConnection } = require('./db');

async function go() {
  try {
    const db = await connectToDb();

    if (!db) return;

    const ans = await deleteUnwantedData(db);
    if (ans === true) {
      console.log('Data deleted successfully.');
    } 
  } catch (e) {
    console.error(e);
  } finally {
    await closeConnection();
  }
}

go();
