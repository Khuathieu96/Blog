# Database Migration Best Practices: Lessons from Production

## Introduction

Database migrations are a critical part of application development, especially when working across multiple environments (QA, staging, production). This article documents real-world experiences and best practices for running safe, efficient migrations on MongoDB databases.

## The Challenge

When managing a growing application with millions of records, database migrations become increasingly complex. A failed migration can cause downtime, data corruption, or worse—partial updates that leave your database in an inconsistent state. Through experience running migrations across QA and production environments, several key patterns emerged that dramatically improved reliability and efficiency.

## Core Principles

### 1. Write Idempotent Migrations

**The Problem:** Migrations can fail for many reasons—network issues, timeout errors, memory constraints, or bugs in the migration logic itself. When this happens, you need to re-run the migration safely.

**The Solution:** Every migration should be **idempotent**—meaning it can be run multiple times without causing errors or duplicate changes.

#### Bad Example (Not Idempotent)
```javascript
// ❌ This will fail on second run
async function migrate() {
  // Adds field without checking if it exists
  await User.updateMany(
    {},
    { $set: { emailVerified: false } }
  );
  
  console.log("Migration complete");
}

// First run: ✓ Success
// Second run: ✓ Success (but updates already-migrated data!)
// Problem: No way to track progress, no safety checks
```

#### Good Example (Idempotent with Progress Tracking)
```javascript
// ✅ Safe to run multiple times
async function migrate() {
  const migrationId = "add_email_verified_field_2025_12";
  
  // Check if migration already completed
  const completed = await MigrationLog.findOne({ migrationId });
  if (completed) {
    console.log(`Migration ${migrationId} already completed at ${completed.completedAt}`);
    return;
  }
  
  // Only update documents that don't have the field
  const result = await User.updateMany(
    { emailVerified: { $exists: false } }, // Key: Only unmigrated docs
    { $set: { emailVerified: false } }
  );
  
  console.log(`Updated ${result.modifiedCount} users`);
  
  // Record completion
  await MigrationLog.create({
    migrationId,
    completedAt: new Date(),
    documentsAffected: result.modifiedCount
  });
}
```

**Key Techniques:**
- Maintain a `migrations` collection to track completed migrations
- Log progress and affected document counts
- Use checkpoints for long-running migrations

#### Advanced: Checkpoint-Based Migration
```javascript
async function migrateWithCheckpoints() {
  const migrationId = "transform_user_data_2025_12";
  const batchSize = 1000;
  
  // Resume from last checkpoint
  let checkpoint = await MigrationCheckpoint.findOne({ migrationId });
  let processedCount = checkpoint?.processedCount || 0;
  
  console.log(`Resuming from document ${processedCount}`);
  
  try {
    while (true) {
      const users = await User.find({ migrated: { $ne: true } })
        .limit(batchSize)
        .skip(processedCount);
      
      if (users.length === 0) break;
      
      for (const user of users) {
        await transformUser(user);
        user.migrated = true;
        await user.save();
        processedCount++;
      }
      
      // Save checkpoint every batch
      await MigrationCheckpoint.updateOne(
        { migrationId },
        { $set: { processedCount, lastUpdated: new Date() } },
        { upsert: true }
      );
      
      console.log(`Processed: ${processedCount}`);
    }
    
    console.log("✓ Migration complete");
  } catch (error) {
    console.error(`✗ Migration failed at document ${processedCount}:`, error);
    throw error;
  }
}
```

---

### 2. Test First, Then Scale

**The Strategy:** Never run a migration directly on the full production database. Use a phased approach to catch issues early.

#### Phase 1: Development Testing
```javascript
// Test with minimal data
async function testMigration() {
  console.log("=== DEVELOPMENT TEST ===");
  
  const testDocs = await User.find().limit(10);
  console.log(`Testing with ${testDocs.length} documents`);
  
  for (const doc of testDocs) {
    console.log(`Before:`, doc);
    await migrateDocument(doc);
    console.log(`After:`, doc);
  }
  
  console.log("✓ Dev test complete - verify output manually");
}
```

