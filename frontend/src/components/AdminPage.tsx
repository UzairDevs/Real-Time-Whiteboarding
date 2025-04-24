import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function AdminPage() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    async function getCode() {
      try {
        const res = await fetch("http://localhost:3000/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            allowDraw: true,
            recording: true,
            adminId: "admin123", // <-- replace with actual adminId if needed
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setRoomCode(data.code);
        } else {
          console.error("Error creating room:", data.msg);
        }
      } catch (error) {
        console.error("Error fetching room code:", error);
      }
    }

    getCode();
  }, []);

  return (
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
            Admin <span className="text-indigo-600 dark:text-indigo-400">Dashboard</span>
          </h1>

          <div className="space-y-4">
            <div className="p-4 rounded-lg border text-center mb-6 transition-colors">
              <p className="block text-sm font-medium mb-2 opacity-90">Room Code</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {roomCode || "Generating..."}
              </p>
            </div>

            <button
              onClick={() => navigate("/canvas", { state: { roomCode, userId: "admin123", isAdmin: true } })}
              disabled={!roomCode}
              className={`w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-300 mt-6 ${
                !roomCode && "opacity-50 cursor-not-allowed"
              }`}
            >
              Head to the Canvas
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}