const { createCanvas } = require('canvas');
const fs = require('fs');

const size = 1024;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Background - baby blue
ctx.fillStyle = '#E8F4FC';
ctx.fillRect(0, 0, size, size);

// Decorative circles (soft blue, like splash screen)
ctx.fillStyle = 'rgba(184, 223, 245, 0.6)';

// Top right circle
ctx.beginPath();
ctx.arc(size - 100, 150, 280, 0, Math.PI * 2);
ctx.fill();

// Bottom left circle
ctx.beginPath();
ctx.arc(100, size - 150, 220, 0, Math.PI * 2);
ctx.fill();

// Text "R" centered
ctx.fillStyle = '#1E3A5F'; // deep blue
ctx.font = 'bold 500px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('R', size/2 - 40, size/2);

// "o" in accent color (italic style simulated)
ctx.fillStyle = '#4A9BB8'; // teal accent
ctx.font = 'italic 400px Arial';
ctx.fillText('o', size/2 + 180, size/2 + 30);

// Save
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('assets/icon-new.png', buffer);
console.log('Icon created: assets/icon-new.png');
