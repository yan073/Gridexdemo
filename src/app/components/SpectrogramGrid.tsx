interface SpectrogramGridProps {
  stage?: 'none' | 'raw' | 'segmented' | 'highlighted' | 'mask';
  selectedFile?: { id: string; filename: string; spec: string };
}

export function SpectrogramGrid({ stage = 'none', selectedFile }: SpectrogramGridProps) {
  if (stage === 'none') {
    return (
      <div className="w-80 h-80 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <p className="text-gray-400 text-sm">Select audio to view spectrogram</p>
      </div>
    );
  }

  if (stage === 'raw' && selectedFile) {
    return (
      <div className="inline-block">
        <div className="mb-2">
          <h3 className="text-sm font-bold text-gray-700">Raw Audio Spectrogram</h3>
        </div>
        <img
          src={`/spectrogram/${selectedFile.spec}`}
          alt="Spectrogram"
          className="w-80 h-80 object-cover border-2 border-black"
        />
      </div>
    );
  }

  // Determine title based on stage
  let title = '';
  if (stage === 'segmented') {
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
      {/* Title */}
      <div className="mb-2">
        <h3 className="text-sm font-bold text-gray-700">{title}</h3>
      </div>
      
      {/* Spectrogram Grid */}
      <div className="border-2 border-black">
        <div className="grid grid-cols-4 gap-0">
          {gridCells.map((row, rowIndex) => (
            row.map((cell, colIndex) => {
              let backgroundColor = 'bg-white';
              let showLabel = false;
              
              // Segmented stage: grid visible but no highlights
              if (stage === 'segmented') {
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