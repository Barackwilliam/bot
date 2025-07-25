
const fs = require("fs"); const path = require("path");
 
const commandsDir = __dirname; const allCommands = {};
 
fs.readdirSync(commandsDir).forEach((file) => { if (file !== "index.js" && file.endsWith(".js")) { const commandSet = require(path.join(commandsDir, file)); Object.assign(allCommands, commandSet); } });
 
module.exports = allCommands;