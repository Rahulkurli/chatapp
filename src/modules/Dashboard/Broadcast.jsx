import axios from "axios";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";

const Broadcast = ({ onSendBroadcast, openModal }) => {
  const [message, setMessage] = useState("");

  const handleSendBroadcast = () => {
    if (message.trim() !== "") {
      onSendBroadcast(message);
      setMessage("");
    }
  };

  return (
    <div className="flex gap-2">
      <textarea
        rows="1"
        placeholder="Type a broadcast message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-1.5 border-2 border-blue-300 rounded-lg bg-blue-50 focus:ring-0 outline-none"
      />
      <button
        onClick={handleSendBroadcast}
        className="p-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600"
      >
        Send
      </button>
    </div>
  );
};

export default Broadcast;
