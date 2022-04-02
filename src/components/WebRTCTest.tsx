import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Peer} from "../helpers/Peer";
import {servers} from "./stunServers";
import {stunChecker} from "./stunChecker";



export const WebRTCTest: React.FC = () => {
  const [sdp, setSdp] = useState('');
  const [err, setErr] = useState<Error | null >(null)

  useEffect(() => {
    servers.map((v) => stunChecker(v).then(console.log))
  }, [])

  const peer = useMemo(() => {
    const p = new Peer({});
    p.on('error', (e) => {
      console.error(e)
      setErr(e)
    })
    return p.on('message', console.log)
  }, [])

  const startHost = useCallback( () => {
    peer.getSignal().then(sdp => console.log(JSON.stringify(sdp)))
  }, [peer]);
  const startClient = useCallback(async () => {
    await peer.setSignal(JSON.parse(sdp))
    peer.on('open', console.log)
    console.log('send message for', sdp)
    peer.sendMessage('Hey from client')
  }, [peer, sdp]);

  return <div>
    {err && <div>{err.message}</div>}

    <button onClick={startHost}>Host</button>
    <br />
    <input onChange={e => setSdp(e.target.value)} value={sdp}/><button onClick={startClient}>Client</button>
  </div>;
}
