import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 6+ không cần các options này nữa
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(` MongoDB Connected: ${conn.connection.host}`);
    
    // Log database name
    console.log(` Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(` Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log(' MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(` MongoDB connection error: ${err}`);
});

export default connectDB;
