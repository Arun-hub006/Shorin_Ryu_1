const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/karate_db');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    // Do not call process.exit(1) to avoid crashing the server process.
    // This allows the server to start successfully and serve static content
    // while Mongoose handles connection buffering and retries.
  }
};

module.exports = connectDB;
