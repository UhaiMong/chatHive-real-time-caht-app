import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket)
    throw new Error("Socket not initialized. Call initSocket first.");
  return socket;
};

export const initSocket = (token: string): Socket => {
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