#### Phase 2: QA Batch Test
```javascript
// Test with realistic sample size
async function qaBatchTest() {
  console.log("=== QA BATCH TEST ===");
  
  const sampleSize = 1000;
  const users = await User.find().limit(sampleSize);
  
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  
  for (const user of users) {
    try {
      await migrateUser(user);
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`Error migrating user ${user._id}:`, error.message);
    }
  }
  
  const duration = (Date.now() - startTime) / 1000;
  const docsPerSecond = sampleSize / duration;
  
  console.log(`
    ✓ QA Test Complete
    - Success: ${successCount}
    - Errors: ${errorCount}
    - Duration: ${duration.toFixed(2)}s
    - Speed: ${docsPerSecond.toFixed(0)} docs/sec
    - Estimated time for 10M docs: ${(10000000 / docsPerSecond / 3600).toFixed(2)} hours
  `);
}
```

#### Phase 3: Production Migration (Unattended)
```javascript
// Full migration with logging and monitoring
async function productionMigration() {
  console.log("=== PRODUCTION MIGRATION ===");
  console.log(`Started at: ${new Date().toISOString()}`);
  
  const logFile = `./logs/migration-${Date.now()}.log`;
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  const total = await User.countDocuments();
  const batchSize = 5000;
  let processed = 0;
  let errors = [];
  
  while (processed < total) {
    const batch = await User.find()
      .skip(processed)
      .limit(batchSize);
    
    for (const user of batch) {
      try {
        await migrateUser(user);
        processed++;
        
        // Log progress every 10k documents
        if (processed % 10000 === 0) {
          const progress = (processed / total * 100).toFixed(2);
          const message = `[${new Date().toISOString()}] Progress: ${processed}/${total} (${progress}%)`;
          console.log(message);
          logStream.write(message + '\n');
        }
      } catch (error) {
        errors.push({ userId: user._id, error: error.message });
        logStream.write(`ERROR: ${user._id} - ${error.message}\n`);
      }
    }
  }
  
  logStream.end();
  
  console.log(`
    ✓ Migration Complete
    - Total processed: ${processed}
    - Errors: ${errors.length}
    - Log file: ${logFile}
  `);
  
  if (errors.length > 0) {
    console.log("First 10 errors:", errors.slice(0, 10));
  }
}
```

**Benefits of This Approach:**
- Catch bugs early with small datasets
- Estimate production migration time accurately
- Run production migration unattended (overnight)
- No need to monitor constantly—check logs in the morning

---

### 3. Parallel Migrations: When and How

**The Question:** Can we run multiple migrations simultaneously to save time? For example, one from top-to-bottom and another from bottom-to-top?

**The Answer:** Sometimes yes, but usually no. Parallel migrations require careful planning to avoid race conditions and data corruption.

#### ❌ Dangerous: Same Collection, Overlapping Data
```javascript
// DON'T DO THIS - Race condition!
async function dangerousParallelMigration() {
  await Promise.all([
    // Migration A: Top to bottom
    User.find().sort({ _id: 1 }).limit(500000).forEach(migrateUser),
    
    // Migration B: Bottom to top
    User.find().sort({ _id: -1 }).limit(500000).forEach(migrateUser)
  ]);
  
  // Problem: If database has 500k documents, both migrations
  // process the same documents = duplicate updates or conflicts!
}
```

#### ⚠️ Risk: Write Lock Contention
```javascript
// Parallel updates on same collection = lock contention
async function lockContentionExample() {
  // Both fight for write locks on the 'users' collection
  await Promise.all([
    User.updateMany({ type: 'A' }, { $set: { migrated: true } }),
    User.updateMany({ type: 'B' }, { $set: { migrated: true } })
  ]);
  
  // Result: Slower than sequential due to lock waiting!
}
```

