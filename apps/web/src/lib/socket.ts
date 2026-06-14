"use client";

import { io, type Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket(token: string | null): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: false,
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });
  } else {
    socket.auth = { token };
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
