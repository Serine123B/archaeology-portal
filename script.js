// Shared JS for login + voice tools

document.addEventListener('DOMContentLoaded', () => {
    setupLogin();
    setupVoiceTools();
});

// ---------------- LOGIN ----------------

function setupLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    const errorMessage = document.getElementById('errorMessage');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (username === 'Test' && password === 'test12345') {
            if (errorMessage) {
                errorMessage.textContent = '✓ Access granted! Redirecting to field tools...';
                errorMessage.classList.add('show');
            }
            setTimeout(() => {
                window.location.href = 'menu.html';
            }, 600);
        } else {
            if (errorMessage) {
                errorMessage.textContent = '✗ Invalid credentials. Use Username: "Test" and Password: "test12345".';
                errorMessage.classList.add('show');
            }
        }
    });
}

// ---------------- VOICE / CAMERA ----------------

function setupVoiceTools() {
    const micBtn = document.getElementById('voiceMicBtn');
    const keyboardBtn = document.getElementById('voiceKeyboardBtn');
    const photoBtn = document.getElementById('voicePhotoBtn');
    const photoInput = document.getElementById('voicePhotoInput');
    const textArea = document.getElementById('voiceTextArea');
    const statusEl = document.getElementById('voiceStatus');
    const photoPreview = document.getElementById('voicePhotoPreview');

    if (!micBtn || !keyboardBtn || !photoBtn || !photoInput || !textArea || !statusEl) {
        return; // we are probably on the login page
    }

    let recognizing = false;
    let recognition = null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        statusEl.textContent = 'Speech recognition is not supported in this browser. You can still type or add a photo.';
        micBtn.disabled = true;
    } else {
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false; // important: only final result to avoid duplicates

        recognition.onstart = () => {
            recognizing = true;
            statusEl.textContent = 'Listening... speak your context notes.';
            micBtn.classList.add('mic-active');
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event);
            statusEl.textContent = 'There was a problem with speech recognition.';
            micBtn.classList.remove('mic-active');
            recognizing = false;
        };

        recognition.onend = () => {
            micBtn.classList.remove('mic-active');
            recognizing = false;
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            finalTranscript = finalTranscript.trim();
            if (!finalTranscript) return;

            const current = textArea.value ? textArea.value + ' ' : '';
            textArea.value = current + finalTranscript;
            textArea.focus();
        };

        micBtn.addEventListener('click', () => {
            if (!recognition) return;
            if (!recognizing) {
                try {
                    recognition.start();
                } catch (err) {
                    console.error('Failed to start recognition', err);
                }
            } else {
                recognition.stop();
            }
        });
    }

    keyboardBtn.addEventListener('click', () => {
        textArea.focus();
        statusEl.textContent = 'Keyboard input active. Type your context notes.';
    });

    photoBtn.addEventListener('click', () => {
        photoInput.click();
    });

    photoInput.addEventListener('change', () => {
        const file = photoInput.files && photoInput.files[0];
        if (!file) return;

        statusEl.textContent = 'Photo selected: ' + file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            if (photoPreview) {
                photoPreview.innerHTML = '<img src="' + e.target.result + '" alt="Selected context photo">';
            }
        };
        reader.readAsDataURL(file);
    });
}
