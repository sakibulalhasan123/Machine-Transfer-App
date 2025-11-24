// import { io } from "socket.io-client";

// export const socket = io(
//   process.env.REACT_APP_API_URL || "http://localhost:5000",
//   {
//     autoConnect: true,
//   }
// );
import { io } from "socket.io-client";

export const socket = io(
  process.env.REACT_APP_API_URL || "http://localhost:5000",
  {
    autoConnect: true,
    auth: {
      token: localStorage.getItem("token"), // ★★★ এখানে token পাঠানো লাগবেই
    },
  }
);
