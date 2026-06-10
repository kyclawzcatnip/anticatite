const fs = require('fs');
const code = fs.readFileSync('game.js','utf8');
// Find Level 5 arena
const match = code.match(/\/\/ Level 5[\s\S]*?\],/);
const lines = match[0].split('\n').filter(l => l.includes('"'));
lines.forEach((l,i) => {
    const s = l.match(/"([^"]*)"/);
    if(s) console.log('Row '+i+': length='+s[1].length + ' -> "'+s[1]+'"');
});
