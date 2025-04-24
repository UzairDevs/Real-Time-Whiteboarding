type Tool = 'free' | 'select' | 'rectangle' | 'circle' | 'kite' | 'text' | 'undo' | 'redo' | 'arrow'| 'eraser';

interface Props {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  color: string;
  onColorChange: (color: string) => void;
  // Add the missing props that are being passed from CanvasPage
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  canDownload: boolean;
  onDownloadRecording: () => void;
}

const tools: { label: string; tool: Tool }[] = [
  { label: 'Draw', tool: 'free' },
  { label: 'Rect', tool: 'rectangle' },
  { label: 'Circle', tool: 'circle' },
  { label: 'Kite', tool: 'kite' },
  { label: 'Text', tool: 'text' },
  { label: 'Undo', tool: 'undo' },
  { label: 'Redo', tool: 'redo' },
  { label: 'Arrow', tool: 'arrow'},
  {label : 'Eraser', tool: 'eraser'}
];

export default function CanvasToolbar({ 
  activeTool, 
  onToolChange, 
  color, 
  onColorChange,
  isRecording,
  onStartRecording,
  onStopRecording,
  canDownload,
  onDownloadRecording
}: Props) {
  return (
    <div className="flex gap-2 p-2 bg-gray-100 border-b">
      {tools.map(({ label, tool }) => (
        <button
          key={tool}
          className={`px-3 py-1 rounded ${activeTool === tool ? 'bg-blue-600 text-white' : 'bg-white'}`}
          onClick={() => onToolChange(tool)}
        >
          {label}
        </button>
      ))}
      <input
        type="color"
        value={color}
        onChange={e => onColorChange(e.target.value)}
        className="ml-4 w-10 h-8 p-0 border-none"
      />
      <div className="ml-auto flex gap-2">
        {!isRecording ? (
          <button 
            className="px-3 py-1 rounded bg-red-600 text-white"
            onClick={onStartRecording}
          >
            Start Recording
          </button>
        ) : (
          <button 
            className="px-3 py-1 rounded bg-gray-600 text-white"
            onClick={onStopRecording}
          >
            Stop Recording
          </button>
        )}
        {canDownload && (
          <button 
            className="px-3 py-1 rounded bg-green-600 text-white"
            onClick={onDownloadRecording}
          >
            Download
          </button>
        )}
      </div>
    </div>
  );
}