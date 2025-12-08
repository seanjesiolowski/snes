// Global state
let allowInteraction = false;
let isSoundEnabled = true;
let canReload = false;
let matchElement1 = null;
let matchValue1 = null;
let matchElement2 = null;
let matchValue2 = null;
let matchesFound = 0;
let isChallengeMode = true; // default to challenge mode
let clickCount = 0;
const maxGuesses = 50;

// Audio elements
const correctSnd = new Audio("aud/correct.mp3");
correctSnd.volume = 0.3;
const winSnd = new Audio("aud/win.mp3");
const clickSnd = new Audio("aud/click_003.ogg");

// DOM elements
const settingsModal = document.getElementById('settingsModal');
const soundToggle = document.getElementById('soundToggle');
const modeToggle = document.getElementById('modeToggle'); // NEW: For challenge mode
const inGameToggle = document.getElementById('inGameToggle');
const startBtn = document.getElementById('startBtn');
const cancelBtn = document.getElementById('cancelBtn');
const fillElement = document.getElementById('fill');
const clickMessage = document.getElementById('clickMessage'); // NEW: For click count messages


// --- Sound Management ---

function playSound(audioObj) {
    if (!isSoundEnabled) return;
    try {
        audioObj.currentTime = 0;
        audioObj.play();
    } catch (_e) {
        // ignore play errors
    }
}

function setSetting(settingName, value) {
    switch (settingName) {
        case 'sound':
            isSoundEnabled = !!value;
            updateUIForSoundState();
            break;
        case 'challengeMode':
            isChallengeMode = !!value;
            updateUIForChallengeModeState();
            break;
    }
}

function loadSettingsToUI() { // Load all settings and update UI
    isSoundEnabled = true; // Default sound to true
    isChallengeMode = true; // Default challenge mode to true

    if (soundToggle) soundToggle.checked = isSoundEnabled;
    if (modeToggle) modeToggle.checked = isChallengeMode;
    // No inGameToggle yet, so skip it for now
}

function updateUIForSoundState() {
    if (soundToggle) {
        soundToggle.checked = isSoundEnabled;
    }
    if (inGameToggle) {
        if (isSoundEnabled) {
            inGameToggle.textContent = '🔊';
            inGameToggle.setAttribute('aria-pressed', 'true');
            inGameToggle.title = 'Sound is ON — click to mute';
        } else {
            inGameToggle.textContent = '🔇';
            inGameToggle.setAttribute('aria-pressed', 'false');
            inGameToggle.title = 'Sound is OFF — click to unmute';
        }
        inGameToggle.disabled = !allowInteraction;
    }
}

function updateUIForChallengeModeState() { // NEW: Update UI for challenge mode
    if (modeToggle) {
        modeToggle.checked = isChallengeMode;
    }
    updateClickMessage(); // Re-initialize click message based on mode change
}

// --- Modal Management ---

function showSettingsModal() {
    if (!settingsModal) return;
    loadSettingsToUI(); // Use new loadSettingsToUI
    settingsModal.style.display = 'flex';
    allowInteraction = false;
    if (inGameToggle) inGameToggle.disabled = true;

    // Focus primary action for quick keyboard start
    if (startBtn && cancelBtn) {
        if (matchesFound > 0 || canReload) {
            setTimeout(() => cancelBtn.focus(), 50);
        } else {
            setTimeout(() => startBtn.focus(), 50);
        }
    } else if (startBtn) { // Fallback if only startBtn exists
        setTimeout(() => startBtn.focus(), 50);
    }
}

function hideSettingsModal() {
    if (!settingsModal) return;
    settingsModal.style.display = 'none';
    allowInteraction = true;
    if (inGameToggle) inGameToggle.disabled = false;
    updateUIForSoundState(); // Ensure UI is consistent when modal is hidden
}

// --- Game Logic ---

function reloadPage() {
    if (canReload) {
        window.location.reload();
    }
}

function toggleDisplay(imgElement) {
    if (imgElement) {
        imgElement.style.display = imgElement.style.display === "none" ? "block" : "none";
    }
}

function handleComparison(divEl) { // MODIFIED with click count logic
    if (!allowInteraction) return; // Ignore clicks while settings are open
    playSound(clickSnd);

    if (isChallengeMode && clickCount >= maxGuesses) { // Check click limit
        return;
    }

    const imgElement = divEl.querySelector("img");
    if (!imgElement) return;

    const imgSrc = imgElement.src;

    // Increment click count if a new card is selected (first or second pick of a pair)
    if (!matchValue1 || (!matchValue2 && divEl !== matchElement1)) {
        if (isChallengeMode) {
            clickCount++;
        }
        updateClickMessage(); // Update message after each click
    }
    
    if (!matchValue1) {
        matchElement1 = divEl;
        matchValue1 = imgSrc;
        toggleDisplay(imgElement);
    } else if (!matchValue2) {
        // Prevent clicking the same card twice
        if (divEl === matchElement1) return;

        matchElement2 = divEl;
        matchValue2 = imgSrc;
        toggleDisplay(imgElement);

        if (matchValue1 === matchValue2) {
            // It's a match
            playSound(correctSnd);
            matchesFound++;
            matchElement1.onclick = null;
            matchElement2.onclick = null;
            resetMatchState();

            if (matchesFound === matchGoal) {
                togglePlayAgain();
                playSound(winSnd);
                if (clickMessage) { // Display win message
                    clickMessage.textContent = "Congratulations! You've found all matches!";
                    clickMessage.style.color = "lightgreen";
                }
            }
        } else {
            // Not a match
            setTimeout(() => {
                toggleDisplay(matchElement1.querySelector("img"));
                toggleDisplay(matchElement2.querySelector("img"));
                resetMatchState();
            }, 1000);
        }
    }
}

