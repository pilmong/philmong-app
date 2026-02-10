const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '.next');

if (fs.existsSync(distDir)) {
    console.log('Removing .next directory...');
    try {
        fs.rmSync(distDir, { recursive: true, force: true });
        console.log('.next directory removed successfully.');
    } catch (err) {
        console.error('Error removing .next directory:', err);
        process.exit(1);
    }
} else {
    console.log('.next directory does not exist.');
}
