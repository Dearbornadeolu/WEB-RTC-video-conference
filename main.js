
let APP_ID = "your APP ID"

let token = null
let uid = String(Math.floor(Math.random()* 10000))
console.log(uid);
let client;
let channel;

let localStream;
let remoteStream;
let peerConnection;

const servers={
    iceServers : [
        {
            urls:['stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302']
        }
    ]
}

let init = async ()=>{

    client = await AgoraRTM.createInstance(APP_ID)
    await client.login({uid, token})

    channel= client.createChannel('main')
    await channel.join()

    channel.on('MemberJoined', handleUserJoined)
    client.on('MessageFromPeer', handleMessageFromPeer)

    localStream = await navigator.mediaDevices.getUserMedia({video: true, audio:false})
    document.getElementById('user-1').srcObject = localStream
    createOffer()
}


let handleMessageFromPeer = async (message, MemberId) => {
    console.log(message.text);
    message = JSON.parse(message.text)


}

let handleUserJoined = async (MemberId)=>{
    console.log("A new Member Has Join:", MemberId)
    createOffer(MemberId)
}

let createOffer = async (MemberId)=>{
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream

    if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio:false})
    document.getElementById('user-1').srcObject = localStream
    }

    localStream.getTracks().forEach((track)=>{
        peerConnection.addTrack(track,localStream)
    })

    peerConnection.ontrack = (event)=>{
        event.streams[0].getTracks().forEach((track)=>{
            remoteStream.addTrack(track)
        })
    }


    peerConnection.onicecandidate = async (event)=>{
        if(event.candidate){
            client.sendMessageToPeer({text: JSON.stringify({'type':'candidate', 'candidate':event.candidate})}, MemberId)
        }
    }

    let offer = await peerConnection.createOffer()
    await  peerConnection.setLocalDescription(offer)

    client.sendMessageToPeer({text: JSON.stringify({'type':'offer', 'offer':offer})}, MemberId)
}

init()