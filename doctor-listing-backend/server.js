require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Joi = require('joi');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/doctors', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Doctor Schema
const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  available: { type: Boolean, required: true },
  location: { type: String, required: true },
});

const Doctor = mongoose.model('Doctor', doctorSchema);

// Validation Schema for Adding a Doctor
const doctorValidationSchema = Joi.object({
  name: Joi.string().required(),
  specialty: Joi.string().required(),
  rating: Joi.number().min(0).max(5).required(),
  available: Joi.boolean().required(),
  location: Joi.string().required(),
});

// API 1: Add Doctor
app.post('/add-doctor', async (req, res) => {
  try {
    const { error } = doctorValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, specialty, rating, available, location } = req.body;
    const doctor = new Doctor({ name, specialty, rating, available, location });
    await doctor.save();
    res.status(201).json({ message: 'Doctor added successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API 2: List Doctors with Filters
app.get('/list-doctor-with-filter', async (req, res) => {
  try {
    const { specialty, location, page = 1, limit = 10 } = req.query;
    const query = {};
    if (specialty) query.specialty = specialty;
    if (location) query.location = location;

    const doctors = await Doctor.find(query)
      .sort({ name: 1 }) // Sort by name (ascending)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Doctor.countDocuments(query);

    res.json({ doctors, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API 3: Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Environment variables
process.env.MONGO_URI = 'mongodb://localhost:27017/doctors';
process.env.PORT = 5000;