function resetMatchState() {
    matchElement1 = null;
    matchValue1 = null;
    matchElement2 = null;
    matchValue2 = null;
}

function updateClickMessage() { // NEW: Function to update the click message display
    if (!clickMessage) return;
    if (isChallengeMode) {
        if (clickCount >= maxGuesses) {
            clickMessage.style.color = "red";
            clickMessage.textContent = "You have reached the maximum number of guesses. Try again!";
            togglePlayAgain();
        } else {
            clickMessage.textContent = `You have ${maxGuesses - clickCount} tries left.`;
            clickMessage.style.color = "white"; // Reset color
        }
    } else {
        clickMessage.textContent = ""; // Clear message if click count disabled
    }
}

function togglePlayAgain() {
    if (fillElement) {
        fillElement.textContent = "Play Again?";
        fillElement.style.color = "white";
    }
    canReload = true;
}

// --- Image Loading and Game Setup ---

const srcArray = [
    "https://upload.wikimedia.org/wikipedia/en/8/89/SuperMarioRPGSNESCoverArtUS.jpg",
    "https://upload.wikimedia.org/wikipedia/en/e/e4/Smetroidbox.jpg",
    "https://upload.wikimedia.org/wikipedia/en/3/32/Super_Mario_World_Coverart.png",
    "https://upload.wikimedia.org/wikipedia/en/a/a7/Chrono_Trigger.jpg",
    "https://upload.wikimedia.org/wikipedia/en/2/21/The_Legend_of_Zelda_A_Link_to_the_Past_SNES_Game_Cover.jpg",
    "https://upload.wikimedia.org/wikipedia/en/1/1f/EarthBound_Box.jpg",
    "https://upload.wikimedia.org/wikipedia/en/f/f1/Mega_Man_X_Coverart.png",
    "https://upload.wikimedia.org/wikipedia/en/1/1a/Donkey_Kong_Country_SNES_cover.png",
    "https://upload.wikimedia.org/wikipedia/en/3/38/Supermariokart_box.JPG",
    "https://upload.wikimedia.org/wikipedia/en/3/3c/Super_Mario_All_Stars_%28game_box_art%29.jpg",
    "https://upload.wikimedia.org/wikipedia/en/c/c3/DK_Country_2.jpg",
    "https://upload.wikimedia.org/wikipedia/en/9/9a/Yoshi%27s_Island_%28Super_Mario_World_2%29_box_art.jpg"
];
const matchGoal = srcArray.length;
const srcArrayDouble = [...srcArray, ...srcArray];
const srcArrayDoubleShuffled = srcArrayDouble.sort(() => Math.random() - 0.5);

function assignImages() {
    const elements = document.querySelectorAll(".getsImg");
    elements.forEach((el, idx) => {
        const newChildImg = el.appendChild(document.createElement("img"));
        newChildImg.style.display = "none";
        newChildImg.src = srcArrayDoubleShuffled[idx];
    });
}


// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    // Wire up modal buttons
    if (startBtn && soundToggle && modeToggle) {
        startBtn.addEventListener('click', () => {
            setSetting('sound', soundToggle.checked);
            setSetting('challengeMode', modeToggle.checked);
            hideSettingsModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            loadSettingsToUI(); // Reload settings if cancelled
            hideSettingsModal();
        });
    }

    // Wire up in-game toggle
    if (inGameToggle) {
        // Initial setup for in-game toggle
        loadSettingsToUI(); // Load settings to ensure correct initial state
        updateUIForSoundState(); // Update UI for in-game toggle initially

        inGameToggle.addEventListener('click', () => {
            setSetting('sound', !isSoundEnabled);
        });
    }

    // Wire up mode toggle
    if (modeToggle) {
        modeToggle.addEventListener('change', function() {
            setSetting('challengeMode', this.checked);
        });
    }

    // Wire up main game board reload/reset
    if (fillElement) {
        fillElement.addEventListener('click', reloadPage);
    }

    // Allow Escape to close the modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsModal && settingsModal.style.display !== 'none') {
            loadSettingsToUI(); // Reload settings if cancelled by Escape
            hideSettingsModal();
        }
    });

    // Initialize game
    assignImages();
    showSettingsModal();
    updateClickMessage(); // Initialize click message
});
