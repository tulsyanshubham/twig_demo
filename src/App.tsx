import React, { useEffect } from 'react'
import VideoEditorTimeline from './components/VideoEditorTimeline'

function App() {
  const [registered, setRegistered] = React.useState(false);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js");

    navigator.serviceWorker.ready.then(() => {
      console.log("Service Worker ready");
      setRegistered(true);
    });
  }, []);

  return (
    <div>
      {registered && <VideoEditorTimeline />}
    </div>
  )
}

export default App
