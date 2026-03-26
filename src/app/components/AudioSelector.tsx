import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";

interface AudioSelectorProps {
  onAudioSelect: () => void;
  onConvert: () => void;
  selectedAudio: string;
  onAudioChange: (value: string) => void;
}

export function AudioSelector({ onAudioSelect, onConvert, selectedAudio, onAudioChange }: AudioSelectorProps) {
  return (
    <div className="flex gap-3 justify-end items-center">
      <div className="relative">
        <select 
          className="appearance-none bg-white border-2 border-black rounded-lg px-4 py-2 pr-10 text-sm cursor-pointer hover:bg-gray-50"
          value={selectedAudio}
          onChange={(e) => {
            onAudioChange(e.target.value);
            if (e.target.value !== "") {
              onAudioSelect();
            }
          }}
        >
          <option value="">Select audio...</option>
          <option value="audio1">sample_audio_001.wav</option>
          <option value="audio2">sample_audio_002.wav</option>
          <option value="audio3">sample_audio_003.wav</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none" />
      </div>
      <Button 
        className="bg-white border-2 border-black text-black hover:bg-gray-100 px-6 rounded-lg"
        onClick={onConvert}
      >
        Convert
      </Button>
    </div>
  );
}