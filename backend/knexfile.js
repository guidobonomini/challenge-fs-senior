"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    development: {
        client: 'postgresql',
        connection: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'taskmanagement_dev',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: './database/migrations',
        },
        seeds: {
            directory: './database/seeds',
        },
    },
    test: {
        client: 'postgresql',
        connection: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'taskmanagement_test',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
        },
        pool: {
            min: 1,
            max: 5,
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: './database/migrations',
        },
        seeds: {
            directory: './database/seeds',
        },
    },
    production: {
        client: 'postgresql',
        connection: process.env.DATABASE_URL || {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: { rejectUnauthorized: false },
        },
        pool: {
            min: 2,
            max: 20,
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: './database/migrations',
        },
        seeds: {
            directory: './database/seeds',
        },
    },
};
exports.default = config;
//# sourceMappingURL=knexfile.js.map