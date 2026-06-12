/**
 * Vélo'v Database Analysis & Query Samples
 */

// Total station count
const stationCount = db.velov2026.countDocuments({});

// Stations in Villeurbanne
const villeurbanneStations = db.velov2026.find({ commune: "Villeurbanne" });

// Open stations with mechanical bikes available
const availableMechanical = db.velov2026.find({
  status: "OPEN",
  "total_stands.availabilities.mechanicalBikes": { $gte: 1 }
});

// Stations with banking facilities
const bankingStations = db.velov2026.find(
  { banking: true },
  { _id: 0, name: 1, address: 1 }
);

// Top 5 stations by capacity
const topCapacity = db.velov2026.find({}).sort({ bike_stands: -1 }).limit(5);

// Alerts: Open stations with 0 bikes
const emptyStations = db.velov2026.find({
  status: "OPEN",
  available_bikes: 0
}).sort({ pole: 1 });

// District station summary per commune
const communeStats = db.velov2026.aggregate([
  {
    $group: {
      _id: "$commune",
      total_available_bikes: { $sum: "$available_bikes" },
      avg_capacity: { $avg: "$bike_stands" }
    }
  },
  { $sort: { _id: 1 } }
]);

