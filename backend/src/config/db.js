const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const rawUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/interview_counselling_db';
    const uri = rawUri.replace('localhost', '127.0.0.1');
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
