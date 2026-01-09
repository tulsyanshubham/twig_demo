import VideoEditor from "@twick/video-editor";
import { LivePlayerProvider } from "@twick/live-player";
import { TimelineProvider, useTimelineContext } from "@twick/timeline";
import "@twick/video-editor/dist/video-editor.css";
import { useEffect, useState } from "react";

import {
  saveProject,
  getProject,
  updateEditDraft
} from "./utils/db";

/* -------------------------------- */
/* Log suppression (unchanged) */
/* -------------------------------- */
const originalLog = console.log;
console.log = (...args: any[]) => {
  const message = args[0];
  if (typeof message === "string") {
    const suppressedMessages = [
      "onCurrentTimeUpdate",
      "currentTime",
      "Auto-starting media playback",
      "Auto-pausing media playback",
      "Media.play() called",
      "Simple play started successfully",
    ];
    if (suppressedMessages.some((msg) => message.includes(msg))) return;
  }
  if (message === "objects") return;
  originalLog(...args);
};

const projectId = "project-1";
const projectName = "My Video Project";

const INITIAL_TIMELINE = {
  "tracks": [
    {
      "id": "t-e84fa5a24ccb",
      "name": "Track_1767940799091",
      "type": "element",
      "props": {},
      "elements": [
        {
          "id": "e-0ca83216d80d",
          "trackId": "t-e84fa5a24ccb",
          "type": "video",
          "s": 0,
          "e": 9.943267,
          "props": {
            "src": "https://videos.pexels.com/video-files/31708803/13510402_1080_1920_30fps.mp4",
            "playbackRate": 1,
            "time": 0,
            "mediaFilter": "none",
            "volume": 1
          },
          "frame": {
            "size": [
              720,
              1280
            ]
          },
          "frameEffects": [],
          "objectFit": "cover",
          "mediaDuration": 9.943267
        }
      ]
    },
    {
      "id": "t-d66271828b3d",
      "name": "Track_2",
      "type": "element",
      "props": {},
      "elements": [
        {
          "id": "e-6208084a641b",
          "trackId": "t-d66271828b3d",
          "type": "text",
          "s": 0,
          "e": 1,
          "props": {
            "text": "T1",
            "fill": "#ffffff",
            "fontSize": 93,
            "fontFamily": "Poppins",
            "fontWeight": 700,
            "fontStyle": "normal",
            "stroke": "#4d4d4d",
            "lineWidth": 0,
            "textAlign": "center"
          }
        },
        {
          "id": "e-f6dbc3cbf708",
          "trackId": "t-d66271828b3d",
          "type": "text",
          "s": 1,
          "e": 2,
          "props": {
            "text": "T2",
            "fill": "#ffffff",
            "fontSize": 93,
            "fontFamily": "Poppins",
            "fontWeight": 700,
            "fontStyle": "normal",
            "stroke": "#4d4d4d",
            "lineWidth": 0,
            "textAlign": "center"
          }
        },
        {
          "id": "e-87d4bc1aa6c8",
          "trackId": "t-d66271828b3d",
          "type": "text",
          "s": 2,
          "e": 3,
          "props": {
            "text": "T3",
            "fill": "#ffffff",
            "fontSize": 101,
            "fontFamily": "Poppins",
            "fontWeight": 700,
            "fontStyle": "normal",
            "stroke": "#4d4d4d",
            "lineWidth": 0,
            "textAlign": "center"
          }
        }
      ]
    },
    {
      "id": "t-8e673dd709d2",
      "name": "Track_1767941188861",
      "type": "element",
      "props": {},
      "elements": [
        {
          "id": "e-175c83f1335c",
          "trackId": "t-8e673dd709d2",
          "type": "audio",
          "s": 0,
          "e": 20.064,
          "props": {
            "src": "https://cdn.pixabay.com/audio/2022/03/14/audio_782eeb590e.mp3",
            "time": 0,
            "playbackRate": 1,
            "volume": 1,
            "loop": false
          },
          "mediaDuration": 20.064
        }
      ]
    }
  ],
  "version": 56
}

function EditorWithContext() {
  const { present } = useTimelineContext();

  useEffect(() => {
    if (!present) return;

    updateEditDraft(projectId, present).catch(console.error);
  }, [present]);

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

/* -------------------------------- */
/* App */
/* -------------------------------- */
function App() {
  const [timelineData, setTimelineData] = useState<any | null>(INITIAL_TIMELINE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      let project = await getProject(projectId);

      if (!project) {
        project = {
          id: projectId,
          name: projectName,
          editDraft: INITIAL_TIMELINE,
          assetIds: [],
          updatedAt: Date.now(),
        };
        await saveProject(project);
      }

      setTimelineData(project.editDraft);
      setIsLoading(false);
    };

    loadProject();
  }, []);

  if (isLoading || !timelineData) {
    return <div>Loading...</div>;
  }

  return (
    <LivePlayerProvider>
      <TimelineProvider
        contextId={projectId}
        initialData={timelineData}
        maxHistorySize={10}
        analytics={{ enabled: false }}
      >
        <EditorWithContext />
      </TimelineProvider>
    </LivePlayerProvider>
  );
}



const CustomRightPanel = () => {

  return (
    <div className="properties-panel">
      <h3>Element Properties</h3>
    </div>
  );
}

export default App;


const CustomLeftPanel = () => {

  return (
    <div className="tools-panel">
      <button>Add Text</button>
      <button>Add Image</button>
      <button>Add Video</button>
    </div>
  );
}
