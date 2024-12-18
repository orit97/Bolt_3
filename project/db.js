const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGO_URI; // Store the URI in the .env file
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let goalsCollection;

async function connectToDB() {
  try {
    await client.connect();
    const db = client.db("GoalSense");
    goalsCollection = db.collection("goals");
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}

async function addGoal(userId, userName, goal) {
  const filter = { userId };
  const update = {
    $set: { userId, userName },
    $push: { goals: goal },
  };
  const options = { upsert: true };
  await goalsCollection.updateOne(filter, update, options);
}

async function listGoals(userId) {
  const user = await goalsCollection.findOne({ userId });
  return user ? user.goals : [];
}

async function removeGoal(userId, goal) {
  const filter = { userId };
  const update = { $pull: { goals: goal } };
  await goalsCollection.updateOne(filter, update);
}

module.exports = {
  connectToDB,
  addGoal,
  listGoals,
  removeGoal,
};
