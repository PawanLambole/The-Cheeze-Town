const fs = require('fs');
const path = require('path');

function stripQuotes(value) {
    const trimmed = value.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

function loadEnv(envFilePath = path.resolve(__dirname, '..', '.env')) {
    if (!fs.existsSync(envFilePath)) {
        return {};
    }

    const content = fs.readFileSync(envFilePath, 'utf8');
    const result = {};

    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) continue;

        const key = line.slice(0, eqIndex).trim();
        const value = stripQuotes(line.slice(eqIndex + 1));
        if (!key) continue;

        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
        result[key] = value;
    }

    return result;
}

module.exports = {
    loadEnv,
};
