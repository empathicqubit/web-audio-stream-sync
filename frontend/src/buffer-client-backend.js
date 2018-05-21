import _ from 'lodash';

const HOST = window.location.host.split(':')[0];

class BufferClientBackend {
    changeName(name, callback) {
        this._ws.send(JSON.stringify({
            type: 'set_name',
            name: name,
        }));

        callback && callback();
    }
    constructor(options) {
        this._options = options || {};

        this.changeName = _.debounce(this.changeName.bind(this),3000);

        let AudioContext = window.AudioContext || window.webkitAudioContext;
        this._context = options.context || new AudioContext();
    }
    afterContextStarted() {
        const ALLOWED_OFFSET = 5;

        const loadBuffer = (context, url) => {
            return new Promise((resolve, reject) => {
              // Load buffer asynchronously
              let request = new XMLHttpRequest();
              request.open("GET", url, true);
              request.responseType = "arraybuffer";

              let loader = this;

              request.onload = () => {
                // Asynchronously decode the audio file data in request.response
                context.decodeAudioData(
                  request.response,
                  function(buffer) {
                    if (!buffer) {
                      reject('error decoding file data: ' + url);
                      return;
                    }

                    resolve({
                        url: url,
                        buffer: buffer,
                        node: null,
                        panner: null,
                        pan: 0,
                        gainer: null,
                        gain: 1,
                        startTime: 0,
                        startPosition: 0,
                        enabled: false,
                    });
                  },
                  err => reject(err)
                );
              }

              request.onerror = e => reject(e);

              request.send();
            });
        }

        const loadAllBuffers = (context, urls) => {
            return Promise.all(urls.map(url => loadBuffer(context, 'audio/' + url)));
        }

        let sources = [];

        let syncPacket = {};
        let timeOffset = 0;
        let clientId = 0;

        let mixerNode = this._context.createPanner();
        mixerNode.connect(this._context.destination);

        let outNode = mixerNode;

        const getRealPosition = () => {
            return syncPacket.timecode + (Date.now() - (syncPacket.timestamp + timeOffset));
        }

        this.getRealPosition = getRealPosition;

        const restartSource = (source) => {
            try {
                source.node.stop();
            }
            catch(e) {}

            let node = source.node = newBufferSource();
            node.buffer = source.buffer;

            node.connect(source.panner);

            let pos = this.getRealPosition();
            node.start(0, pos / 1000);

            source.startTime = Date.now();
            source.startPosition = pos;
        };

        const getOffset = (source) => {
            let sourceElapsed = Date.now() - source.startTime  + source.startPosition;
             
            let sourceWrap = Math.abs(sourceElapsed % (source.buffer.duration * 1000));
            return Math.abs(this.getRealPosition() - sourceWrap);
        }

        let _unusedBufferSource = null;

        const setUnusedBufferSource = () => {
            if(_unusedBufferSource) {
                return;
            }

            _unusedBufferSource = this._context.createBufferSource();
        }

        const getUnusedBufferSource = () => {
            let ubs = _unusedBufferSource;
            _unusedBufferSource = null;
            return ubs;
        };

        const newBufferSource = () => {
            setUnusedBufferSource();
            return getUnusedBufferSource();
        }

        setTimeout(setUnusedBufferSource, 10);

        const updateSources = () => {
            sources.forEach(source => {
                source.panner.pan.value = source.pan;
                source.gainer.gain.value = source.gain;

                if(source.enabled && syncPacket.timecode != -1) {
                    let offset;
                    if (!source.startTime || (offset = getOffset(source)) > .005) {
                        console.log(offset);
                        restartSource(source);
                    }
                }
                else {
                    source.startTime = 0;
                    source.startPosition = 0;

                    try {
                        source.node.stop(); 
                    }
                    catch(e) {}
                }
            });
        };

        let ws = this._ws = new WebSocket(`ws://${HOST}:3031`);

        ws.addEventListener('open', evt => {
            ws.send(JSON.stringify({type: 'hello', timestamp: Date.now(),  }));
        });

        ws.addEventListener('close', () => window.location.reload());
        ws.addEventListener('error', () => window.location.reload());

        ws.addEventListener('message', evt => {
            let data = JSON.parse(evt.data);

            if(data.type == 'hello') {
                let finalOffset = Date.now() - data.timestamp;
                timeOffset = (finalOffset - data.offset) / 2;

                this._options.onTimeOffset && this._options.onTimeOffset(timeOffset);

                console.log(timeOffset);

                clientId = data.id;
                this._options.onClientId(data.id);

                this._options.onMixerNodeCreated && this._options.onMixerNodeCreated(outNode, data.id);
            }
            else if(data.type == 'set_sources' && data.id == clientId) {
                sources.forEach(src => {
                    Object.assign(src, data.sources.find(x => x.url == src.url));
                }); 

                // Duplicated structure because screw it.
                this._options.onSourcesUpdated && this._options.onSourcesUpdated(data.sources);

                updateSources();
            }
            else if(data.type == 'timecode') {
                let now = Date.now();

                syncPacket = data;
                this._options.onSyncPacket && this._options.onSyncPacket(data);
                updateSources();
            }
        });

        let main = document.querySelector('main');

        fetch(`http://${HOST}:3030/files.json`)
            .then(r => r.json())
            .then(res => {
                return loadAllBuffers(this._context, res);
            })
            .then(srcs => {
                sources = srcs.map(src => {
                    let node = src.node = newBufferSource();

                    node.buffer = src.buffer;

                    src.panner = this._context.createStereoPanner();
                    node.connect(src.panner);

                    src.gainer = this._context.createGain();

                    src.gainer.gain.value = src.gain;

                    src.panner.connect(src.gainer);

                    src.gainer.connect(outNode);

                    return src;
                });

                ws.send({
                    type: 'get_sources',
                });

                console.log('sources loaded');
            })
            .catch(e => {
                debugger;
                console.error(e);
            });

    }
    resume() {
        this._context.resume();
    }
}

export default BufferClientBackend