#### ✅ Safe: Different Collections
```javascript
// SAFE - No overlapping data
async function safeParallelMigration() {
  console.log("Running parallel migrations on different collections...");
  
  await Promise.all([
    migrateUsers(),      // Collection: users
    migrateOrders(),     // Collection: orders
    migrateProducts(),   // Collection: products
    migrateReviews()     // Collection: reviews
  ]);
  
  console.log("✓ All migrations complete");
}
```

#### ✅ Safe: Non-Overlapping ID Ranges (Sharding)
```javascript
// SAFE - Each worker processes exclusive range
async function shardedMigration() {
  const total = await User.countDocuments();
  const workers = 4;
  const chunkSize = Math.ceil(total / workers);
  
  console.log(`Splitting ${total} documents across ${workers} workers`);
  
  const promises = Array.from({ length: workers }, (_, i) => {
    const skip = i * chunkSize;
    const workerId = `Worker-${i + 1}`;
    
    return migrateChunk(skip, chunkSize, workerId);
  });
  
  await Promise.all(promises);
  console.log("✓ All workers complete");
}

async function migrateChunk(skip, limit, workerId) {
  console.log(`${workerId} starting at offset ${skip}`);
  
  const users = await User.find()
    .skip(skip)
    .limit(limit);
  
  let processed = 0;
  for (const user of users) {
    await migrateUser(user);
    processed++;
    
    if (processed % 1000 === 0) {
      console.log(`${workerId}: ${processed} docs`);
    }
  }
  
  console.log(`${workerId} complete: ${processed} docs`);
}
```

#### ✅ Safe: With Explicit Locking
```javascript
// Advanced: Use application-level locking
async function lockedParallelMigration() {
  const workers = 4;
  const promises = [];
  
  for (let i = 0; i < workers; i++) {
    promises.push(workerWithLocking(`Worker-${i}`));
  }
  
  await Promise.all(promises);
}

async function workerWithLocking(workerId) {
  while (true) {
    // Atomically claim next batch
    const batch = await User.findOneAndUpdate(
      { migrated: { $ne: true }, locked: { $ne: true } },
      { $set: { locked: true, lockedBy: workerId } },
      { sort: { _id: 1 }, limit: 100, new: true }
    );
    
    if (!batch) break; // No more work
    
    await migrateUser(batch);
    
    await User.updateOne(
      { _id: batch._id },
      { $set: { migrated: true }, $unset: { locked: "", lockedBy: "" } }
    );
  }
  
  console.log(`${workerId} finished`);
}
```

**Recommendation:** Only parallelize when you fully understand MongoDB locking and have non-overlapping data ranges. For most cases, **sequential is safer and often faster** due to avoiding lock contention.

---

### 4. Execution Methods: Performance Comparison

**Where should you run migrations?** Let's compare the options.

#### Option 1: MongoDB Compass (GUI)
```javascript
// Simple query in Compass
db.users.updateMany(
  { status: "pending" },
  { $set: { status: "active" } }
)
```

**Pros:**
- Visual interface
- Good for simple operations
- No coding required

**Cons:**
- ❌ Can't handle complex logic
- ❌ No progress tracking
- ❌ Can't resume if interrupted
- ❌ Limited batch control
- ❌ Slower than programmatic access

**Best for:** Quick one-off updates on small datasets

---

#### Option 2: MongoDB Shell (mongo CLI)
```javascript
// Run in mongo shell
use mydb;

db.users.find({ oldField: { $exists: true } }).forEach(function(doc) {
  doc.newField = doc.oldField * 2;
  delete doc.oldField;
  db.users.save(doc);
});
```

**Pros:**
- Direct database access
- Fast for simple operations
- Good for ad-hoc queries

**Cons:**
- ❌ No access to application logic
- ❌ Limited error handling
- ❌ No TypeScript/Mongoose models
- ❌ Hard to test

**Best for:** Simple transformations without business logic

---

