import config from "../config.js"
import dbModel from './dbModel.js'

import mysql from 'mysql2/promise'


class Database {
    constructor() {
        this.initialized = this.initDatabase()
    }

    async initDatabase() {
        try {
            const connection = await this._getConnection(false)
            try {
                const dbExists = await this.checkDatabaseExisits(connection)
                console.log(dbExists ? 'Database exists' : 'Database does not exist. Building Database')

                await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.db.connection.database}`)
                await connection.query(`USE ${config.db.connection.database}`)

                for (const statement of dbModel.tableCreateStatements) {
                    await connection.query(statement)
                }
            } finally {
                connection.end()
            }
        } catch (error) {
            console.error(JSON.stringify({ message: 'Error initializing database', exception: error.message, connection: config.db.connection }))
        }
    }

    async query(connection, sql) {
        const [results] = await connection.execute(sql)
        return results
    }

    async getConnection() {
        await this.initialized
        return this._getConnection()
    }

    async _getConnection(setUse = true) {
        const connection = await mysql.createConnection({
            host: config.db.connection.host,
            user: config.db.connection.user,
            password: config.db.connection.password,
            connectTimeout: config.db.connection.connectionTimeout,
            decimalNumbers: true
        })
        if (setUse) {
            await connection.query(`USE ${config.db.connection.database}`)
        }
        return connection
    }

    async checkDatabaseExisits(connection) {
        const [rows] = await connection.execute(`SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`, [config.db.connection.database])
        return rows.length > 0
    }
}

const DB = new Database()

export { DB }
