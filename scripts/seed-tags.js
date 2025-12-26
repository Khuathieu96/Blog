// scripts/seed-tags.js
// Run this script once to populate initial tags: node scripts/seed-tags.js
const mongoose = require('mongoose');
require('dotenv').config();

const TagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

TagSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

const Tag = mongoose.models.Tag || mongoose.model('Tag', TagSchema);

const initialTags = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'MongoDB',
  'GraphQL',
  'Apollo',
  'Material-UI',
  'CSS',
  'HTML',
  'Express',
  'REST API',
  'Webpack',
  'Database'
];

async function seedTags() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check existing tags
    const existingTags = await Tag.find();
    console.log(`Found ${existingTags.length} existing tags`);

    let created = 0;
    let skipped = 0;

    for (const tagName of initialTags) {
      try {
        const existing = await Tag.findOne({ name: tagName });
        if (existing) {
          console.log(`  - Skipped: ${tagName} (already exists)`);
          skipped++;
        } else {
          await Tag.create({ name: tagName });
          console.log(`  + Created: ${tagName}`);
          created++;
        }
      } catch (error) {
        console.error(`  ✗ Error with ${tagName}:`, error.message);
      }
    }

    console.log(`\n✓ Seed complete: ${created} created, ${skipped} skipped`);
    
    // Display all tags
    const allTags = await Tag.find().sort({ name: 1 });
    console.log(`\nTotal tags in database: ${allTags.length}`);
    console.log('Tags:', allTags.map(t => t.name).join(', '));

  } catch (error) {
    console.error('✗ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

seedTags();
