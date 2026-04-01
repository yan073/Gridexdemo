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
    { id: "1", filename: "hifigan_LA_D_1119156", spec: "hifigan.png", audio:"hifigan.wav", transcript:'it\'s very nice', regions:[ 
          {id: 11, T: 'speech', F:'mid', P:'consonant',  explanation:"This <T>voiced</T> region exhibits harmonic degradation in the <F>mid-frequency band</F> during the <P>consonant \"v\"</P>. The visual evidence shows smeared harmonic stacks instead of clean, periodic patterns, which directly translates to a metallic-sounding speech artifact where the natural harmonic structure is disrupted." },
          {id: 13, T: 'non_speech', F:'low', P:'unvoiced',  explanation:'This <F>low-frequency</F> region shows noise flattening in <P>unvoiced</P> segments, visible as a uniform sheet of noise with little spectral speckle. This smoothing suppresses the natural variability of vocal tract noise, producing an airless quality that reduces the sense of genuineness in the speech.'},
          {id: 15, T: 'speech', F:'low', P:'consonant',  explanation:'This <T>voiced</T> region shows harmonic degradation in the <F>low-frequency band</F>. Instead of the sharp transient expected from a <P>consonant</P>, the pattern looks smeared and grainy. This weakens the clean structure of the sound and gives it a slightly metallic quality.'},
        ] },
    { id: "3", filename: "hn-sinc-nsf_LA_T_3965355", spec: "hn-sinc-nsf.png", audio:"hn-sinc-nsf.wav",  transcript:'they come to enjoy themselves', regions:[
      {id: 3, T: 'speech', F:'high', P:'vowel',  explanation:"This <T>voiced</T> region shows formant fading in the <F>high-frequency</F> <P>vowel</P> range, where genuine speech would normally retain clear formant structure. The weakening of formant bands above 3.5 kHz gives the vowel a hollow quality, reducing the natural resonance expected in authentic speech." }, 
      {id: 12, T: 'speech', F:'mid', P:'consonant',  explanation:"This <T>speech</T> region in the <F>mid-frequency band</F> shows harmonic degradation, where the sharp transient burst expected for the <P>\"t\" consonant</P> is replaced by a smeared, grainy spread of energy. This artifact gives the consonant a metallic quality." }, 
      {id: 13, T: 'non_speech', F:'low', P:'unvoiced',  explanation:"This <P>unvoiced</P> region in the <F>low-frequency band</F> shows noise flattening, where the absence of granular spectral speckle creates an unnaturally uniform noise profile. This gives the sibilance a hollow quality and removes the organic background noise expected in natural speech." }
    ]},
    { id: "2", filename: "hn-sinc-nsf-hifi_LA_T_3725354", spec: "hn-sinc-nsf-hifi.png", audio:"hn-sinc-nsf-hifi.wav", transcript:'she has fallen in love with scotland however', regions:[
      {id: 3, T: 'speech', F:'high', P:'vowel',  explanation:"This <T>voiced</T> region in the <F>high-frequency band</F> shows harmonic degradation, where the <P>vowel</P>'s harmonic structure appears smeared rather than cleanly stacked. This gives the vowel a metallic quality and makes it sound less natural than genuine speech." },
      {id: 10, T: 'speech', F:'mid', P:'consonant',  explanation:"In this <T>speech</T> region, the <P>consonant</P> segment within the <F>mid-frequency band</F> exhibits noise flattening, with the spectral fluctuations expected in genuine speech replaced by an unnaturally smooth noise layer. This results in an airless, hollow consonant quality that lacks the organic texture of authentic speech." },
      {id: 13, T: 'non_speech', F:'low', P:'unvoiced',  explanation:"This <P>unvoiced</P> region in the <F>low-frequency band</F> shows noise flattening, where the absence of granular spectral speckle creates an unnaturally uniform noise profile. This gives the sibilance a hollow quality and removes the organic background noise expected in natural speech." }
    ] },
    { id: "4", filename: "waveglow_LA_D_2407623", spec: "waveglow.png", audio:"waveglow.wav", transcript:'it\'s that kind of place', regions:[
      {id: 4, T: 'speech', F:'high', P:'consonant',  explanation:"This <T>speech</T> region shows periodic texture, with low-frequency patterns duplicated into the <F>high-frequency band</F> instead of the irregular energy bursts expected in a genuine <P>fricative</P>. This gives the speech a robotic quality." }, 
      {id: 9, T: 'non_speech', F:'mid', P:'unvoiced',  explanation:"In this <F>mid-frequency</F> <T>non-speech</T> region, noise flattening appears as a uniform noise layer with reduced spectral speckle. The resulting airless quality departs from the textured variability of authentic audio." }, 
      {id: 13, T: 'non_speech', F:'low', P:'unvoiced',  explanation:"This <P>unvoiced</P> region in the <F>low-frequency band</F> shows noise flattening, where the absence of granular spectral speckle creates an unnaturally uniform noise profile. This gives the sibilance a hollow quality and removes the organic background noise expected in natural speech." }
    ] }
  ];

  const selectedFileObj =  files_data.find((f) => f.filename === selectedAudio);

  const handlePlayAudio = () => {
    if (!selectedFileObj?.audio) {
      console.warn('No audio file set for selected file');
      return;
    }

    const audio = new Audio(`/audio/${selectedFileObj.audio}`);
    audio.play().catch((error) => {
      console.error('Audio playback failed:', error);
    });
  };

  const handleAudioSelect = () => {
    clearAudioInfo();
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
    clearAudioInfo();
    setSelectedAudio('');
  };

  const clearAudioInfo = () => {
    setIsProcessing(false);
    setShowUserPrompt1(false);
    setShowVLMOutput1(false);
    setShowVLMThinking1(false);
    setShowUserPrompt2(false);
    setShowVLMOutput2(false);
    setShowVLMThinking2(false);
  };  

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
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
              <SpectrogramGrid stage={spectrogramStage} selectedFile={selectedFileObj} />
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
                  Top 3 Regions with Spoof Artifacts: [{selectedFileObj?.regions?.map((r) => r.id).join(", ") || "x, y, z"}]
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
              message={`Explain the spoof artifact for each of the three selected region IDs in [${selectedFileObj?.regions?.map((r) => r.id).join(', ') || 'x, y, z'}]. This is the transcript for context: ${selectedFileObj?.transcript || ''}`}
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
                <FeatureBreakdown selectedFileObj={selectedFileObj} />
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