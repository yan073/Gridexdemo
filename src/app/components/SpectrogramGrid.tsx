import { Play } from "lucide-react";

interface SpectrogramGridProps {
  stage?: 'none' | 'raw' | 'segmented' | 'highlighted' | 'mask';
  selectedFile?: { id: string; filename: string; spec: string; regions: Array<{id: number}>; audio: string };
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
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">Raw Audio Spectrogram</h3>
          <button 
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            onClick={() => {
              if (!selectedFile?.audio) {
                console.warn('No audio file available to play');
                return;
              }
              const audio = new Audio(`/audio/${selectedFile.audio}`);
              audio.play().catch((error) => {
                console.error('Play audio failed:', error);
              });
            }}
          >
            <Play className="size-4" fill="currentColor" />
            Play Audio
          </button>
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
  let folder = '';
  if (stage === 'raw') {
    title = 'Raw Audio Spectrogram';
    folder = 'spectrogram';
  } else  if (stage === 'segmented') {
    title = '4x4 Segmented Grid';
    folder = 'grid';
  } else if (stage === 'highlighted') {
    const regionIds = selectedFile?.regions?.map((r) => r.id).join(', ') || 'x, y, z';
    title = `Detected Spoof Regions (${regionIds})`;
    folder = 'selected_grid';
  } else if (stage === 'mask') {
    title = 'Detected Spoof Regions on Mask';
    folder = 'mask';
  }

  if (selectedFile) {
    return (
      <div className="inline-block">
      {/* Title with Play Button */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">{title}</h3>
        { selectedFile && (
          <button 
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            onClick={() => {
              if (!selectedFile?.audio) {
                console.warn('No audio file available to play');
                return;
              }
              const audio = new Audio(`/audio/${selectedFile.audio}`);
              audio.play().catch((error) => {
                console.error('Play audio failed:', error);
              });
            }}
          >
            <Play className="size-4" fill="currentColor" />
            Play Audio
          </button>
        )}
      </div>

        <img
          src={`/${folder}/${selectedFile.spec}`}
          alt="Spectrogram"
          className="w-80 h-80 object-cover border-2 border-black"
        />
      </div>
    );
  }

}