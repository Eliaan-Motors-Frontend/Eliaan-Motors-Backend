const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const readline = require('readline');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models - Use absolute paths
const User = require(path.join(__dirname, '../models/User'));
const Car = require(path.join(__dirname, '../models/Car'));
const Booking = require(path.join(__dirname, '../models/Booking'));
const Payment = require(path.join(__dirname, '../models/Payment'));
const Review = require(path.join(__dirname, '../models/Review'));

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Question helper
const ask = (question) => new Promise((resolve) => {
  rl.question(question, resolve);
});

// Connect to database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Function to list all users
const listUsers = async () => {
  const users = await User.find().select('-password').sort('-createdAt');
  console.log('\n📋 All Users:\n');
  console.log('No. | Name | Email | Role | Created');
  console.log('-'.repeat(90));
  
  users.forEach((user, index) => {
    const num = (index + 1).toString().padEnd(3);
    const name = user.fullName.padEnd(20).slice(0, 20);
    const email = user.email.padEnd(35).slice(0, 35);
    const role = user.role.padEnd(8);
    const date = new Date(user.createdAt).toLocaleDateString();
    console.log(`${num} | ${name} | ${email} | ${role} | ${date}`);
  });
  
  console.log(`\n📊 Total: ${users.length} users\n`);
  return users;
};

