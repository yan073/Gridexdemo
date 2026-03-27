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
  let folder = '';
  if (stage === 'raw') {
    title = 'Raw Audio Spectrogram';
    folder = 'spectrogram';
  } else  if (stage === 'segmented') {
    title = '4x4 Segmented Grid';
    folder = 'grid';
  } else if (stage === 'highlighted') {
    title = 'Detected Spoof Regions (x, y, z)';
    folder = 'selected_grid';
  } else if (stage === 'mask') {
    title = 'Detected Spoof Regions on Mask';
    folder = 'mask';
  }

  if (selectedFile) {
    return (
      <div className="inline-block">
        <div className="mb-2">
          <h3 className="text-sm font-bold text-gray-700">{title}</h3>
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