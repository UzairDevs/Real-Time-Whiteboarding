import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useTheme } from "../context/ThemeContext";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ServerToClientEvents {
  "room-config": (config: any) => void;
  "join-error": (error: string) => void; // Add error event
}

interface ClientToServerEvents {
  "join-room": (data: { roomCode: string; userId: string }) => void;
}

const RoomJoin = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const socketConnection: Socket<ServerToClientEvents, ClientToServerEvents> = io("http://54.204.98.222:3000");
    setSocket(socketConnection);

    socketConnection.on("connect", () => {
      console.log("Connected to Websocket with Id:", socketConnection.id);
    });

    socketConnection.on("room-config", (config) => {
      console.log("Received room config:", config);
    });

    // Handle socket errors
    socketConnection.on("join-error", (error) => {
      setIsSubmitting(false);
      setErrorMessage(error);
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const clearErrors = () => {
    setErrorMessage("");
  };

  async function handleClick() {
    clearErrors();
    setIsSubmitting(true);

    if (!socket) {
      setErrorMessage("Connection error. Please refresh the page.");
      setIsSubmitting(false);
      return;
    }

    if (!userId || !roomCode) {
      setErrorMessage("Please fill in both Room Code and Your Name.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`http://54.204.98.222:3000/rooms/${roomCode}`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.msg || "Failed to join room");
      }

      const roomData = await res.json();
      socket.emit("join-room", { roomCode, userId });
      navigate("/canvas", { state: { roomCode, userId, roomData } });
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div
        className={`min-h-screen flex flex-col transition-colors duration-300 ${theme === "dark" ? "bg-[#232329] text-white" : "bg-gray-50 text-gray-900"}`}
      >
        <header className="p-4">
          <div className="container mx-auto flex justify-between items-center">
            <button
              onClick={() => navigate("/")}
              className={`p-2 rounded-full transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${theme === "dark" ? "bg-gray-700 text-yellow-300" : "bg-gray-200 text-gray-700"}`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md p-8 rounded-xl shadow-lg transition-colors ${theme === "dark" ? "bg-[#2a2a31]" : "bg-white"}`}
          >
            <h1 className="text-2xl font-bold mb-6 text-center">
              Join <span className="text-indigo-600 dark:text-indigo-400">Whiteboard</span> Room
            </h1>

            {/* Error Message */}
            {errorMessage && (
              <div className={`mb-4 p-3 rounded-lg ${theme === "dark" ? "bg-red-900/50 text-red-200" : "bg-red-100 text-red-800"}`}>
                {errorMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="roomCode" className="block text-sm font-medium mb-1 opacity-90">
                  Room Code
                </label>
                <input
                  id="roomCode"
                  type="text"
                  placeholder="Enter the room code"
                  value={roomCode}
                  onChange={(e) => {
                    clearErrors();
                    setRoomCode(e.target.value);
                  }}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:outline-none transition-colors ${
                    theme === "dark"
                      ? "bg-[#32323a] border-gray-700 focus:ring-indigo-500/50"
                      : "bg-white border-gray-300 focus:ring-indigo-500/30"
                  }`}
                />
              </div>

              <div>
                <label htmlFor="userId" className="block text-sm font-medium mb-1 opacity-90">
                  Your Name
                </label>
                <input
                  id="userId"
                  type="text"
                  placeholder="Enter your name"
                  value={userId}
                  onChange={(e) => {
                    clearErrors();
                    setUserId(e.target.value);
                  }}
                  className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:outline-none transition-colors ${
                    theme === "dark"
                      ? "bg-[#32323a] border-gray-700 focus:ring-indigo-500/50"
                      : "bg-white border-gray-300 focus:ring-indigo-500/30"
                  }`}
                />
              </div>

              <button
                onClick={handleClick}
                disabled={isSubmitting}
                className={`w-full py-3 text-white rounded-lg font-medium transition-colors duration-300 mt-6 ${
                  isSubmitting 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isSubmitting ? "Joining..." : "Join The Room"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default RoomJoin;