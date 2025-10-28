// server/dbUtils.js

const { getDb } = require('./database'); 

/**
 * Executes a single database query within a serialization wrapper.
 * This is the crucial step to prevent concurrency issues (SQLITE_BUSY) 
 * in a multi-user Node.js environment.
 */
const executeQuery = (method, sql, params = []) => {
    const db = getDb();
    return new Promise((resolve, reject) => {
        // ⭐ CRITICAL FIX: The db.serialize() method queues the query.
        db.serialize(() => { 
            db[method](sql, params, function(err, rowOrRows) {
                if (err) {
                    return reject(err);
                }
                if (method === 'run') {
                    // db.run resolves with the context (this)
                    resolve({ lastID: this.lastID, changes: this.changes });
                } else {
                    // db.get/all resolve with the row(s)
                    resolve(rowOrRows);
                }
            });
        });
    });
};

const runQuery = (sql, params = []) => executeQuery('run', sql, params);
const getQuery = (sql, params = []) => executeQuery('get', sql, params);
const allQuery = (sql, params = []) => executeQuery('all', sql, params);

// Special function for BEGIN/COMMIT/ROLLBACK which are simple 'run' commands
const runTransactionQuery = (sql) => executeQuery('run', sql); 

module.exports = { runQuery, getQuery, allQuery, runTransactionQuery };