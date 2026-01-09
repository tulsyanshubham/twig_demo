self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Persistent asset URLs
    if (url.pathname.startsWith("/idb/assets/")) {
        event.respondWith(handleAssetRequest(url));
    }
});

/* -------------------------------------------------- */
/* Handle asset fetch */
/* -------------------------------------------------- */
async function handleAssetRequest(url) {
    const assetId = decodeURIComponent(
        url.pathname.replace("/idb/assets/", "")
    );

    const db = await openDB();

    return new Promise((resolve) => {
        const tx = db.transaction("assets", "readonly");
        const store = tx.objectStore("assets");

        const req = store.get(assetId);

        req.onsuccess = () => {
            const asset = req.result;

            if (!asset || !asset.blob) {
                resolve(new Response("Asset not found", { status: 404 }));
                return;
            }

            const blob = asset.blob;

            resolve(
                new Response(blob, {
                    status: 206,
                    headers: {
                        "Content-Type": asset.mimeType || blob.type || "application/octet-stream",
                        "Accept-Ranges": "bytes",
                        "Content-Length": blob.size,
                        "Content-Range": `bytes 0-${blob.size - 1}/${blob.size}`,
                    },
                })
            );
        };

        req.onerror = () => {
            resolve(new Response("IndexedDB error", { status: 500 }));
        };
    });
}

/* -------------------------------------------------- */
/* Open IndexedDB */
/* -------------------------------------------------- */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("VideoEditorDB");

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Failed to open IndexedDB");
    });
}
