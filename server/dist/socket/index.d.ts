import { Server as HttpServer } from "http";
import { Server } from "socket.io";
export declare const initSocket: (httpServer: HttpServer) => Server;
export declare const getIO: () => Server;
export declare const isUserOnline: (userId: string) => boolean;
/** All currently online user IDs */
export declare const getOnlineUsers: () => string[];
/** How many active sockets a user has (useful for debugging multi-tab) */
export declare const getUserSocketCount: (userId: string) => number;
//# sourceMappingURL=index.d.ts.map