#### Option 3: Backend CLI Script (Recommended)
```javascript
// migrations/add-user-scores.js
const mongoose = require('mongoose');
const User = require('../models/User');
const { calculateScore } = require('../services/scoreService');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const users = await User.find();
  console.log(`Migrating ${users.length} users...`);
  
  let processed = 0;
  for (const user of users) {
    // Use application business logic
    user.score = calculateScore(user.orders, user.reviews);
    await user.save();
    
    processed++;
    if (processed % 100 === 0) {
      console.log(`Progress: ${processed}/${users.length}`);
    }
  }
  
  console.log("✓ Migration complete");
  await mongoose.disconnect();
}

migrate().catch(console.error);
```

Run with: `node migrations/add-user-scores.js`

**Pros:**
- ✅ Full access to application code
- ✅ Use existing models and services
- ✅ Complex business logic
- ✅ Proper error handling
- ✅ Easy to test
- ✅ Can use transactions

**Cons:**
- Requires coding
- Needs proper error handling

**Best for:** Most production migrations

---

#### Option 4: Backend with BulkWrite (Fastest)
```javascript
// Optimized for large datasets
async function optimizedMigration() {
  const batchSize = 10000;
  let skip = 0;
  
  while (true) {
    const users = await User.find()
      .skip(skip)
      .limit(batchSize)
      .lean(); // Faster: returns plain objects
    
    if (users.length === 0) break;
    
    // Prepare bulk operations
    const bulkOps = users.map(user => ({
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { 
          newField: transformData(user),
          migratedAt: new Date()
        }}
      }
    }));
    
    // Execute all updates in one database round-trip
    await User.bulkWrite(bulkOps, { ordered: false });
    
    skip += batchSize;
    console.log(`Processed: ${skip}`);
  }
}
```

**Performance Comparison:**

| Method | Speed | 10M Documents |
|--------|-------|---------------|
| Compass | Slowest | ~10-20 hours |
| Mongo Shell | Slow | ~8-15 hours |
| Backend (individual saves) | Medium | ~5-8 hours |
| **Backend (bulkWrite)** | **Fastest** | **~2-4 hours** |

**Winner:** Backend CLI with `bulkWrite` for best performance, control, and safety.

---

### 5. Essential Safety Measures

#### Always Backup First
```bash
# Before any migration
mongodump --db=mydb --out=/backups/before-migration-2025-12-26

# Run migration
node migrations/transform-users.js

# If something goes wrong, restore
mongorestore --db=mydb --drop /backups/before-migration-2025-12-26/mydb
```

#### Use Transactions for Atomic Operations
```javascript
async function transactionalMigration() {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // All operations succeed or all fail
    await User.updateMany(
      { status: "pending" },
      { $set: { status: "active" } },
      { session }
    );
    
    await AuditLog.create([{
      action: "user_status_migration",
      timestamp: new Date(),
      affectedCount: await User.countDocuments({ status: "active" })
    }], { session });
    
    await session.commitTransaction();
    console.log("✓ Transaction committed");
  } catch (error) {
    await session.abortTransaction();
    console.error("✗ Transaction rolled back:", error);
    throw error;
  } finally {
    session.endSession();
  }
}
```

