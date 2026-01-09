import VideoEditor from "@twick/video-editor";
import { LivePlayerProvider } from "@twick/live-player";
import { AudioElement, TimelineProvider, useTimelineContext, VideoElement } from "@twick/timeline";
import "@twick/video-editor/dist/video-editor.css";
import { useEffect, useState } from "react";
import { addTextElement } from "@twick/canvas";
import INITIAL_TIMELINE from "../../test/temp.json";

import {
    saveProject,
    getProject,
    updateEditDraft,
    createAssetFromFile,
    addAssetToProject
} from "../utils/db";

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

function EditorWithContext() {
    const { present } = useTimelineContext();

    useEffect(() => {
        if (!present) return;

        updateEditDraft(projectId, present).catch(console.error);
    }, [present]);

    return (
        <VideoEditor
            leftPanel={<CustomLeftPanel />}
            // rightPanel={<CustomRightPanel />}
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
function VideoEditorTimeline() {
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


const CustomLeftPanel = () => {
    const { editor } = useTimelineContext();
    const [textInput, setTextInput] = useState("");

    const handleFile = async (file: File) => {
        let elementType: "image" | "video" | "audio" = "image";
        if (file.type.startsWith("video/")) {
            elementType = "video";
        } else if (file.type.startsWith("audio/")) {
            elementType = "audio";
        }
        const asset = createAssetFromFile(file, elementType);
        await addAssetToProject(projectId, asset);
        const sourceURL = `${window.location.origin}/idb/assets/${asset.id}`;
        console.log("audioSource", sourceURL);

        let element;

        if (elementType === "audio") {
            element = new AudioElement(sourceURL);
        } else if (elementType === "video") {
            element = new VideoElement(sourceURL, {
                width: 1920,
                height: 1080
            });
        }

        const track = editor.addTrack('my track', elementType);
        if (!element) return;

        await editor.addElementToTrack(track, element);

        console.log('Audio track and element added!')
    }

    const addText = async () => {
        if (!textInput) return;
        const textElement = addTextElement(editor, {
            text: textInput,
            fill: "#ffffff",
            fontSize: 93,
            fontFamily: "Poppins",
            fontWeight: 700,
            fontStyle: "normal",
            stroke: "#4d4d4d",
            lineWidth: 0,
            textAlign: "center"
        });
        const textTrack = editor.addTrack('My Text Track', 'element');
        await editor.addElementToTrack(textTrack, textElement);
    }

    return (
        <div className="tools-panel">
            <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                    if (e.target.files?.[0]) {
                        handleFile(e.target.files[0]);
                    }
                }}
            />
            <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                    if (e.target.files?.[0]) {
                        handleFile(e.target.files[0]);
                    }
                }}
            />
            <input type="text" placeholder="add text" value={textInput} onChange={(e) => setTextInput(e.target.value)} />
            <button onClick={addText}>add text</button>
        </div>
    );
}

export default VideoEditorTimeline;