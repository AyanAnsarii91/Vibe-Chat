import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { useChat } from '../../context/ChatContext';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from 'react-icons/fi';
import './VideoCall.css';

const VideoCall = ({ isVideo, callWith, onClose }) => {
  const { socket, user } = useChat();
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    // Get user media (audio and/or video)
    const getMedia = async () => {
      try {
        const constraints = {
          video: isVideo,
          audio: true
        };
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        
        if (myVideo.current) {
          myVideo.current.srcObject = mediaStream;
        }
        
        // If we're initiating the call
        if (callWith) {
          callUser(callWith.id);
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        alert("Could not access camera or microphone. Please check your permissions.");
        onClose();
      }
    };
    
    getMedia();
    
    // Set up socket listeners for incoming calls
    socket.on('webrtc_offer', (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });
    
    socket.on('webrtc_answer', (data) => {
      setCallAccepted(true);
      connectionRef.current.signal(data.signal);
    });
    
    socket.on('webrtc_ice_candidate', (data) => {
      if (connectionRef.current) {
        connectionRef.current.signal(data.signal);
      }
    });
    
    // Clean up on component unmount
    return () => {
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
    };
  }, []);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    });
    
    peer.on('signal', (data) => {
      socket.emit('webrtc_offer', {
        signal: data,
        from: socket.id,
        to: id
      });
    });
    
    peer.on('stream', (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });
    
    socket.on('webrtc_answer', (data) => {
      setCallAccepted(true);
      peer.signal(data.signal);
    });
    
    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    });
    
    peer.on('signal', (data) => {
      socket.emit('webrtc_answer', {
        signal: data,
        from: socket.id,
        to: caller
      });
    });
    
    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });
    
    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream && isVideo) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    setCallEnded(true);
    
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    onClose();
  };

  return (
    <div className="video-call-container">
      <div className="video-grid">
        {stream && (
          <div className="video-item local-video">
            <video 
              playsInline 
              muted 
              ref={myVideo} 
              autoPlay 
              style={{ transform: 'scaleX(-1)' }} 
            />
            <div className="video-name">{user.username} (You)</div>
          </div>
        )}
        
        {callAccepted && !callEnded && (
          <div className="video-item remote-video">
            <video playsInline ref={userVideo} autoPlay />
            <div className="video-name">{callWith ? callWith.username : 'Caller'}</div>
          </div>
        )}
      </div>
      
      {receivingCall && !callAccepted && (
        <div className="call-notification">
          <h3>Incoming {isVideo ? 'Video' : 'Voice'} Call</h3>
          <div className="call-buttons">
            <button className="answer-btn" onClick={answerCall}>Answer</button>
            <button className="decline-btn" onClick={endCall}>Decline</button>
          </div>
        </div>
      )}
      
      <div className="call-controls">
        <button className={`control-btn ${isMuted ? 'off' : ''}`} onClick={toggleMute}>
          {isMuted ? <FiMicOff /> : <FiMic />}
        </button>
        
        {isVideo && (
          <button className={`control-btn ${isVideoOff ? 'off' : ''}`} onClick={toggleVideo}>
            {isVideoOff ? <FiVideoOff /> : <FiVideo />}
          </button>
        )}
        
        <button className="control-btn end-call" onClick={endCall}>
          <FiPhoneOff />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
