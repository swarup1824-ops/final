// ShikshaShare Database Utility
// Lightweight JSON file-based database for College CEP Project

const fs = require('fs');
const path = require('path');

function getDbPath() {
  if (process.env.DB_FILE_PATH) {
    return path.resolve(process.cwd(), process.env.DB_FILE_PATH);
  }
  // On Vercel / AWS Lambda, the root is read-only so use /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = path.join('/tmp', 'db.json');
    if (!fs.existsSync(tmpPath)) {
      try {
        const seedPath = path.join(__dirname, '..', 'database', 'db.json');
        if (fs.existsSync(seedPath)) {
          fs.copyFileSync(seedPath, tmpPath);
        }
      } catch (e) {
        console.warn('[Database] Could not seed /tmp/db.json:', e.message);
      }
    }
    return tmpPath;
  }
  return path.join(__dirname, '..', 'database', 'db.json');
}

let DB_PATH = getDbPath();

// Default database schema
const DEFAULT_DB = {
  users: [],
  resources: [],
  requests: [],
  donations: [],
  communityRequirements: [],
  distributions: [],
  contactRequests: [],
  communityPartners: [],
  notifications: [],
  impactStats: {
    resourcesShared: 0,
    moneySavedRupees: 0,
    communityDrivesCompleted: 0,
    activeDonorsPartners: 0,
    treesEquivalentSaved: 0
  }
};

/**
 * Ensures the database directory and file exist with valid JSON
 */
function ensureDbExists() {
  DB_PATH = getDbPath();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
  }
}

/**
 * Reads and returns the complete database object
 */
function readDb() {
  ensureDbExists();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[Database] Error reading ${DB_PATH}:`, err.message);
    return { ...DEFAULT_DB };
  }
}

/**
 * Safely writes the database object to disk
 */
function writeDb(data) {
  ensureDbExists();
  try {
    // Atomic write via temp file to avoid file corruption
    const tempPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_PATH);
    return true;
  } catch (err) {
    console.error(`[Database] Error writing to ${DB_PATH}:`, err.message);
    throw new Error('Database write operation failed.');
  }
}

/**
 * Returns a specific collection array
 */
function getCollection(collectionName) {
  const db = readDb();
  if (!Array.isArray(db[collectionName])) {
    db[collectionName] = [];
    writeDb(db);
  }
  return db[collectionName];
}

/**
 * Finds all items matching a filter function
 */
function find(collectionName, filterFn = () => true) {
  const collection = getCollection(collectionName);
  return collection.filter(filterFn);
}

/**
 * Finds the first item matching a filter function
 */
function findOne(collectionName, filterFn) {
  const collection = getCollection(collectionName);
  return collection.find(filterFn) || null;
}

/**
 * Finds an item by its unique ID
 */
function findById(collectionName, id) {
  return findOne(collectionName, item => String(item.id) === String(id));
}

/**
 * Inserts a new item into a collection
 */
function insert(collectionName, item) {
  const db = readDb();
  if (!Array.isArray(db[collectionName])) {
    db[collectionName] = [];
  }

  const newItem = {
    ...item,
    id: item.id || `${collectionName.slice(0, 3)}-${Date.now()}`
  };

  db[collectionName].unshift(newItem);
  writeDb(db);
  return newItem;
}

/**
 * Updates an existing item by ID
 */
function updateById(collectionName, id, updates) {
  const db = readDb();
  const collection = db[collectionName] || [];
  const index = collection.findIndex(item => String(item.id) === String(id));

  if (index === -1) {
    return null;
  }

  const updatedItem = {
    ...collection[index],
    ...updates,
    id: collection[index].id // ID remains immutable
  };

  collection[index] = updatedItem;
  writeDb(db);
  return updatedItem;
}

/**
 * Deletes an item by ID
 */
function deleteById(collectionName, id) {
  const db = readDb();
  const collection = db[collectionName] || [];
  const index = collection.findIndex(item => String(item.id) === String(id));

  if (index === -1) {
    return false;
  }

  collection.splice(index, 1);
  writeDb(db);
  return true;
}

module.exports = {
  readDb,
  writeDb,
  getCollection,
  find,
  findOne,
  findById,
  insert,
  updateById,
  deleteById,
  DB_PATH
};
