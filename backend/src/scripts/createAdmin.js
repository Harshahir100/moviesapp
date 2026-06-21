// backend/src/scripts/createAdmin.js
import { AuthService } from '../services/authService.js';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => {
    rl.question(query, resolve);
});

async function createAdmin() {
    console.log('\n🔐 Create Admin User\n');
    console.log('='.repeat(40));
    
    const username = await question('Username: ');
    const email = await question('Email: ');
    const fullName = await question('Full Name: ');
    const password = await question('Password (min 8 characters): ');
    
    if (password.length < 8) {
        console.log('\n❌ Password must be at least 8 characters');
        rl.close();
        return;
    }
    
    console.log('\n⏳ Creating admin...');
    
    const result = await AuthService.createAdmin(username, password, email, fullName);
    
    if (result.success) {
        console.log('\n✅ Admin created successfully!');
        console.log(`\n📋 Admin Details:`);
        console.log(`   Username: ${result.admin.username}`);
        console.log(`   Email: ${result.admin.email}`);
        console.log(`   Full Name: ${result.admin.full_name}`);
        console.log(`   Role: ${result.admin.role}`);
        console.log(`\n🔑 You can now login with these credentials.`);
    } else {
        console.log(`\n❌ Failed: ${result.message}`);
    }
    
    rl.close();
}

createAdmin();