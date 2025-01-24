// dbModel.js
const dbModel = {
    tableCreateStatements: [
        // User table
        `
        CREATE TABLE IF NOT EXISTS User (
            id INT AUTO_INCREMENT PRIMARY KEY,
            firstName VARCHAR(255) NOT NULL,
            lastName VARCHAR(255) NOT NULL
        )
        `,

        // Media table
        `
        CREATE TABLE IF NOT EXISTS Media (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            release_year INT NOT NULL,
            rating ENUM('G', 'PG', 'PG-13', 'R', 'NC-17') NOT NULL,
            description VARCHAR(500)
        )
        `,

        // TV table
        `
        CREATE TABLE IF NOT EXISTS TV (
            id INT PRIMARY KEY,
            numSeasons INT NOT NULL,
            FOREIGN KEY (id) REFERENCES Media(id) ON DELETE CASCADE
        )
        `,

        // Movie table
        `
        CREATE TABLE IF NOT EXISTS Movie (
            id INT PRIMARY KEY,
            duration_min INT NOT NULL,
            FOREIGN KEY (id) REFERENCES Media(id) ON DELETE CASCADE
        )
        `,

        // WatchHistory table
        `
        CREATE TABLE IF NOT EXISTS WatchHistory (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userID INT NOT NULL,
            mediaID INT NOT NULL,
            dateWatched DATETIME NOT NULL,
            FOREIGN KEY (userID) REFERENCES User(id) ON DELETE CASCADE,
            FOREIGN KEY (mediaID) REFERENCES Media(id) ON DELETE CASCADE
        )
        `
    ]
}

export default dbModel;
