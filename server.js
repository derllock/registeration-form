const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer'); // For file uploads
const path = require('path');
const cors = require('cors');
const app = express();
require('dotenv').config();
app.use(express.json());
app.use(cors());


const Swal = require('sweetalert2')
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).catch((error) => {                                                  //gives connection error messages like ip not listed
  console.log(error.message)
});
mongoose.connection.on('connected', () => {                                //this is executed first on connection
  console.log('Allright Mongoose connection established Yo');
})
mongoose.connection.on('error', (error) => {
  console.log(error.message);
})
mongoose.connection.on('disconnected', () => {
  console.log('Alas! Mongoose disconnected, See you next time');                              //this is executed first on SIGINT
})

// Mongoose Schema for Registration
const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  hobbies: { type: [String], required: true },
  address: { type: String, required: true },
  state: { type: String, required: true },
  resumePath: { type: String, required: true }, // Store path to the uploaded resume
}, {
  timestamps: true
});
const Registration = mongoose.model('registration', registrationSchema);

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage: storage, limits: {
    fileSize: 2 * 1024 * 1024, // Limit file size to 2MB
  }
});

// Endpoint to handle form submission
app.post('/process_registration', upload.single('resume'), async (req, res) => {
  try {
    const { name, dob, gender, hobbies, address, state } = req.body;
    const resumePath = req.file ? req.file.path : '';
    if ((name != "" && dob != "" && gender != "" && address != "" && state != "" && resumePath) && (!hobbies || hobbies.length < 2)) {
      res.status(404).json({ error: 'Please select atleast 2 hobbies ' });
    }
    else {
      const newRegistration = new Registration({
        name,
        dob,
        gender,
        hobbies,
        address,
        state,
        resumePath,
      });

      await newRegistration.save();
      res.status(201).json({ message: 'Registration successful' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to retrieve all registered data
app.get('/get_registered_data', async (req, res) => {
  try {
    const registrations = await Registration.find({}, 'name dob gender hobbies address state resumePath');

    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving registration data' });
  }
});


// Endpoint to download resumes
app.get('/download_resume/:resumeId', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.resumeId);
    if (!registration || !registration.resumePath) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    const resumePath = registration.resumePath;
    res.download(resumePath);
  } catch (error) {
    res.status(500).json({ error: 'Error downloading resume' });
  }
});

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//show html file
app.get('/register', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

//view registered data
app.get('/view', function (req, res) {
  res.sendFile(path.join(__dirname + '/viewRecords.html'));
});
