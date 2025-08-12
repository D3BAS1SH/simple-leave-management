import * as dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

import app from './app'; // Import the configured Express app
import connectDB from './config/db'; // Import the database connection function

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to the database before starting the server
        await connectDB();

        // Start listening for incoming requests
        app.listen(PORT, () => {
            console.log(`🚀 Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });

    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

startServer();