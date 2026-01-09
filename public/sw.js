self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    if (url.pathname.startsWith("/idb/audio/")) {
        event.respondWith(handleAudioRequest(url));
    }
});

async function handleAudioRequest(url) {
    const fileName = decodeURIComponent(
        url.pathname.replace("/idb/audio/", "")
    );

    const db = await openDB();

    return new Promise((resolve) => {
        const tx = db.transaction("json_store", "readonly");
        const store = tx.objectStore("json_store");

        const req = store.get(`audio:${fileName}`);

        req.onsuccess = () => {
            const audioData = req.result;

            if (!audioData) {
                resolve(new Response("Audio not found", { status: 404 }));
                return;
            }

            const blob = audioData.blob;

            resolve(
                new Response(blob, {
                    status: 206,
                    headers: {
                        "Content-Type": audioData.mimeType,
                        "Accept-Ranges": "bytes",
                        "Content-Length": blob.size,
                        "Content-Range": `bytes 0-${blob.size - 1}/${blob.size}`
                    }
                })
            );
        };

        req.onerror = () => {
            resolve(new Response("DB error", { status: 500 }));
        };
    });
}

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("DynamicJsonDB");

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject();
    });
}