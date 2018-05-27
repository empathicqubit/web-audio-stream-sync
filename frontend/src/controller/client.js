import BufferClientBackend from '../buffer-client-backend';
import StartAudioContext from 'startaudiocontext';

function getProps(render) {
    const client = {
        clientName: '',
        clientId: '',
        sources: [],
        realPosition: 0,
    };

    client.options = {
        onTimeOffset: timeOffset => {
            client.realPosition = backend.getRealPosition();
            render();
        },
        onClientId: clientId => {
            client.clientId = clientId;
            render();
        },
        onSourcesUpdated: sources => {
            client.sources = sources
            render();
        },
        onSyncPacket: packet => {
            client.realPosition = backend.getRealPosition();
            render();
        }
    };

    const backend = new BufferClientBackend(client.options);

    client.onChangeName = (clientName) => {
        backend.changeName(clientName);
        client.clientName = clientName;
        render();
    };

    client.onComponentMount = () => {
        StartAudioContext(backend._context, '.playit')
            .then(() => {
                backend.afterContextStarted();
            });
    };

    return client;
};

export default getProps;
