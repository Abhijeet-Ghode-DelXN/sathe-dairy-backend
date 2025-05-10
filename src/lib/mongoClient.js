const { MongoClient, ServerApiVersion } = require("mongodb");

if (!process.env.MONGO_DB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGO_DB_URI"');
}

const uri = process.env.MONGO_DB_URI;
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  tls: true, // Enable TLS
  tlsAllowInvalidCertificates: true, // Optional, depends on your setup
};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  let globalWithMongo = global;

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
    globalWithMongo._mongoClient.connect();
  }
  client = globalWithMongo._mongoClient;
  clientPromise = globalWithMongo._mongoClient.connect();
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

module.exports = clientPromise;
