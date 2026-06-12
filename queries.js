db.velov2026.countDocuments({});

db.velov2026.find({ commune: "Villeurbanne" });

db.velov2026.find({
  status: "OPEN",
  "total_stands.availabilities.mechanicalBikes": { $gte: 1 }
});

db.velov2026.find(
  { banking: true },
  { _id: 0, name: 1, address: 1 }
);

db.velov2026.find({}, { name: 1, bike_stands: 1, _id: 0 })
  .sort({ bike_stands: -1 })
  .limit(5);

db.velov2026.find({
  status: "OPEN",
  available_bikes: 0
}).sort({ pole: 1 });

db.velov2026.find(
  { commune: "Lyon 5e Arrondissement" },
  { _id: 0, name: 1, available_bikes: 1 }
);

db.velov2026.aggregate([
  {
    $group: {
      _id: "$commune",
      totalAvailableBikes: { $sum: "$available_bikes" },
      avgCapacity: { $avg: "$bike_stands" }
    }
  },
  { $sort: { totalAvailableBikes: -1 } }
]);

db.velov2026.find({
  available_bikes: { $gt: 0 },
  $expr: {
    $gt: [
      "$total_stands.availabilities.electricalBikes",
      { $multiply: ["$available_bikes", 0.5] }
    ]
  }
});

db.velov2026.aggregate([
  {
    $project: {
      _id: 0,
      name: 1,
      daysElapsed: {
        $toInt: {
          $dateDiff: {
            startDate: { $toDate: "$last_update" },
            endDate: "$$NOW",
            unit: "day"
          }
        }
      }
    }
  }
]);

db.velov2026.createIndex({ geometry: "2dsphere" });
db.velov2026.find({
  geometry: {
    $near: {
      $geometry: { type: "Point", coordinates: [4.815, 45.743] },
      $maxDistance: 500
    }
  }
});
