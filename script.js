document.addEventListener('DOMContentLoaded', () => {
    setupLogin();
    setupMenu();
});

// Simple in-browser "database" using localStorage
const DB_KEY = 'archaeology_artifact_records_v1';

function loadArtifactRecords() {
    try {
        const raw = localStorage.getItem(DB_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Error loading records from localStorage', e);
        return [];
    }
}

function saveArtifactRecords(records) {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(records));
    } catch (e) {
        console.error('Error saving records to localStorage', e);
    }
}

// LOGIN PAGE LOGIC
function setupLogin() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const errorMessage = document.getElementById('errorMessage');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    if (!errorMessage || !usernameInput || !passwordInput) {
        console.error('Login inputs not found');
        return;
    }

    const VALID_USER = {
        username: 'Test',
        password: 'test12345'
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        errorMessage.classList.remove('show');
        errorMessage.textContent = '';

        if (username === VALID_USER.username && password === VALID_USER.password) {
            errorMessage.textContent = '✓ Access granted! Redirecting to field tools...';
            errorMessage.style.background = 'rgba(139, 90, 43, 0.3)';
            errorMessage.style.borderColor = 'rgba(101, 67, 33, 0.6)';
            errorMessage.style.color = '#3E2723';
            errorMessage.classList.add('show');

            setTimeout(() => {
                window.location.href = 'menu.html';
            }, 700);
        } else {
            errorMessage.textContent = '✗ Invalid credentials. Use Username: "Test" and Password: "test12345".';
            errorMessage.style.background = 'rgba(101, 67, 33, 0.3)';
            errorMessage.style.borderColor = 'rgba(79, 46, 33, 0.6)';
            errorMessage.style.color = '#3E2723';
            errorMessage.classList.add('show');

            usernameInput.style.borderColor = 'rgba(79, 46, 33, 0.8)';
            passwordInput.style.borderColor = 'rgba(79, 46, 33, 0.8)';

            setTimeout(() => {
                usernameInput.style.borderColor = '';
                passwordInput.style.borderColor = '';
            }, 500);
        }
    });

    usernameInput.addEventListener('input', () => {
        if (errorMessage.classList.contains('show')) {
            errorMessage.classList.remove('show');
        }
    });

    passwordInput.addEventListener('input', () => {
        if (errorMessage.classList.contains('show')) {
            errorMessage.classList.remove('show');
        }
    });
}