// Function to delete user by email
const deleteUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User with email "${email}" not found`);
      return false;
    }
    
    console.log(`\n⚠️  Found user: ${user.fullName} (${user.email}) - Role: ${user.role}`);
    
    // Confirm deletion
    const confirm = await ask(`\nAre you sure you want to delete this user? (y/N): `);
    
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ Deletion cancelled');
      return false;
    }
    
    console.log('Deleting associated data...');
    
    // Delete all associated data
    if (Booking && Booking.deleteMany) {
      await Booking.deleteMany({ userId: user._id });
      console.log('  ✅ Bookings deleted');
    }
    
    if (Payment && Payment.deleteMany) {
      await Payment.deleteMany({ userId: user._id });
      console.log('  ✅ Payments deleted');
    }
    
    if (Review && Review.deleteMany) {
      await Review.deleteMany({ userId: user._id });
      console.log('  ✅ Reviews deleted');
    }
    
    // If vendor, also delete their cars
    if (user.role === 'vendor') {
      if (Car && Car.find) {
        const cars = await Car.find({ vendorId: user._id });
        if (cars && cars.length > 0) {
          await Car.deleteMany({ vendorId: user._id });
          console.log(`  🚗 Deleted ${cars.length} cars`);
        }
      } else {
        console.log('  ⚠️ Car model not loaded, skipping car deletion');
      }
    }
    
    await user.deleteOne();
    
    console.log(`✅ User "${email}" and all associated data deleted successfully`);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error.message);
    return false;
  }
};

// Function to delete user by selection number
const deleteUserByNumber = async (users) => {
  const maxNum = users.length;
  const choice = await ask(`Enter the number of the user to delete (1-${maxNum}): `);
  const num = parseInt(choice);
  
  if (isNaN(num) || num < 1 || num > maxNum) {
    console.log('❌ Invalid number');
    return;
  }
  
  const user = users[num - 1];
  await deleteUserByEmail(user.email);
};

// Function to delete all users (with confirmation)
const deleteAllUsers = async () => {
  const users = await User.find();
  
  if (users.length === 0) {
    console.log('No users to delete');
    return;
  }
  
  console.log(`\n⚠️  This will delete ALL ${users.length} users and all their associated data!\n`);
  console.log(`Users to delete:`);
  users.forEach(user => {
    console.log(`  - ${user.email} (${user.role})`);
  });
  
  console.log(`\n⚠️  THIS ACTION CANNOT BE UNDONE!\n`);
  const confirm = await ask(`Type "DELETE ALL" (without quotes) to confirm: `);
  
  if (confirm !== 'DELETE ALL') {
    console.log(`\n❌ Deletion cancelled. You typed: "${confirm}"`);
    console.log('   You must type exactly: DELETE ALL\n');
    return;
  }
  
  let deleted = 0;
  for (const user of users) {
    await deleteUserByEmail(user.email);
    deleted++;
  }
  
  console.log(`\n✅ Deleted ${deleted} users successfully!`);
};

// Function to delete users by email pattern
const deleteUsersByPattern = async () => {
  const pattern = await ask('Enter email pattern to delete (e.g., "test", "gmail", "example"): ');
  
  const users = await User.find({ email: { $regex: pattern, $options: 'i' } });
  
  if (users.length === 0) {
    console.log(`No users found with email containing "${pattern}"`);
    return;
  }
  
  console.log(`\nFound ${users.length} users:\n`);
  users.forEach(user => {
    console.log(`  - ${user.email} (${user.role})`);
  });
  
  const confirm = await ask(`\nDelete these ${users.length} users? (y/N): `);
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Deletion cancelled');
    return;
  }
  
  let deleted = 0;
  for (const user of users) {
    await deleteUserByEmail(user.email);
    deleted++;
  }
  
  console.log(`\n✅ Deleted ${deleted} users`);
};

// Function to create a test admin user
const createAdminUser = async () => {
  const adminExists = await User.findOne({ email: 'admin@eliaan.com' });
  
  if (adminExists) {
    console.log('⚠️  Admin user already exists:', adminExists.email);
    return;
  }
  
  const admin = await User.create({
    fullName: 'Admin User',
    email: 'admin@eliaan.com',
    phone: '+233240000000',
    password: 'admin123',
    role: 'admin',
    isVerified: true
  });
  
  console.log('✅ Admin user created!');
  console.log('   Email: admin@eliaan.com');
  console.log('   Password: admin123');
};

// Function to create a test vendor
const createTestVendor = async () => {
  const vendorExists = await User.findOne({ email: 'vendor@test.com' });
  
  if (vendorExists) {
    console.log('⚠️  Test vendor already exists');
    return;
  }
  
  const vendor = await User.create({
    fullName: 'Test Vendor',
    email: 'vendor@test.com',
    phone: '+233241234567',
    password: '123456',
    role: 'vendor',
    businessName: 'Test Motors',
    businessAddress: 'Test Address, Accra',
    isVerified: true
  });
  
  console.log('✅ Test vendor created!');
  console.log('   Email: vendor@test.com');
  console.log('   Password: 123456');
};

// Function to create a test user
const createTestUser = async () => {
  const userExists = await User.findOne({ email: 'user@test.com' });
  
  if (userExists) {
    console.log('⚠️  Test user already exists');
    return;
  }
  
  const user = await User.create({
    fullName: 'Test User',
    email: 'user@test.com',
    phone: '+233245678901',
    password: '123456',
    role: 'user',
    isVerified: true
  });
  
  console.log('✅ Test user created!');
  console.log('   Email: user@test.com');
  console.log('   Password: 123456');
};

// Main menu
const showMenu = async () => {
  const users = await User.find();
  
  console.log('\n' + '='.repeat(50));
  console.log('🔧 User Management Tool');
  console.log('='.repeat(50));
  console.log(`📊 Current users: ${users.length}`);
  console.log('='.repeat(50));
  console.log('1. List all users');
  console.log('2. Delete user by email');
  console.log('3. Delete user by number (from list)');
  console.log('4. Delete users by email pattern');
  console.log('5. Delete ALL users');
  console.log('6. Create test vendor');
  console.log('7. Create test user');
  console.log('8. Create admin user');
  console.log('9. Exit');
  console.log('='.repeat(50));
  
  const choice = await ask('Choose an option (1-9): ');
  
  switch (choice) {
    case '1':
      await listUsers();
      await showMenu();
      break;
    case '2':
      const email = await ask('Enter email to delete: ');
      await deleteUserByEmail(email);
      await showMenu();
      break;
    case '3':
      const userList = await listUsers();
      await deleteUserByNumber(userList);
      await showMenu();
      break;
    case '4':
      await deleteUsersByPattern();
      await showMenu();
      break;
    case '5':
      await deleteAllUsers();
      await showMenu();
      break;
    case '6':
      await createTestVendor();
      await showMenu();
      break;
    case '7':
      await createTestUser();
      await showMenu();
      break;
    case '8':
      await createAdminUser();
      await showMenu();
      break;
    case '9':
      console.log('👋 Goodbye!');
      rl.close();
      process.exit(0);
      break;
    default:
      console.log('❌ Invalid option');
      await showMenu();
  }
};

// Start the tool
console.log('\n🚀 Starting User Management Tool...');
showMenu().catch(console.error);