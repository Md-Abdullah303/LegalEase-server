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
    const commentCollection = database.collection("comment");

    // admin related API
    app.get("/api/admin/:id", async (req, res) => {
      const { id } = req.params;
      const filter = {
        _id: new ObjectId(id),
      };
      const result = await userCollection.findOne(filter);
      res.send(result);
    });
    app.get("/api/allUsers", async (req, res) => {
      const query = {};
      if (req.query.role) {
        query.role = req.query.role;
      }
      if (req.query.status) {
        query.status = true;
      }
      const cursor = userCollection.find(query);
      const result = await cursor.toArray();
      // console.log(query, result);
      res.send(result);
    });
    app.patch("/api/admin/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      const filter = {
        _id: new ObjectId(id),
      };
      const updateDocument = {
        $set: updatedData,
      };
      const result = await userCollection.updateOne(filter, updateDocument);
      res.send(result);
    });

    // user related API
    app.get("/api/users", async (req, res) => {
      const query = {};
      if (req.query.userId) {
        query._id = new ObjectId(req.query.userId);
      }
      const cursor = userCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.patch("/api/users/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedData,
      };
      // console.log("update user api called", id, updatedData);
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

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
      // console.log(req.query.lawyerId, req.query.userId);
      const cursor = applicationCollection.find(query);
      const result = await cursor.toArray();
      res.send(result || []);
    });
    // app.get("/api/applications", async (req, res) => {
    //   const match = {};

    //   if (req.query.lawyerId) {
    //     match.lawyerId = req.query.lawyerId;
    //   }

    //   if (req.query.userId) {
    //     match.hiringApplicantId = req.query.userId;
    //   }

    //   const result = await applicationCollection
    //     .aggregate([
    //       {
    //         $addFields: {
    //           lawyerObjectId: { $toObjectId: "$lawyerId" },
    //         },
    //       },
    //       {
    //         $match: match,
    //       },
    //       {
    //         $lookup: {
    //           from: "user",
    //           localField: "lawyerObjectId",
    //           foreignField: "_id",
    //           as: "lawyer",
    //         },
    //       },
    //       {
    //         $unwind: {
    //           path: "$lawyer",
    //           preserveNullAndEmptyArrays: true,
    //         },
    //       },
    //     ])
    //     .toArray();

    //   res.send(result);
    // });

    app.post("/api/applications", async (req, res) => {
      const application = req.body;
      const applicationObj = {
        ...application,
        createdAt: new Date(),
      };
      const result = await applicationCollection.insertOne(applicationObj);
      res.send(result);
    });

    app.patch("/api/applications/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedData,
      };
      const result = await applicationCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // comment related API
    app.get("/api/comments", async (req, res) => {
      const query = {};
      if (req.query.lawyerId) {
        query.lawyerId = req.query.lawyerId;
      }
      if (req.query.userId) {
        query.userId = req.query.userId;
      }
      const cursor = commentCollection.find(query);
      const result = await cursor.toArray();
      res.send(result || []);
    });
    app.post("/api/comments", async (req, res) => {
      const comment = req.body;
      const commentObj = {
        ...comment,
        createdAt: new Date(),
      };
      const result = await commentCollection.insertOne(commentObj);
      res.send(result);
    });
    app.patch("/api/comment", async (req, res) => {
      const query = {};
      const updatedDoc = req.body;
      if (req.query.userId && req.query.lawyerId) {
        query.userId = req.query.userId;
        query.lawyerId = req.query.lawyerId;
      }
      const filter = {
        ...query,
      };
      const updatedDocument = {
        $set: updatedDoc,
      };

      // console.log("Filter * UpdatedDoc", filter, updatedDocument, updatedDoc);

      const result = await commentCollection.updateOne(filter, updatedDocument);
      // console.log("form Edit API : ", result);
      res.json(result);
    });
    app.delete("/api/comment", async (req, res) => {
      const query = {};
      if (req.query.userId && req.query.lawyerId) {
        ((query.userId = req.query.userId),
          (query.lawyerId = req.query.lawyerId));
      }
      const result = await commentCollection.deleteOne(query);
      // console.log("form delete API : ", result);
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
