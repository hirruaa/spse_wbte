const video = document.getElementById("video");
const startBtn = document.getElementById("startBtn");
const gallery = document.getElementById("gallery");
const masterCanvas = document.getElementById("masterCanvas");
const settingsModal = document.getElementById("settingsModal");

// Setting Inputs
const filterSelect = document.getElementById("filterSelect");
const stickerSelect = document.getElementById("stickerSelect");
const photoCountInput = document.getElementById("photoCountInput");
const timerInput = document.getElementById("timerInput");

const TARGET_RATIO = 4 / 3;
const STRIP_WIDTH = 400;
const STRIP_HEIGHT = 300;
const PADDING = 20;

const STICKERS = {
    hearts: ['💕', '💖', '🌸', '💝'],
    sparkles: ['✨', '🌟', '💫', '🪄'],
    stars: ['⭐', '🌟', '✨', '🌙']
};

// 1. Setup Camera
async function init() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
    } catch (e) { alert("Camera access required for the photobooth! ✨"); }
}

// 2. Capture Logic
async function startSession() {
    startBtn.disabled = true;
    const photos = [];
    const count = parseInt(photoCountInput.value);
    const delay = parseInt(timerInput.value);

    document.querySelector(".empty-msg")?.remove();

    for (let i = 0; i < count; i++) {
        await runCountdown(delay);
        photos.push(captureFrame());
    }

    createStrip(photos);
    startBtn.disabled = false;
}

function runCountdown(sec) {
    return new Promise(res => {
        let c = sec;
        const el = document.getElementById("countdown");
        const t = setInterval(() => {
            el.innerText = c;
            if (c <= 0) { clearInterval(t); el.innerText = ""; res(); }
            c--;
        }, 1000);
    });
}

function captureFrame() {
    // Flash Effect
    document.getElementById("flash").classList.add("flash-trigger");
    setTimeout(() => document.getElementById("flash").classList.remove("flash-trigger"), 400);

    const canvas = document.createElement("canvas");
    canvas.width = 800; canvas.height = 600;
    const ctx = canvas.getContext("2d");

    // Math for WYSIWYG Center Crop
    const vW = video.videoWidth;
    const vH = video.videoHeight;
    const vRatio = vW / vH;
    let sx, sy, sw, sh;

    if (vRatio > TARGET_RATIO) {
        sw = vH * TARGET_RATIO; sh = vH; sx = (vW - sw) / 2; sy = 0;
    } else {
        sw = vW; sh = vW / TARGET_RATIO; sx = 0; sy = (vH - sh) / 2;
    }

    // Apply Filter & Mirror
    ctx.filter = filterSelect.value;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // Apply Stickers (Overlay)
    const stickerType = stickerSelect.value;
    if (stickerType !== 'none') {
        ctx.scale(-1, 1); // Flip back to draw text correctly
        ctx.translate(-canvas.width, 0);
        addStickersToCanvas(ctx, STICKERS[stickerType]);
    }

    return canvas.toDataURL("image/png");
}

function addStickersToCanvas(ctx, set) {
    ctx.font = "40px serif";
    for(let i=0; i<5; i++) {
        const char = set[Math.floor(Math.random() * set.length)];
        const x = Math.random() * 750;
        const y = 50 + Math.random() * 500;
        ctx.fillText(char, x, y);
    }
}

// 3. Final Construction
function createStrip(photos) {
    const ctx = masterCanvas.getContext("2d");
    const count = photos.length;
    masterCanvas.width = STRIP_WIDTH + (PADDING * 2);
    masterCanvas.height = (STRIP_HEIGHT * count) + (PADDING * (count + 1)) + 50;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, masterCanvas.width, masterCanvas.height);

    let loaded = 0;
    photos.forEach((src, i) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            ctx.drawImage(img, PADDING, PADDING + (i * (STRIP_HEIGHT + PADDING)), STRIP_WIDTH, STRIP_HEIGHT);
            if (++loaded === count) {
                // Branding
                ctx.fillStyle = "#ff78ae"; ctx.font = "bold 16px Quicksand"; ctx.textAlign = "center";
                ctx.fillText("✨ SWEET MEMORIES ✨", masterCanvas.width/2, masterCanvas.height - 20);
                renderToGallery();
            }
        };
    });
}

function renderToGallery() {
    const url = masterCanvas.toDataURL();
    const div = document.createElement("div");
    div.className = "strip-container";
    div.innerHTML = `<img src="${url}"><br><a href="${url}" download="aesthetic-strip.png" class="primary-btn" style="text-decoration:none;">Download PNG</a>`;
    gallery.prepend(div);
}

// 4. Events
document.getElementById("settingsBtn").onclick = () => settingsModal.style.display = "flex";
document.getElementById("closeSettings").onclick = () => settingsModal.style.display = "none";
startBtn.onclick = startSession;

init();