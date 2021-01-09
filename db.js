const { MongoClient } = require('mongodb');
require('dotenv/config');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useUnifiedTopology: true });
module.exports = {
  connectToDb: async function () {
    const dbName = process.env.DB_NAME;
    try {
      await client.connect();
      return await client.db(dbName);
    } catch (e) {
      console.error(e);
    }
  },
  closeConnection: async function () {
    console.log('Closing connection.');
    await client.close();
  },
};
