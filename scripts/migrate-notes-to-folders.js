// Migration script to move all existing notes to a "Daily" folder
// Run this script once to migrate existing data

const mongoose = require('mongoose');

// MongoDB connection string - update with your actual connection string
const MONGODB_URI = 'mongodb+srv://hieulinhapps_db_user:1FjUJY6QXeh8dTqU@cluster0.x0ipaii.mongodb.net/';

// Define schemas (same as in models)
const NoteFolderSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  isCollapsed: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const NoteSchema = new mongoose.Schema({
  header: { type: String, required: true },
  content: { type: String, default: "" },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: "NoteFolder" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const NoteFolder = mongoose.models.NoteFolder || mongoose.model('NoteFolder', NoteFolderSchema);
const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);

async function migrateNotes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');

    // Create "Daily" folder if it doesn't exist
    let dailyFolder = await NoteFolder.findOne({ name: 'Daily' });

    if (!dailyFolder) {
      console.log('Creating "Daily" folder...');
      dailyFolder = await NoteFolder.create({
        name: 'Daily',
        isCollapsed: false,
        order: 0
      });
      console.log('Daily folder created with ID:', dailyFolder._id);
    } else {
      console.log('Daily folder already exists with ID:', dailyFolder._id);
    }

    // Find all notes without a folder
    const notesWithoutFolder = await Note.find({
      $or: [
        { folder: { $exists: false } },
        { folder: null }
      ]
    });

    console.log(`Found ${notesWithoutFolder.length} notes without a folder`);

    if (notesWithoutFolder.length > 0) {
      // Update all notes without a folder to use the Daily folder
      const result = await Note.updateMany(
        {
          $or: [
            { folder: { $exists: false } },
            { folder: null }
          ]
        },
        {
          $set: { folder: dailyFolder._id }
        }
      );

      console.log(`Successfully migrated ${result.modifiedCount} notes to the Daily folder`);
    } else {
      console.log('No notes need migration');
    }

    // Verify migration
    const totalNotes = await Note.countDocuments();
    const notesInDaily = await Note.countDocuments({ folder: dailyFolder._id });
    console.log(`\nMigration Summary:`);
    console.log(`Total notes: ${totalNotes}`);
    console.log(`Notes in Daily folder: ${notesInDaily}`);

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateNotes();
