import { Header } from "./components/Header";
import { Breadcrumb } from "./components/Breadcrumb";
import { AudioSelector } from "./components/AudioSelector";
import { ChatMessage } from "./components/ChatMessage";
import { RobotMessage } from "./components/RobotMessage";
import { SystemMessage } from "./components/SystemMessage";
import { FeatureBreakdown } from "./components/FeatureBreakdown";
import { SpectrogramGrid } from "./components/SpectrogramGrid";
import { useState } from "react";

export default function App() {
  const [spectrogramStage, setSpectrogramStage] = useState<'none' | 'raw' | 'segmented' | 'highlighted' | 'mask'>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUserPrompt1, setShowUserPrompt1] = useState(false);
  const [showVLMOutput1, setShowVLMOutput1] = useState(false);
  const [showVLMThinking1, setShowVLMThinking1] = useState(false);
  const [showUserPrompt2, setShowUserPrompt2] = useState(false);
  const [showVLMOutput2, setShowVLMOutput2] = useState(false);
  const [showVLMThinking2, setShowVLMThinking2] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState('');

  const files_data = [
    { id: "1", filename: "hifigan_LA_D_1119156", spec: "hifigan.png", regions:[11,13,15] },
    { id: "2", filename: "hn-sinc-nsf-hifi_LA_T_3725354", spec: "hn-sinc-nsf-hifi.png", regions:[3,10,13] },
    { id: "3", filename: "hn-sinc-nsf_LA_T_3965355", spec: "hn-sinc-nsf.png", regions:[3,12,13] },
    { id: "4", filename: "waveglow_LA_D_2407623", spec: "waveglow.png", regions:[4,9,13] }
  ];

  const selectedFileObj = files_data.find((f) => f.filename === selectedAudio);

  const handleAudioSelect = () => {
    setSpectrogramStage('raw');
  };

  const handleConvert = () => {
    // Show user prompt 1 immediately
    setShowUserPrompt1(true);
    
    // Start processing
    setIsProcessing(true);
    setSpectrogramStage('segmented');
    
    // Show VLM thinking indicator
    setTimeout(() => {
      setShowVLMThinking1(true);
    }, 500);
    
    // Complete processing and show VLM output 1
    setTimeout(() => {
      setSpectrogramStage('highlighted');
      setIsProcessing(false);
      setShowVLMThinking1(false);
      setShowVLMOutput1(true);
    }, 3000);
  };

  const handleExplain = () => {
    // Show user prompt 2 immediately
    setShowUserPrompt2(true);
    
    // Change spectrogram to mask stage immediately
    setSpectrogramStage('mask');
    
    // Show VLM thinking indicator
    setTimeout(() => {
      setShowVLMThinking2(true);
    }, 500);
    
    // Show VLM output 2 after processing
    setTimeout(() => {
      setShowVLMThinking2(false);
      setShowVLMOutput2(true);
    }, 3000);
  };

  const handleRestart = () => {
    // Reset all state to initial values
    setSpectrogramStage('none');
    setIsProcessing(false);
    setShowUserPrompt1(false);
    setShowVLMOutput1(false);
    setShowVLMThinking1(false);
    setShowUserPrompt2(false);
    setShowVLMOutput2(false);
    setShowVLMThinking2(false);
    setSelectedAudio('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <Breadcrumb />
      
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        <div className="space-y-6">
          {/* Persistent Spectrogram Context */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Spectrogram Analysis</h3>
              {isProcessing && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                  <span>VLM Processing...</span>
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <SpectrogramGrid stage={spectrogramStage} selectedFile={files_data.find(f => f.filename === selectedAudio)} />
            </div>
          </div>

          {/* Audio Selector */}
          <AudioSelector 
            onAudioSelect={handleAudioSelect} 
            onConvert={handleConvert} 
            selectedAudio={selectedAudio}
            onAudioChange={setSelectedAudio}
            files={files_data}
          />

          {/* User Message 1 */}
          {showUserPrompt1 && (
            <ChatMessage
              isUser={true}
              message="Select the top 3 regions that most likely contain spoof artifacts, ordered from most to least prominent spoof artifact evidence."
            />
          )}

          {/* VLM Thinking 1 */}
          {showVLMThinking1 && (
            <RobotMessage>
              <SystemMessage>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </div>
                </div>
              </SystemMessage>
            </RobotMessage>
          )}

          {/* Robot System Message */}
          {showVLMOutput1 && (
            <>
              <RobotMessage>
                <SystemMessage>
                <p className="text-sm font-bold">
                  Top 3 Regions with Spoof Artifacts: [{selectedFileObj?.regions?.join(", ") || "x, y, z"}]
                </p>
                </SystemMessage>
              </RobotMessage>
              
              {/* Explain Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleExplain}
                  className="bg-white border-2 border-black text-black hover:bg-gray-100 px-6 py-2 rounded-lg text-sm font-medium"
                >
                  Explain
                </button>
              </div>
            </>
          )}

          {/* User Message 2 */}
          {showUserPrompt2 && (
            <ChatMessage
              isUser={true}
              message={`Explain the spoof artifact for each of the three selected region IDs in [${selectedFileObj?.regions?.join(', ') || 'x, y, z'}]. This is the transcript for context: {transcript}`}
              showTranscript={true}
            />
          )}

          {/* VLM Thinking 2 */}
          {showVLMThinking2 && (
            <RobotMessage>
              <SystemMessage>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </div>
                </div>
              </SystemMessage>
            </RobotMessage>
          )}

          {/* Robot Feature Breakdown */}
          {showVLMOutput2 && (
            <>
              <RobotMessage>
                <FeatureBreakdown />
              </RobotMessage>
              
              {/* Restart Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleRestart}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-sm font-medium shadow-md transition-colors"
                >
                  Restart Analysis
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}