// MENU PAGE LOGIC
function setupMenu() {
    const featureOutput = document.getElementById('featureOutput');
    const menuButtons = document.querySelectorAll('.menu-item[data-feature]');
    if (!featureOutput || menuButtons.length === 0) return;

    let records = loadArtifactRecords();

    function renderRecords() {
        if (!records.length) {
            featureOutput.innerHTML = '<h2>Record List</h2><p>No artifact records have been saved yet. Use the "Artifact Record" button to add one.</p>';
            return;
        }

        const itemsHtml = records
            .map((rec, index) => {
                const date = new Date(rec.createdAt);
                const dateStr = isNaN(date.getTime()) ? '' : date.toLocaleString();
                return `
                    <li>
                        <strong>#${index + 1}</strong> – ${rec.name}
                        ${rec.context ? ' | Context: ' + rec.context : ''}
                        ${rec.notes ? ' | Notes: ' + rec.notes : ''}
                        ${dateStr ? ' | Logged: ' + dateStr : ''}
                    </li>
                `;
            })
            .join('');

        featureOutput.innerHTML = `
            <h2>Record List</h2>
            <p>Stored locally in your browser (simple field database):</p>
            <ul>${itemsHtml}</ul>
        `;
    }

    function setupVoiceUI() {
        const micBtn = document.getElementById('voiceMicBtn');
        const keyboardBtn = document.getElementById('voiceKeyboardBtn');
        const photoBtn = document.getElementById('voicePhotoBtn');
        const photoInput = document.getElementById('voicePhotoInput');
        const textArea = document.getElementById('voiceTextArea');
        const statusEl = document.getElementById('voiceStatus');
        const photoPreview = document.getElementById('voicePhotoPreview');

        if (!micBtn || !keyboardBtn || !photoBtn || !photoInput || !textArea || !statusEl) {
            return;
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
            // IMPORTANT: no interim results to avoid repeated partial text
            recognition.interimResults = false;

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
                if (recognizing) {
                    statusEl.textContent = 'Stopped listening.';
                }
                recognizing = false;
            };

            recognition.onresult = (event) => {
                // Only handle the final result once
                let transcript = '';
                for (let i = 0; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        transcript += event.results[i][0].transcript;
                    }
                }
                transcript = transcript.trim();
                if (!transcript) return;

                const current = textArea.value ? textArea.value + ' ' : '';
                textArea.value = current + transcript;
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
                photoPreview.innerHTML = '<img src="' + e.target.result + '" alt="Selected context photo">';
            };
            reader.readAsDataURL(file);
        });
    }

    function handleFeatureClick(feature) {
        switch (feature) {
            case 'gpr':
                featureOutput.innerHTML = `
                    <h2>GPR Analysis</h2>
                    <p>This module will be used to upload and interpret ground-penetrating radar grids from the field.</p>
                    <p><em>Placeholder:</em> In a full version you could load GPR files, view slices, and flag anomalies.</p>
                `;
                break;

            case 'stratigraphy':
                featureOutput.innerHTML = `
                    <h2>Stratigraphy Detection</h2>
                    <p>Use this tool to describe layers, interfaces, and relationships between contexts.</p>
                    <p><em>Placeholder:</em> Later this could be connected to drawings or photos of site sections.</p>
                `;
                break;

            case 'voice':
                featureOutput.innerHTML = `
                    <h2>Voice to Context Sheet</h2>
                    <div class="voice-context-wrapper">
                        <p>Use the mic button to speak your notes, the keyboard button to type, and the photo button to attach a context image (works on mobile too).</p>
                        <div class="voice-toolbar">
                            <button type="button" class="voice-btn" id="voiceMicBtn" aria-label="Record voice">
                                🎤
                            </button>
                            <button type="button" class="voice-btn" id="voiceKeyboardBtn" aria-label="Type with keyboard">
                                ⌨️
                            </button>
                            <button type="button" class="voice-btn" id="voicePhotoBtn" aria-label="Add photo">
                                📷
                            </button>
                            <input type="file" id="voicePhotoInput" accept="image/*" capture="environment" style="display:none">
                        </div>
                        <textarea id="voiceTextArea" class="voice-textarea" placeholder="Your context notes will appear here..."></textarea>
                        <div id="voiceStatus" class="voice-status">Tap the mic to start recording.</div>
                        <div id="voicePhotoPreview" class="voice-photo-preview"></div>
                    </div>
                `;
                setupVoiceUI();
                break;

            case 'artifact':
                const name = prompt('Artifact name / description (for example: rim sherd, bronze coin):');
                if (!name) {
                    featureOutput.innerHTML = '<h2>Artifact Record</h2><p>Artifact entry cancelled. No data was saved.</p>';
                    return;
                }

                const context = prompt('Context / stratigraphic unit (optional):');
                const notes = prompt('Extra notes (optional):');

                const newRecord = {
                    id: Date.now(),
                    name: name.trim(),
                    context: context ? context.trim() : '',
                    notes: notes ? notes.trim() : '',
                    createdAt: new Date().toISOString()
                };

                records.push(newRecord);
                saveArtifactRecords(records);

                featureOutput.innerHTML = `
                    <h2>Artifact Record</h2>
                    <p>Saved a new artifact into the local field database.</p>
                    <ul>
                        <li><strong>Name:</strong> ${newRecord.name || 'n/a'}</li>
                        <li><strong>Context:</strong> ${newRecord.context || 'n/a'}</li>
                        <li><strong>Notes:</strong> ${newRecord.notes || 'n/a'}</li>
                    </ul>
                    <p>Use "Record List" to review everything that has been logged.</p>
                `;
                break;

            case 'qr':
                featureOutput.innerHTML = `
                    <h2>QR Code Output</h2>
                    <p>This area can be used to generate QR codes for context sheets or artifact bags.</p>
                    <p><em>Placeholder:</em> You could plug in a QR code library and encode artifact IDs from the database.</p>
                `;
                break;

            case 'records':
                renderRecords();
                break;

            case 'site-map':
                featureOutput.innerHTML = `
                    <h2>Site Map</h2>
                    <p>Overview of trenches, units, and key features on your excavation site.</p>
                    <p><em>Placeholder:</em> In the future this could show a real map or plan linked to context numbers.</p>
                `;
                break;

            case 'settings':
                featureOutput.innerHTML = `
                    <h2>Settings</h2>
                    <p>Here you could configure project name, site code, and default user preferences.</p>
                    <p>Right now this is just a static placeholder for your archaeology app.</p>
                `;
                break;

            default:
                featureOutput.innerHTML = '<p>Select a menu item to view details.</p>';
        }
    }

    menuButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const feature = btn.getAttribute('data-feature');
            handleFeatureClick(feature);
        });
    });
}
