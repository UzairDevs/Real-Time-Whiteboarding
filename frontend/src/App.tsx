import { BrowserRouter, Route, Routes } from 'react-router-dom'
import RoomJoin from './components/RoomJoin'
import HomePage from './components/HomePage'
import { ThemeProvider } from "./context/ThemeContext"
import ProtectedRoute from './components/ProtectedRoute'
import CanvasPage from './pages/CanvasPage'
import AdminPage from './components/AdminPage'
function App() {

  return (
    <>
    <ThemeProvider >
     <BrowserRouter>
     <Routes>
      <Route path="/" element={<HomePage/>} />
      <Route  path="/room-join" element={<RoomJoin />}/>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/canvas" element= { 
        <ProtectedRoute>
      <CanvasPage />
      </ProtectedRoute>} />
     </Routes>
     </BrowserRouter>
     </ThemeProvider>
    </>
  )
}

export default App
