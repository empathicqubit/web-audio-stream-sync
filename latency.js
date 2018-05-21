const ws = require('ws');
const wsServer = new ws.Server({
    port: 3031,
});

const originAllowed = origin => {
        console.log(origin);

        return true;
};

wsServer.on('connection', client => {
    let now = Date.now();

    client.send(now);

    client.on('message', msg => {
        console.log(msg);

        now = Date.now();

        client.send(now);
    });
});
