
  # GRIDEX Webpage Implementation

  This is a code bundle for Webpage Design Implementation. The original project is available at https://www.figma.com/design/syUy9swWgcnILY0gCgO2LH/Webpage-Design-Implementation.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Data folder
  /datasets/work/dss-deepfake-audio/work/data/datasets/gridex_demo/
  
  ## Additional data input 
  1. Transcript: "/datasets/work/dss-deepfake-audio/work/data/datasets/gridex_demo/transcript/"
  Transcript should be included in User's prompt 2, replacing the placeholder:
  Explain the spoof artifact for each of the three selected region IDs in [x, y, z]. This is the transcript for context: {transcript}

  2. Audio: "/datasets/work/dss-deepfake-audio/work/data/datasets/gridex_demo/audio/"
  The raw audio should be playable when User clicks on the spectrogram image in Step 4 (add a play button to signify this)
