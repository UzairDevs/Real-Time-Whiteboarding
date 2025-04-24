import { Canvas } from "@react-three/fiber"
import { OrbitControls, Float, Environment } from "@react-three/drei"
import { useState, useRef, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { Sun, Moon } from "lucide-react"
import { useNavigate } from "react-router-dom"


const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Float speed={1.5} rotationIntensity={1} floatIntensity={1}>
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <torusKnotGeometry args={[1, 0.3, 128, 32]} />
          <meshStandardMaterial color="#6366f1" metalness={0.5} roughness={0.3} />
        </mesh>
      </Float>
      <Environment preset="studio" />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </>
  )
}

const HomePage = () => {
    const navigate = useNavigate() 
  const { theme, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
    <div
      className={`min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-[#232329] text-white" : "bg-gray-50 text-gray-900"}`}
    >
      {/* Header */}
      <header
        className={`fixed w-full transition-all duration-300 z-10 ${scrolled ? "py-2 bg-opacity-90 backdrop-blur-sm" : "py-4"} ${theme === "dark" ? "bg-[#232329]" : "bg-white"}`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="font-bold text-xl">
            <span className="text-indigo-600 dark:text-indigo-400">Collab</span>Board
          </div>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${theme === "dark" ? "bg-gray-700 text-yellow-300" : "bg-gray-200 text-gray-700"}`}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
          <div className="z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Collaborate in <span className="text-indigo-600 dark:text-indigo-400">Real-Time</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              A powerful whiteboarding platform that brings teams together, no matter where they are.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/room-join")}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-300 text-center"
              >
                Get Started
              </button>
              <button
    onClick={() => navigate("/admin")}
    className={`px-8 py-3 rounded-lg font-medium transition-colors duration-300 text-center ${theme === "dark" ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-900"}`}
  >
    Collaborate
  </button>
            </div>
          </div>
          <div ref={canvasRef} className="h-[400px] md:h-[500px]">
            <Canvas>
              <Scene />
            </Canvas>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-20 ${theme === "dark" ? "bg-[#1e1e23]" : "bg-white"}`}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="text-indigo-600 dark:text-indigo-400">Features</span> That Empower Collaboration
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Real-Time Collaboration",
                description: "Work together with your team in real-time, seeing changes as they happen.",
              },
              {
                title: "Intuitive Interface",
                description: "Easy-to-use tools that make whiteboarding simple and effective.",
              },
              {
                title: "Cross-Platform",
                description: "Access your whiteboards from any device, anywhere, anytime.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl transition-all duration-300 ${theme === "dark" ? "bg-[#2a2a31] hover:bg-[#32323a]" : "bg-gray-100 hover:bg-gray-200"}`}
              >
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="opacity-80">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 ${theme === "dark" ? "bg-[#1a1a1f] text-gray-400" : "bg-gray-100 text-gray-600"}`}>
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} CollabBoard. All rights reserved.</p>
        </div>
      </footer>
    </div>
    </>
  )
}

export default HomePage
