import express from "express";
import Location from "../models/Location.js";

const router = express.Router();

// ✅ Division list
router.get("/divisions", async (req, res) => {
  try {
    const divisions = await Location.distinct("division");
    res.json(divisions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ District list by division
router.get("/districts/:division", async (req, res) => {
  try {
    const { division } = req.params;
    const districts = await Location.find({ division }).distinct("district");
    res.json(districts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Thana list by district
router.get("/thanas/:division/:district", async (req, res) => {
  try {
    const { division, district } = req.params;
    const thanas = await Location.find({ division, district }).distinct(
      "thana"
    );
    res.json(thanas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
