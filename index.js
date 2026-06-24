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

    const monthNames = [
      "",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const database = client.db("legal-ease");
    const userCollection = database.collection("user");
    const applicationCollection = database.collection("application");
    const commentCollection = database.collection("comment");
    const paymentHistoryCollection = database.collection("payments");

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
    app.get("/api/hires", async (req, res) => {
      const query = {};
      if (req.query.status) {
        query.status = "Approved";
      }
      const cursor = applicationCollection.find(query);
      const result = await cursor.toArray();
      // console.log(query, result);
      res.send(result);
    });
    app.get("/api/topcategories", async (req, res) => {
      try {
        // ১. শুধুমাত্র 'Approved' স্ট্যাটাস থাকা সফল হায়ারগুলোর মোট সংখ্যা বের করা হচ্ছে
        const totalApprovedHires = await applicationCollection.countDocuments({
          status: "Approved",
        });

        // যদি কোনো হায়ার না থাকে তবে খালি অ্যারে রিটার্ন করবে (division by zero এরর এড়াতে)
        if (totalApprovedHires === 0) {
          return res.send([]);
        }

        // ২. অ্যাগ্রিগেশন পাইপলাইন দিয়ে ক্যাটাগরি অনুযায়ী ডাটা প্রসেস করা হচ্ছে
        const topCategories = await applicationCollection
          .aggregate([
            // ক) শুধুমাত্র Approved অ্যাপ্লিকেশন ফিল্টার করা হলো
            {
              $match: { status: "Approved" },
            },
            // খ) lawyerSpecialty অনুযায়ী গ্রুপ করে মোট সংখ্যা (count) বের করা হলো
            {
              $group: {
                _id: "$lawyerSpecialty",
                count: { $sum: 1 },
              },
            },
            // গ) UI এর সাথে মিলিয়ে অবজেক্ট ফরম্যাট এবং পার্সেন্টেজ (%) ক্যালকুলেট করা হলো
            {
              $project: {
                _id: 0,
                name: "$_id",
                count: 1,
                percentage: {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$count", totalApprovedHires] },
                        100,
                      ],
                    },
                    0, // দশমিক মুক্ত পূর্ণসংখ্যা রাখার জন্য (যেমন: 75)
                  ],
                },
              },
            },
            // ঘ) সবচেয়ে বেশি হায়ার হওয়া ক্যাটাগরি সবার উপরে রাখার জন্য সর্ট করা হলো
            {
              $sort: { count: -1 },
            },
            // ঙ) টপ ৪টি ক্যাটাগরি নেওয়ার জন্য লিমিট করা হলো
            {
              $limit: 4,
            },
          ])
          .toArray();

        res.send(topCategories);
      } catch (error) {
        console.error("Aggregation Error:", error);
        res.status(500).send({ error: "Failed to fetch top categories" });
      }
    });
    app.patch("/api/changUserRole/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      const filter = {
        _id: new ObjectId(id),
      };
      const updatedDocument = {
        $set: updatedData,
      };
      const result = await userCollection.updateOne(filter, updatedDocument);
      console.log(result, updatedData, updatedDocument);
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
      try {
        const query = {
          role: "lawyer",
          status: true,
        };
        const sort = {};

        if (req.query.search) {
          query.$or = [
            { name: { $regex: req.query.search, $options: "i" } },
            { specialty: { $regex: req.query.search, $options: "i" } },
          ];
        }

        if (req.query.salary === "salary_desc") {
          sort.salary = -1;
        } else if (req.query.salary === "salary_asc") {
          sort.salary = 1;
        }

        if (req.query.popularity === "popular_desc") {
          sort.hire = -1;
        } else if (req.query.popularity === "popular_asc") {
          sort.hire = 1;
        }

        const finalSort =
          Object.keys(sort).length > 0 ? sort : { createdAt: -1 };

        // console.log("Final Query:", query);
        // console.log("Final Sort:", finalSort);

        const cursor = userCollection.find(query).sort(finalSort);
        const result = await cursor.toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching lawyers:", error);
        res.status(500).send({ error: "Failed to fetch lawyers data" });
      }
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
      await userCollection.updateOne(
        { _id: new ObjectId(application?.lawyerId) },
        {
          $inc: {
            hire: 1,
          },
        },
      );

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

    // featured related api
    app.get("/api/feature", async (req, res) => {
      const query = {};
      let cursor;
      if (req.query.role) {
        query.role = req.query.role;
        cursor = userCollection.find(query).sort({ createdAt: -1 }).limit(6);
      }
      if (req.query.topHire) {
        query.role = "lawyer";
        cursor = userCollection.find(query).sort({ hire: -1 });
      }

      const result = await cursor.toArray();
      // console.log(result, query);
      res.send(result);
    });

    // payment related api
    app.post("/api/payment", async (req, res) => {
      const { sessionId, userId, lawyerId, price } = req.body;

      const isExist = await paymentHistoryCollection.findOne({ sessionId });
      if (isExist) {
        return res.json({ msg: "Already exist!" });
      }

      await paymentHistoryCollection.insertOne({
        ...req.body,
        createdAt: new Date(),
      });

      res.send({ msg: "Payment was successful!" });
    });
    app.get("/api/singleData/payment", async (req, res) => {
      const query = {};
      if (req.query.userId) {
        query.userId = req.query.userId;
      }
      if (req.query.lawyerId) {
        query.lawyerId = req.query.lawyerId;
      }
      const result = await paymentHistoryCollection.findOne(query);
      // console.log(result, query);
      res.send(result || {});
    });
    app.get("/api/multiple/payment", async (req, res) => {
      const query = {};
      if (req.query.userId) {
        query.userId = req.query.userId;
      }
      if (req.query.lawyerId) {
        query.lawyerId = req.query.lawyerId;
      }
      const result = await paymentHistoryCollection.find(query).toArray();
      // console.log(`form payment`, result, query);
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
