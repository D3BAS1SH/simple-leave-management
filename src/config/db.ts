import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // Retrieve the MongoDB connection string from environment variables
        const mongoUri = process.env.MONGO_URI;

        // Check if the connection string is defined
        if (!mongoUri) {
            console.error("MONGO_URI is not defined in the .env file");
            process.exit(1);
        }

        // Establish the connection to the database
        const conn = await mongoose.connect(mongoUri);

        // Log a success message to the console
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        // Log any errors that occur during connection
        console.error(`Error connecting to MongoDB: ${error.message}`);
        
        // Exit the process with a failure code
        process.exit(1);
    }
};

export default connectDB;