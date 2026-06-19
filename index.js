const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5555;

// meddleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URL;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("legal-ease");
    const userCollection = database.collection("user");
    const applicationCollection = database.collection("application");

    // lawyer related API
    app.get("/api/lawyers", async (req, res) => {
      const query = {
        role: "lawyer",
        status: true,
      };
      const cursor = userCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/api/lawyers/:id", async (req, res) => {
      const { id } = req.params;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await userCollection.findOne(query);
      res.send(result);
    });
    app.patch("/api/lawyers/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedData,
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // application related API
    app.get("/api/applications", async (req, res) => {
      const query = {};
      if (req.query.lawyerId) {
        query.lawyerId = req.query.lawyerId;
      }
      if (req.query.userId) {
        query.hiringApplicantId = req.query.userId;
      }
      console.log(req.query.lawyerId, req.query.userId);
      const result = await applicationCollection.findOne(query);
      res.send(result);
    });

    app.post("/api/applications", async (req, res) => {
      const application = req.body;
      const result = await applicationCollection.insertOne(application);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
