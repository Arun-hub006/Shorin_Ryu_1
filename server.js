const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const masterRoutes = require('./routes/masters');
const blackbeltRoutes = require('./routes/blackbelts');
const dojoRoutes = require('./routes/dojos');
const registrationRoutes = require('./routes/registrations');
const imageRoutes = require('./routes/images');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// HTML Fallbacks for direct navigation if needed
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Ensure database connection is fully established before processing API requests (Crucial for Vercel/serverless environments)
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection middleware failed:', error.message);
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/blackbelts', blackbeltRoutes);
app.use('/api/dojos', dojoRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/images', imageRoutes);

// Seed Initial Data Endpoint (For development ease)
app.post('/api/seed', async (req, res) => {
  try {
    const Master = require('./models/Master');
    const BlackBelt = require('./models/BlackBelt');
    const Dojo = require('./models/Dojo');
    const Registration = require('./models/Registration');

    // Clear existing
    await Master.deleteMany({});
    await BlackBelt.deleteMany({});
    await Dojo.deleteMany({});
    await Registration.deleteMany({});

    // Seed Masters
    const seededMasters = await Master.insertMany([
      {
        name: 'Sensei Rajesh K.',
        designation: 'Chief Instructor',
        dan: '7th Dan Black Belt',
        experience: '30+ Years',
        bio: 'Over 30 years of experience in traditional karate training, tournament coaching and student development. Dedicated to building discipline, confidence and excellence in every student.',
        imageUrl: '/assets/massdragon_hd.png'
      },
      {
        name: 'Sensei Anita P.',
        designation: 'Technical Director',
        dan: '6th Dan Black Belt',
        experience: '25+ Years',
        bio: 'Technical director specializing in Kata and mental discipline. Passionate about empowering women and children through martial arts self-defense training.',
        imageUrl: '/assets/sensei_female_1.png'
      },
      {
        name: 'Sensei Vikram S.',
        designation: 'Head of Training',
        dan: '6th Dan Black Belt',
        experience: '20+ Years',
        bio: 'Former national champion focusing on competitive Kumite techniques, agility conditioning, and sports psychology for high-performance athletes.',
        imageUrl: '/assets/sensei_male_2.png'
      },
      {
        name: 'Sensei Meena R.',
        designation: 'Discipline Coach',
        dan: '5th Dan Black Belt',
        experience: '18+ Years',
        bio: 'Discipline coach guiding youth development programs. Promotes karate as a way of life, focusing on focus, concentration, respect and academic balance.',
        imageUrl: '/assets/sensei_female_2.png'
      }
    ]);

    // Seed Black Belts
    await BlackBelt.insertMany([
      {
        name: 'Karthik N.',
        dan: '3rd Dan Black Belt',
        specialization: 'Kumite',
        experience: '8+ Years',
        bio: 'Specialized in Kumite with a strong focus on speed, agility and competitive techniques. Passionate about mentoring students and helping them achieve their full potential.',
        imageUrl: '/assets/bb_male_1.png'
      },
      {
        name: 'Priya S.',
        dan: '3rd Dan Black Belt',
        specialization: 'Kata',
        experience: '7+ Years',
        bio: 'Expert in Kata precision and form analysis. Helps students synchronize breathing, stance, and power output.',
        imageUrl: '/assets/bb_female_1.png'
      },
      {
        name: 'Arun M.',
        dan: '2nd Dan Black Belt',
        specialization: 'Self Defense',
        experience: '6+ Years',
        bio: 'Specializes in street self-defense application and quick response combat training for civilian safety.',
        imageUrl: '/assets/bb_male_2.png'
      },
      {
        name: 'Divya L.',
        dan: '2nd Dan Black Belt',
        specialization: 'Weapon Training',
        experience: '5+ Years',
        bio: 'Expert in traditional weapons (Okinawan Kobudo) including Bo staff, Sai, and Nunchaku techniques.',
        imageUrl: '/assets/bb_female_2.png'
      },
      {
        name: 'Raghav P.',
        dan: '2nd Dan Black Belt',
        specialization: 'Conditioning',
        experience: '5+ Years',
        bio: 'Focused on functional fitness, power-building workouts, endurance drills, and injury rehabilitation.',
        imageUrl: '/assets/bb_male_3.png'
      }
    ]);

    // Seed Dojos
    await Dojo.insertMany([
      {
        name: 'Dojo – Downtown',
        address: '123 Mambalam High Road, T. Nagar, Chennai – 600017',
        phone: '+91 98765 43210',
        mapUrl: 'https://maps.google.com/?q=12.9716,80.2348',
        latitude: 12.9716,
        longitude: 80.2348,
        description: 'Our Downtown dojo is equipped with world-class training facilities and experienced instructors to help you achieve your best.'
      },
      {
        name: 'Dojo – East Side',
        address: '45 Green Park Road, Anna Nagar, Chennai – 600040',
        phone: '+91 91234 56789',
        mapUrl: 'https://maps.google.com/?q=13.0843,80.2098',
        latitude: 13.0843,
        longitude: 80.2098,
        description: 'Our East Side branch features spacious wooden flooring, heavy bags, and a specialized children training zone.'
      },
      {
        name: 'Dojo – West Side',
        address: '78 Lake View Road, Velachery, Chennai – 600042',
        phone: '+91 99876 54321',
        mapUrl: 'https://maps.google.com/?q=12.9352,80.2210',
        latitude: 12.9352,
        longitude: 80.2210,
        description: 'Located in the heart of Velachery, this facility offers weekend martial arts programs and high-performance training seminars.'
      }
    ]);

    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error seeding database', error: error.message });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Something went wrong on the server!' });
});

// Start Server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
