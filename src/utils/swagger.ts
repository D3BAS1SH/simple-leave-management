import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Simple Leave Management API',
            version: '1.0.0',
            description: 'API documentation for the Simple Leave Management System',
        },
        servers: [
            {
                url: 'http://localhost:5011',
                description: 'Development server',
            },
            {
                url: 'https://simple-leave-management.onrender.com',
                description: "Production Server"
            }
        ],
    },
    apis: ['./src/controllers/*.ts'], // Path to your controller files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export const setupSwagger = (app: Application) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
