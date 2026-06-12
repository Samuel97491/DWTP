const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const DB_NAME = "20263IFMongoLab";

let db;

app.use(express.static(path.join(__dirname, "../front")));

app.get("/api/stations/names", async (req, res) => {
  try {
    const filter = req.query.commune ? { commune: req.query.commune } : {};
    const stations = await db
      .collection("velov2026")
      .find(filter, { projection: { _id: 0, name: 1, commune: 1 } })
      .sort({ commune: 1, name: 1 })
      .toArray();
    res.json(stations);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/stations", async (req, res) => {
  try {
    const filter = req.query.commune ? { commune: req.query.commune } : {};
    const stations = await db
      .collection("velov2026")
      .find(filter, {
        projection: {
          _id: 0,
          name: 1,
          commune: 1,
          address: 1,
          available_bikes: 1,
          available_bike_stands: 1,
          status: 1
        }
      })
      .sort({ name: 1 })
      .toArray();
    res.json(stations);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/communes", async (req, res) => {
  try {
    const communes = await db.collection("velov2026").distinct("commune");
    communes.sort((a, b) => a.localeCompare(b, "fr"));
    res.json(communes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/communes/stats", async (req, res) => {
  try {
    const match = req.query.commune ? { commune: req.query.commune } : {};
    const stats = await db
      .collection("velov2026")
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: "$commune",
            stationCount: { $sum: 1 },
            avgAvailableBikes: { $avg: "$available_bikes" },
            totalAvailableBikes: { $sum: "$available_bikes" }
          }
        },
        {
          $project: {
            _id: 0,
            commune: "$_id",
            stationCount: 1,
            totalAvailableBikes: 1,
            avgAvailableBikes: { $round: ["$avgAvailableBikes", 1] }
          }
        },
        { $sort: { commune: 1 } }
      ])
      .toArray();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/communes/enriched", async (req, res) => {
  try {
    const match = req.query.commune ? { commune: req.query.commune } : {};
    const result = await db
      .collection("velov2026")
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: "$commune",
            stationCount: { $sum: 1 },
            totalAvailableBikes: { $sum: "$available_bikes" }
          }
        },
        {
          $lookup: {
            from: "communes",
            localField: "_id",
            foreignField: "commune",
            as: "info"
          }
        },
        { $unwind: { path: "$info", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            commune: "$_id",
            stationCount: 1,
            totalAvailableBikes: 1,
            population: "$info.population",
            area_km2: "$info.area_km2",
            stationsPer10kInhabitants: {
              $cond: [
                { $gt: ["$info.population", 0] },
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$stationCount", "$info.population"] },
                        10000
                      ]
                    },
                    2
                  ]
                },
                null
              ]
            }
          }
        },
        { $sort: { stationsPer10kInhabitants: -1 } }
      ])
      .toArray();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function start() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(DB_NAME);
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch(console.error);
