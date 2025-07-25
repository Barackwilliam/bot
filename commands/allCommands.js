// commands/index.js
const fs = require('fs');
const path = require('path');

const allCommands = {};

const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && file !== 'index.js');

for (const file of files) {
    const commandSet = require(path.join(__dirname, file));
    Object.assign(allCommands, commandSet);
}

module.exports = allCommands;
