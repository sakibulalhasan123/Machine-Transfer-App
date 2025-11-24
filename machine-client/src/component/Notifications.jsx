import { useEffect, useState } from "react";
import { socket } from "../socket";
import axios from "axios";
import jwt_decode from "jwt-decode";

// Helper function to extract userId from JWT token
function getUserIdFromToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt_decode(token);
    return decoded.id; // assuming token payload has { id: "...", ... }
  } catch (error) {
    console.error("Invalid token", error);
    return null;
  }
}

export default function useNotifications(authToken) {
  const [notifications, setNotifications] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    if (!authToken) return;

    socket.auth = { token: authToken };
    socket.connect();

    socket.on("connect", () => console.log("Socket connected:", socket.id));

    // Receive all notifications initially
    socket.on("allNotifications", (items) => {
      setNotifications(items);
      const userId = getUserIdFromToken(authToken);
      const unseen = items.filter(
        (n) => !n.seenBy?.map(String).includes(userId)
      ).length;
      setUnseenCount(unseen);
    });

    // Real-time new notification
    socket.on("newNotification", (n) => {
      setNotifications((prev) => [n, ...prev]);
      setUnseenCount((c) => c + 1);
    });

    // When someone marks a notification as seen
    socket.on("notificationSeen", ({ notificationId, userId }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId
            ? { ...n, seenBy: [...(n.seenBy || []), userId] }
            : n
        )
      );
    });
    socket.on("allNotificationsSeen", ({ userId }) => {
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          seenBy: [...new Set([...(n.seenBy || []), userId])],
        }))
      );
    });

    return () => {
      socket.off("allNotifications");
      socket.off("newNotification");
      socket.off("notificationSeen");
      socket.off("allNotificationsSeen");
      socket.disconnect();
    };
  }, [authToken]);

  // Fetch paged notifications from backend
  const fetchPaged = async (page = 1, limit = 20) => {
    const res = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/notifications?page=${page}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return res.data;
  };

  // Mark a single notification as seen
  const markSeen = async (id) => {
    await axios.patch(
      `${process.env.REACT_APP_API_URL}/api/notifications/seen/${id}`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    const userId = getUserIdFromToken(authToken);

    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id ? { ...n, seenBy: [...(n.seenBy || []), userId] } : n
      )
    );
    setUnseenCount((c) => Math.max(0, c - 1));
  };
  const markAllSeen = async () => {
    await axios.patch(
      `${process.env.REACT_APP_API_URL}/api/notifications/seen-all`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    const userId = getUserIdFromToken(authToken);

    // update frontend list
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        seenBy: [...new Set([...(n.seenBy || []), userId])],
      }))
    );

    setUnseenCount(0);
  };

  return { notifications, unseenCount, fetchPaged, markSeen, markAllSeen };
}
