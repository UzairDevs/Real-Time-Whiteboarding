import { useState, useRef, useEffect } from 'react';
import { 
  Stage, 
  Layer, 
  Line, 
  Rect, 
  Circle, 
  RegularPolygon, 
  Text, 
  Arrow 
} from 'react-konva';
import io, { Socket } from 'socket.io-client';
import CanvasToolbar from '../components/CanvasToolBar';

const SOCKET_URL = 'http://54.204.98.222:3000';

type Tool = 'free' | 'select' | 'rectangle' | 'circle' | 'kite' | 'text' | 'undo' | 'redo' | 'arrow' | 'eraser';

type Shape = {
  id: string;
  type: Tool;
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  color: string;
};

export default function CanvasPage() {
  const [tool, setTool] = useState<Tool>('free');
  const [color, setColor] = useState('#000000');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [history, setHistory] = useState<Shape[][]>([]);
  const [step, setStep] = useState(0);
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [textScreenPosition, setTextScreenPosition] = useState({ x: 0, y: 0 });
  const [textValue, setTextValue] = useState('');
  
  // Responsive stage size
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 50, // Subtracting toolbar height
  });
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const redrawIntervalRef = useRef<number | null>(null);
  
  const stageRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const isDrawing = useRef(false);
  const currentId = useRef<string>('');
  const textInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const roomCode = "BBB8AD";
  const userId = "aa";

  // Initialize socket
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("join-room", { roomCode, userId });
      console.log("Connected and joined room");

      socket.on('canvas: event', (event: any) => {
        console.log("Canvas event received", event);
        const { type, shape, shapeId } = event;
        
        const applyRemoteUndo = (shapeId: string) => {
          setShapes(prev => prev.filter(s => s.id !== shapeId));
        };
        
        const applyRemoteRedo = (shape: Shape) => {
          setShapes(prev => [...prev, shape]);
        };
        
        if (type === 'add') {
          setShapes(prev => {
            const updated = [...prev, shape];
            pushHistory(updated);
            return updated;
          });
        } else if (type === 'undo') {
          applyRemoteUndo(shapeId);
        } else if (type === 'redo') {
          applyRemoteRedo(shape);
        }
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  // Handle window resizing for responsive canvas
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight - 50, // Subtracting toolbar height
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Clean up when component unmounts (for recording)
  useEffect(() => {
    return () => {
      // Clear redraw interval if it exists
      if (redrawIntervalRef.current !== null) {
        clearInterval(redrawIntervalRef.current);
      }
      
      // Stop any active recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        
        // Force cleanup of tracks
        mediaRecorderRef.current.stream?.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      // Release video URL if it exists
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  
  useEffect(() => {
   
    if (isRecording && stageRef.current) {
      
      if (redrawIntervalRef.current !== null) {
        clearInterval(redrawIntervalRef.current);
      }
      
      
      redrawIntervalRef.current = window.setInterval(() => {
        if (stageRef.current) {
          const stage = stageRef.current.getStage();
          stage.batchDraw();
        }
      }, 1000/30); // 30 FPS
    } else {
      // Clear interval when not recording
      if (redrawIntervalRef.current !== null) {
        clearInterval(redrawIntervalRef.current);
        redrawIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  // Focus text input when editing starts
  useEffect(() => {
    if (isTextEditing && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isTextEditing]);

  // History management
  const pushHistory = (newShapes: Shape[]) => {
    const hist = history.slice(0, step);
    hist.push(newShapes);
    setHistory(hist);
    setStep(hist.length);
  };

  // Undo/Redo
  const handleUndo = () => {
    if (step <= 1) return;
    const prevShapes = history[step - 2];
    const removed = history[step - 1].filter(s => !prevShapes.find(p => p.id === s.id));
    setShapes(prevShapes);
    setStep(step - 1);
    if (removed[0]) socketRef.current?.emit('canvas: event', {
      roomCode,
      senderId: userId,
      eventId: `${Date.now()}-${Math.random()}`,
      type: 'undo',
      shapeId: removed[0].id
    });
  };

  const handleRedo = () => {
    if (step >= history.length) return;
    const nextShapes = history[step];
    const added = nextShapes.filter(s => !shapes.find(p => p.id === s.id));
    setShapes(nextShapes);
    setStep(step + 1);
    if (added[0]) socketRef.current?.emit('canvas: event', {
      roomCode,
      senderId: userId,
      eventId: `${Date.now()}-${Math.random()}`,
      type: 'redo',
      shape: added[0],
      shapeId: added[0].id
    });
  };

  // Text completion handler
  const handleTextComplete = () => {
    if (!textValue.trim()) {
      setIsTextEditing(false);
      return;
    }
    
    const newText: Shape = {
      id: currentId.current,
      type: 'text',
      x: textPosition.x,
      y: textPosition.y,
      text: textValue,
      color,
    };
    
    console.log("Adding text at position:", { x: textPosition.x, y: textPosition.y });
    
    setShapes(prev => {
      const updated = [...prev, newText];
      pushHistory(updated);
      
      socketRef.current?.emit('canvas: event', {
        roomCode,
        senderId: userId,
        eventId: `${Date.now()}-${Math.random()}`,
        type: 'add',
        shape: newText,
        shapeId: newText.id,
      });
      
      return updated;
    });
    
    setIsTextEditing(false);
    setTextValue('');
  };

  // Recording functions
  const startRecording = () => {
    if (!stageRef.current) {
      console.error("Stage reference not set");
      return;
    }

    // Clear previous recording data
    chunksRef.current = [];
    setVideoUrl(null);
    setIsRecording(true);

    try {
      // Get the canvas element from Konva and create a high-quality media stream
      const stage = stageRef.current.getStage();
      const canvas = stage.toCanvas({
        pixelRatio: 2, // Higher quality
        width: stage.width(),
        height: stage.height()
      });
      
      // Create a stream with higher framerate
      const stream = canvas.captureStream(60); // 60 FPS for smoother recording
      
      // Add a track listener to verify stream is working
      console.log(`Stream has ${stream.getTracks().length} tracks`);
      stream.getTracks().forEach((track: { kind: any; enabled: any; }) => {
        console.log(`Track kind: ${track.kind}, enabled: ${track.enabled}`);
      });
      
      // Setup recording with better quality
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000 // 5 Mbps for better quality
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log(`Received data chunk: ${event.data.size} bytes`);
        }
      };
      
      
      mediaRecorder.onstop = () => {
        if (chunksRef.current.length === 0) {
          console.error("No data was captured during recording");
          setIsRecording(false);
          return;
        }
        
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        console.log(`Created final blob: ${blob.size} bytes`);
        
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          console.log("Recording complete, URL created");
        } else {
          console.error("Created blob is empty");
        }
        
        setIsRecording(false);
      };
      
      // Start recording with smaller time slices for more frequent data capture
      mediaRecorder.start(100); // Capture data every 100ms
      
      console.log("Recording started with state:", mediaRecorder.state);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      console.log("Stopping recording with state:", mediaRecorderRef.current.state);
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Force cleanup if needed
      mediaRecorderRef.current.stream?.getTracks().forEach(track => {
        track.stop();
      });
      
      console.log("Recording stopped");
    }
  };

  const downloadRecording = () => {
    if (!videoUrl) return;
    
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `whiteboard-session-${new Date().toISOString()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Mouse events
  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition()!;
    currentId.current = `${Date.now()}`;

    if (tool === 'text') {
     
      const stage = stageRef.current.getStage();
      const container = stage.container();
      const containerRect = container.getBoundingClientRect();
      
      // Get pointer position in canvas coordinates
      const pos = stage.getPointerPosition();
      if (!pos) return;
      
      // Calculate absolute position within the viewport (screen coordinates)
      // This fixes the issue where text appears at wrong position
      const screenX = pos.x;
      const screenY = pos.y;
      
      console.log("Text tool: Canvas coordinates:", pos);
      console.log("Text tool: Screen coordinates for input:", { x: screenX, y: screenY });
      
      // Store canvas position for later use when creating the shape
      setTextPosition({
        x: pos.x,
        y: pos.y
      });
      
      // Store screen position for input positioning
      setTextScreenPosition({
        x: screenX,
        y: screenY
      });
      
      setIsTextEditing(true);
      setTextValue('');
      return;
    }

    if (tool === 'select') return;
    isDrawing.current = true;

    let newShape: Shape;

    if (tool === 'free' || tool === 'eraser') {
      newShape = { 
        id: currentId.current, 
        type: tool,
        points: [pos.x, pos.y],
        color: tool === 'eraser' ? '#FFFFFF' : color
      };
    } else if (tool === 'arrow') {
      newShape = {
        id: currentId.current,
        type: 'arrow',
        points: [pos.x, pos.y, pos.x + 50, pos.y],
        color
      };
    } else {
      newShape = { 
        id: currentId.current, 
        type: tool, 
        x: pos.x, 
        y: pos.y, 
        width: 0, 
        height: 0, 
        radius: 0, 
        color 
      };
    }

    setShapes(prev => {
      const updated = [...prev, newShape];
      pushHistory(updated);
      return updated;
    });
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition()!;

    setShapes(prev => prev.map(s => {
      if (s.id !== currentId.current) return s;
      
      switch (s.type) {
        case 'free':
        case 'eraser':
          return { ...s, points: [...(s.points || []), pos.x, pos.y] };
        case 'rectangle':
          return { ...s, width: pos.x - (s.x || 0), height: pos.y - (s.y || 0) };
        case 'circle':
        case 'kite': {
          const dx = pos.x - (s.x || 0);
          const dy = pos.y - (s.y || 0);
          return { ...s, radius: Math.sqrt(dx * dx + dy * dy) };
        }
        case 'arrow':
          return { ...s, points: [s.points![0], s.points![1], pos.x, pos.y] };
        default:
          return s;
      }
    }));
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    
    const shape = shapes.find(s => s.id === currentId.current);
    if (shape) {
      socketRef.current?.emit('canvas: event', {
        roomCode,
        senderId: userId,
        eventId: `${Date.now()}-${Math.random()}`,
        type: 'add',
        shape,
        shapeId: shape.id
      });
    }
  };

  // Shape rendering
  const renderShape = (s: Shape) => {
    switch (s.type) {
      case 'free':
        return <Line key={s.id} points={s.points} stroke={s.color} tension={0.5} lineCap="round" strokeWidth={5} />;
      case 'eraser':
        return <Line key={s.id} points={s.points} stroke={s.color} tension={0.5} lineCap="round" strokeWidth={20} />;
      case 'rectangle':
        return <Rect key={s.id} x={s.x} y={s.y} width={s.width} height={s.height} stroke={s.color} />;
      case 'circle':
        return <Circle key={s.id} x={s.x} y={s.y} radius={s.radius} stroke={s.color} />;
      case 'kite':
        return <RegularPolygon key={s.id} x={s.x} y={s.y} sides={4} radius={s.radius!} stroke={s.color} />;
      case 'text':
        return (
          <Text 
            key={s.id} 
            x={s.x} 
            y={s.y} 
            text={s.text} 
            fontSize={24} 
            fill={s.color} 
            align="center"
            verticalAlign="middle"
          />
        );
      case 'arrow':
        return (
          <Arrow
            key={s.id}
            points={s.points || []}
            stroke={s.color}
            fill={s.color}
            pointerLength={10}
            pointerWidth={10}
          />
        );
      default:
        return null;
    }
  };

  // Tool change handler
  const handleToolChange = (newTool: Tool) => {
    if (newTool === 'undo') {
      handleUndo();
      return;
    }
    if (newTool === 'redo') {
      handleRedo();
      return;
    }
    setTool(newTool);
  };

  return (
    <div className="flex flex-col h-screen" ref={containerRef}>
      <CanvasToolbar
        activeTool={tool}
        onToolChange={handleToolChange}
        color={color}
        onColorChange={setColor}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        canDownload={!!videoUrl}
        onDownloadRecording={downloadRecording}
      />
      
      <div className="flex-1 relative">
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          ref={stageRef}
        >
          <Layer>
            {shapes.map(renderShape)}
          </Layer>
        </Stage>
        
        {/* Text input overlay */}
        {isTextEditing && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 20
            }}
          >
            <input
              ref={textInputRef}
              type="text"
              value={textValue}
              style={{
                position: 'absolute',
                left: `${textPosition.x}px`,
                top: `${textPosition.y}px`,
                width: 'auto',
                minWidth: '100px',
                fontSize: '24px',
                border: '1px dashed ' + color,
                outline: 'none',
                background: 'rgba(255, 255, 255, 0.7)',
                color: color,
                fontFamily: 'Arial, sans-serif',
                transform: 'translate(-50%, -50%)',
                padding: '2px 8px',
                textAlign: 'center',
                pointerEvents: 'auto',
                zIndex: 100,
              }}
              placeholder="Type here..."
              onChange={(e) => setTextValue(e.target.value)}
              onBlur={handleTextComplete}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTextComplete();
                } else if (e.key === 'Escape') {
                  setIsTextEditing(false);
                  setTextValue('');
                }
              }}
            />
          </div>
        )}
        
        {/* Video preview for completed recordings */}
        {videoUrl && !isRecording && (
          <div className="fixed bottom-4 right-4 bg-black rounded-lg overflow-hidden shadow-xl">
            <div className="bg-gray-800 text-white text-xs px-2 py-1 flex justify-between">
              <span>Recording Preview</span>
              {!videoUrl.startsWith('blob:') && (
                <span className="text-red-300">Invalid video URL</span>
              )}
            </div>
            <video 
              src={videoUrl} 
              controls 
              autoPlay
              playsInline
              style={{ width: '320px', height: '180px' }}
              onError={(e) => console.error("Video error:", e)}
            />
          </div>
        )}
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="fixed top-16 right-4 bg-red-600 text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            Recording...
          </div>
        )}
      </div>
    </div>
  );
}