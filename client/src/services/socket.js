import { io } from "socket.io-client";
import * as Y from "yjs";

const socket = io("http://localhost:5000");

export default socket;