import {EventEmitter} from "./EventEmitter";

export interface PeerConfig {
  channelName: string
}

export interface PeerEvents {
  open: (e: Event) => void
  close: (e: Event) => void
  message: (e: MessageEvent) => void
  error: (err: IceCandidateError) => void
}

export class IceCandidateError extends Error {
  constructor(message: string, public address: string, public errorCode: number, public port: number, public url: string) {
    super(message);
  }
}

export class Peer extends EventEmitter<PeerEvents> {
  private peer: RTCPeerConnection;
  private dataChannel: RTCDataChannel | null = null;
  private dataChannelReady: boolean = false
  private config: PeerConfig = {
    channelName: "default"
  };

  constructor(config?: Partial<PeerConfig>) {
    super();
    this.config = {
      ...this.config,
      ...config
    }
    this.peer = new RTCPeerConnection({
      iceServers: [{
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302',
          'stun:stun.nova.is:3478'
        ]
      }, {
        urls: 'stun:stun.anyfirewall.com:3478'
      }, {
        urls: 'turn:turn.bistri.com:80',
        credential: 'homeo',
        username: 'homeo'
      }, {
        urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
        credential: 'webrtc',
        username: 'webrtc'
      }],
    });

    this.peer.addEventListener('track', (...args) => console.log('track', JSON.stringify(args)))
    this.peer.addEventListener('connectionstatechange', (...args) => console.log('connectionstatechange', JSON.stringify(args), this.peer.signalingState, this.peer.connectionState))
    this.peer.addEventListener('icecandidate', (...args) => console.log('icecandidate', JSON.stringify(args)))
    this.peer.addEventListener('icecandidateerror', (e) => {
      // @ts-ignore
      this.emit('error', new IceCandidateError(e.errorText, e.address, e.errorCode, e.port, e.url))
    })
    this.peer.addEventListener('iceconnectionstatechange', (...args) => console.log('iceconnectionstatechange', JSON.stringify(args)))
    this.peer.addEventListener('negotiationneeded', (...args) => console.log('negotiationneeded', JSON.stringify(args)))
    this.peer.addEventListener('signalingstatechange', (...args) => {
      this.peer.getStats().then(stats => {
        stats.forEach(report => {
          Object.keys(report).forEach(statName => {
            console.log(statName, report[statName])
          });
        })
      });
      console.log('signalingstatechange', JSON.stringify(args), this.peer.signalingState, this.peer.connectionState)
    })

    this.peer.addEventListener('icegatheringstatechange', (...args) => console.log('icegatheringstatechange', JSON.stringify(args)))
  }

  async getSignal() {
    this.dataChannel = this.configureDataChannel(this.peer.createDataChannel(this.config.channelName))
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    return offer;
  }

  async setSignal(sdp: RTCSessionDescription) {
    console.log(sdp);
    const rsd = new RTCSessionDescription(sdp);
    this.peer.addEventListener('datachannel',
      (e) => {
        console.log(e)
        this.dataChannel = this.configureDataChannel(e.channel)
      }
    )
    await this.peer.setRemoteDescription(rsd);
    const answer = await this.peer.createAnswer();
    return this.peer.setLocalDescription(answer);
  }

  sendMessage(message: string) {
    if (!this.dataChannel || !this.dataChannelReady) {
      return;
    }
    this.dataChannel.send(message)
  }

  private configureDataChannel(dataChannel: RTCDataChannel): RTCDataChannel {
    dataChannel.addEventListener('open', (e) => {
      this.dataChannelReady = true
      this.emit('open', e)
    })
    dataChannel.addEventListener('close', (e) => {
      this.dataChannelReady = false
      this.emit('close', e)
    })
    dataChannel.addEventListener('message', (e) => {
      this.emit('message', e)
    })
    return dataChannel;
  }
}