#### Monitor Database Performance
```javascript
async function monitoredMigration() {
  const startTime = Date.now();
  
  // Monitor DB stats every 5 seconds
  const monitorInterval = setInterval(async () => {
    const stats = await mongoose.connection.db.stats();
    const serverStatus = await mongoose.connection.db.admin().serverStatus();
    
    console.log({
      connections: serverStatus.connections.current,
      operations: serverStatus.opcounters,
      memory: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`
    });
  }, 5000);
  
  try {
    await runMigration();
  } finally {
    clearInterval(monitorInterval);
    const duration = (Date.now() - startTime) / 1000;
    console.log(`Migration completed in ${duration}s`);
  }
}
```

---

## Production Migration Framework

For recurring migrations, use a proper migration framework:

```bash
npm install migrate-mongo
```

### Configuration
```javascript
// migrate-mongo-config.js
module.exports = {
  mongodb: {
    url: process.env.MONGO_URI,
    databaseName: process.env.DB_NAME,
    options: { useNewUrlParser: true, useUnifiedTopology: true }
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js"
};
```

### Migration File
```javascript
// migrations/20251226120000-add-user-email-verification.js
module.exports = {
  async up(db, client) {
    console.log("Running UP migration: add email verification");
    
    await db.collection('users').updateMany(
      { emailVerified: { $exists: false } },
      { $set: { emailVerified: false, emailVerifiedAt: null } }
    );
    
    console.log("✓ Migration UP complete");
  },

  async down(db, client) {
    console.log("Running DOWN migration: remove email verification");
    
    await db.collection('users').updateMany(
      {},
      { $unset: { emailVerified: "", emailVerifiedAt: "" } }
    );
    
    console.log("✓ Migration DOWN complete");
  }
};
```

### Usage
```bash
# Check migration status
npm run migrate:status

# Run pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
migrate-mongo create add-user-field
```

---

## Complete Production Checklist

### Pre-Migration
```
☐ Backup database (mongodump)
☐ Test on development (10-100 docs)
☐ Test on QA (1000-10000 docs)
☐ Verify migration is idempotent
☐ Test rollback procedure
☐ Estimate production duration
☐ Schedule during low-traffic window (2-6 AM)
☐ Notify team (dev, ops, support)
☐ Prepare monitoring dashboard
☐ Have emergency rollback plan ready
```

### During Migration
```
☐ Start migration
☐ Monitor error logs in real-time
☐ Watch progress metrics
☐ Check database performance (CPU, memory, connections)
☐ Verify no user-facing impact
☐ Keep backup accessible for quick restore
☐ Have team member on standby
```

### Post-Migration
```
☐ Verify data integrity (spot checks)
☐ Run application integration tests
☐ Monitor error rates in production
☐ Check performance metrics (response times)
☐ Verify rollback still possible
☐ Keep backup for 7-30 days
☐ Document what changed
☐ Update runbook for future migrations
☐ Notify team of completion
```

---

## Real-World Example: Complete Migration

Here's a complete, production-ready migration incorporating all best practices:

```javascript
// migrations/2025-12-26-migrate-user-preferences.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MIGRATION_ID = 'migrate_user_preferences_v2_2025_12_26';
const BATCH_SIZE = 5000;
const LOG_DIR = './logs';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFile = path.join(LOG_DIR, `${MIGRATION_ID}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

async function migrate() {
  try {
    log(`Starting migration: ${MIGRATION_ID}`);
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log('✓ Connected to database');
    
    const db = mongoose.connection.db;
    const User = db.collection('users');
    const MigrationLog = db.collection('migration_logs');
    
    // Check if already completed
    const existing = await MigrationLog.findOne({ migrationId: MIGRATION_ID });
    if (existing) {
      log(`Migration already completed at ${existing.completedAt}`);
      return;
    }
    
    // Get total count
    const total = await User.countDocuments({ migrated: { $ne: true } });
    log(`Found ${total} users to migrate`);
    
    if (total === 0) {
      log('No users to migrate');
      return;
    }
    
    // Process in batches
    let processed = 0;
    let errors = [];
    const startTime = Date.now();
    
    while (processed < total) {
      const users = await User.find({ migrated: { $ne: true } })
        .limit(BATCH_SIZE)
        .toArray();
      
      if (users.length === 0) break;
      
      // Prepare bulk operations
      const bulkOps = users.map(user => {
        // Transform user preferences
        const preferences = {
          theme: user.oldTheme || 'light',
          language: user.oldLang || 'en',
          notifications: {
            email: user.emailNotifications !== false,
            push: user.pushNotifications !== false,
            sms: user.smsNotifications === true
          },
          privacy: {
            profileVisible: user.publicProfile !== false,
            showEmail: user.showEmail === true
          }
        };
        
        return {
          updateOne: {
            filter: { _id: user._id },
            update: {
              $set: {
                preferences,
                migrated: true,
                migratedAt: new Date()
              },
              $unset: {
                oldTheme: "",
                oldLang: "",
                emailNotifications: "",
                pushNotifications: "",
                smsNotifications: "",
                publicProfile: "",
                showEmail: ""
              }
            }
          }
        };
      });
      
      // Execute bulk write
      try {
        const result = await User.bulkWrite(bulkOps, { ordered: false });
        processed += result.modifiedCount;
        
        const progress = (processed / total * 100).toFixed(2);
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = processed / elapsed;
        const remaining = (total - processed) / rate;
        
        log(`Progress: ${processed}/${total} (${progress}%) - ` +
            `${rate.toFixed(0)} docs/sec - ` +
            `ETA: ${(remaining / 60).toFixed(1)} min`);
      } catch (error) {
        errors.push({
          batch: processed,
          error: error.message
        });
        log(`ERROR in batch at ${processed}: ${error.message}`);
      }
    }
    
    // Record completion
    const duration = (Date.now() - startTime) / 1000;
    await MigrationLog.insertOne({
      migrationId: MIGRATION_ID,
      completedAt: new Date(),
      documentsProcessed: processed,
      errors: errors.length,
      durationSeconds: duration
    });
    
    log(`
      ✓ Migration Complete
      - Total processed: ${processed}
      - Errors: ${errors.length}
      - Duration: ${(duration / 60).toFixed(2)} minutes
      - Average rate: ${(processed / duration).toFixed(0)} docs/sec
    `);
    
    if (errors.length > 0) {
      log('First 5 errors:');
      errors.slice(0, 5).forEach(err => log(JSON.stringify(err)));
    }
    
  } catch (error) {
    log(`✗ Migration failed: ${error.message}`);
    log(error.stack);
    throw error;
  } finally {
    logStream.end();
    await mongoose.disconnect();
    log('✓ Disconnected from database');
  }
}

// Run migration
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate };
```

### Running the Migration
```bash
# 1. Backup first
mongodump --db=mydb --out=/backups/$(date +%Y%m%d)

# 2. Test on small sample (modify to limit: 100)
NODE_ENV=development node migrations/2025-12-26-migrate-user-preferences.js

# 3. Run on QA
NODE_ENV=qa node migrations/2025-12-26-migrate-user-preferences.js

# 4. Production (use process manager to prevent disconnection)
pm2 start migrations/2025-12-26-migrate-user-preferences.js --name user-migration

# 5. Monitor logs
tail -f logs/migrate_user_preferences_v2_2025_12_26.log

# 6. Check PM2 status
pm2 status
pm2 logs user-migration
```

---

## Key Takeaways

1. **Idempotency is Critical** - Every migration must be safely re-runnable
2. **Test in Stages** - Dev → QA → Production with increasing data sizes
3. **Avoid Risky Parallelization** - Usually not worth the complexity
4. **Use Backend Scripts** - Best balance of speed, control, and safety
5. **Always Backup** - Backups are mandatory, not optional
6. **Use Transactions** - Ensure atomic operations
7. **Monitor Performance** - Watch database metrics during migration
8. **Log Everything** - Detailed logs save hours of debugging
9. **Checkpoints** - Allow resuming long-running migrations
10. **Framework** - Use migration tools for recurring migrations

## Conclusion

Database migrations are challenging but manageable with the right approach. By following these practices—writing idempotent migrations, testing in stages, choosing the right execution method, and always having a backup—you can confidently migrate large production databases with minimal risk.

The key is preparation: test thoroughly, monitor closely, and always have a rollback plan. With experience, what once felt risky becomes a routine, predictable operation.

---

## Additional Resources

- [MongoDB Manual: Database Commands](https://docs.mongodb.com/manual/reference/command/)
- [Mongoose Transactions](https://mongoosejs.com/docs/transactions.html)
- [migrate-mongo Documentation](https://github.com/seppevs/migrate-mongo)
- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)

---

**Author's Note:** These practices were developed through real-world experience migrating databases with millions of records across QA and production environments. Each lesson came from actual failures and successes. May your migrations be swift and uneventful!
