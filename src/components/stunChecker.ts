export interface Rs {
  myIpAddress: string | null,
  stun: string,
  ipv6Supported: boolean,
  errors: Error[]
}

export function stunChecker(address: string, _timeout = 6000){
  let response: Rs = {
    myIpAddress: "",
    stun: address,
    ipv6Supported: true,
    errors: []
  };

  let checker = new Promise<Rs>((resolve, reject) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        {urls: `stun:${address}?transport=udp`}
      ]
    });

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;

      // If a srflx candidate was found, notify that the STUN server works and provide the IP
      if(e.candidate.type == "srflx"){
        response.myIpAddress = e.candidate.address;
        pc.close();
      }
    };

    // Log errors:
    // Remember that in most of the cases, even if its working, you will find a STUN host lookup received error
    // Chrome tried to look up the IPv6 DNS record for server and got an error in that process. However, it may still be accessible through the IPv4 address
    pc.onicecandidateerror = (e: any) => {
      if(e.address == "[0:0:0:x:x:x:x:x]"){
        response.ipv6Supported = false;
      }

      response.errors.push(e);
    };

    const dc = pc.createDataChannel('ourcodeworld-rocks');
    pc.createOffer().then(offer => pc.setLocalDescription(offer));

    dc.onclose = function (e) {
      resolve(response);
    };
  });

  let timeout = new Promise<void>(function(resolve, reject){
    setTimeout(function() {
      reject(response);
    }, _timeout);
  });

  return Promise.race([checker, timeout]);
}
