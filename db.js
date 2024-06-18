import mongoose from 'mongoose';
import 'dotenv/config';

const connectDB = async () => {
  try {
    const dbHOST = process.env.MONGODBURI;
    if (!dbHOST) {
      throw new Error('DBHOST is not defined in environment variables');
    }
    await mongoose.connect(dbHOST);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Error while Mongo Connecting..', err);
    process.exit(1); // Exit the process with failure
  }
};

export default connectDB;
