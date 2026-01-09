import VideoEditor from "@twick/video-editor";
import { LivePlayerProvider } from "@twick/live-player";
import { TimelineProvider, useTimelineContext } from "@twick/timeline";
import "@twick/video-editor/dist/video-editor.css";
import { useEffect, useState } from "react";
import { saveToDB, getFromDB } from "./utils/db";

// Filter out verbose playback logs from @twick library
const originalLog = console.log;
console.log = (...args: any[]) => {
  const message = args[0];
  if (typeof message === 'string') {
    const suppressedMessages = [
      'onCurrentTimeUpdate',
      'currentTime',
      'Auto-starting media playback',
      'Auto-pausing media playback',
      'Media.play() called',
      'Simple play started successfully'
    ];
    if (suppressedMessages.some(msg => message.includes(msg))) {
      return; // Suppress these logs
    }
  }
  // Also suppress "objects [_Ur]" type logs
  if (message === 'objects' || (typeof message === 'string' && message.trim() === 'objects')) {
    return;
  }
  originalLog(...args);
};

const project_name = "My Video Project";

function EditorWithContext() {
  const { present, changeLog } = useTimelineContext();
 
  useEffect(() => {
    if (!present) return;

    console.log("Timeline state changed, saving to IndexedDB:", present);
    saveToDB(project_name, present).catch(console.error);
  }, [present, changeLog])

  return (
    <VideoEditor
      leftPanel={<CustomLeftPanel />}
      rightPanel={<CustomRightPanel />}
      editorConfig={{
        canvasMode: true,
        videoProps: {
          width: 1920,
          height: 1080,
        },
      }}
    />
  );
}

function App() {
  const [timelineData, setTimelineData] = useState({tracks: [], version: 99});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load timeline data from IndexedDB on mount
    const loadData = async () => {
      try {
        const savedData = await getFromDB(project_name);
        console.log("Loaded data:", savedData);
        if (savedData) {
          setTimelineData(savedData);
        }
      } catch (error) {
        console.log('Error loading timeline data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <LivePlayerProvider>
      <TimelineProvider
        contextId={project_name}
        initialData={timelineData}
        maxHistorySize={10}
        analytics={{ enabled: false }}
      >
        <EditorWithContext />
      </TimelineProvider>
    </LivePlayerProvider>
  );
}

const CustomLeftPanel = () => (
  <div className="tools-panel">
    <button>Add Text</button>
    <button>Add Image</button>
    <button>Add Video</button>
  </div>
);

const CustomRightPanel = () => (
  <div className="properties-panel">
    <h3>Element Properties</h3>
  </div>
);

export default App;