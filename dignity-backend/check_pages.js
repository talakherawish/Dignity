const mongoose = require('mongoose');
require('dotenv').config();

async function checkPages() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    const db = mongoose.connection.db;
    
    console.log('Connected to MongoDB');
    console.log('\n=== Checking pages collection ===');
    
    const pages = await db.collection('pages').find({}).toArray();
    console.log(`Total pages: ${pages.length}`);
    
    pages.forEach(page => {
      console.log(`\n- Slug: ${page.slug}`);
      console.log(`  Title: ${page.title}`);
      console.log(`  Status: ${page._status}`);
      console.log(`  Published: ${page.publishedAt ? new Date(page.publishedAt).toISOString() : 'No'}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkPages();
