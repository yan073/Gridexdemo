import { Play } from "lucide-react";

interface SpectrogramGridProps {
  stage?: 'none' | 'raw' | 'segmented' | 'highlighted' | 'mask';
}

export function SpectrogramGrid({ stage = 'none' }: SpectrogramGridProps) {
  if (stage === 'none') {
    return (
      <div className="w-80 h-80 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <p className="text-gray-400 text-sm">Select audio to view spectrogram</p>
      </div>
    );
  }

  // Determine title based on stage
  let title = '';
  if (stage === 'raw') {
    title = 'Raw Audio Spectrogram';
  } else if (stage === 'segmented') {
    title = '4x4 Segmented Grid';
  } else if (stage === 'highlighted') {
    title = 'Detected Spoof Regions (x, y, z)';
  } else if (stage === 'mask') {
    title = 'Detected Spoof Regions on Mask';
  }

  // 4x4 grid with regions x, y, z highlighted
  const gridCells = [
    ['', '', '', ''],
    ['', 'x', '', ''],
    ['', '', 'y', ''],
    ['', '', '', 'z']
  ];

  return (
    <div className="inline-block">
      {/* Title with Play Button */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">{title}</h3>
        {stage === 'mask' && (
          <button 
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            onClick={() => {
              // Audio playback functionality will be implemented
              console.log('Play audio');
            }}
          >
            <Play className="size-4" fill="currentColor" />
            Play Audio
          </button>
        )}
      </div>
      
      {/* Spectrogram Grid */}
      <div className="border-2 border-black">
        <div className="grid grid-cols-4 gap-0">
          {gridCells.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              let backgroundColor = 'bg-white';
              let showLabel = false;
              
              // Raw stage: solid color, no grid lines visible
              if (stage === 'raw') {
                backgroundColor = 'bg-blue-100';
              }
              // Segmented stage: grid visible but no highlights
              else if (stage === 'segmented') {
                backgroundColor = 'bg-white';
              }
              // Highlighted stage: regions x, y, z are highlighted
              else if (stage === 'highlighted') {
                backgroundColor = cell ? 'bg-yellow-200' : 'bg-gray-200';
                showLabel = true;
              }
              // Mask stage: regions x, y, z are masked
              else if (stage === 'mask') {
                backgroundColor = cell ? 'bg-red-200' : 'bg-gray-200';
                showLabel = true;
              }

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-20 h-20 ${stage === 'raw' ? 'border-0' : 'border border-gray-300'} flex items-center justify-center text-lg font-bold ${backgroundColor}`}
                >
                  {showLabel ? cell : ''}
                </div>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
}