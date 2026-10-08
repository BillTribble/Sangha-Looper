// Setup state for positions, scales, viewport cropping, and wire heights
        const state = {
            macbook: { x: 410, y: 250, scale: 1.0 },
            interface: { x: 430, y: 390, scale: 1.0 },
            vocals: { x: 217.1, y: 276.8, scale: 0.8 },
            "phone-singer": { x: 153.9, y: 268.9, scale: 1.0 },
            keyboard: { x: 761.9, y: 275.5, scale: 0.8 },
            ipad: { x: 632, y: 288.4, scale: 1.0 },
            guitar: { x: 715.9, y: 570.1, scale: 0.8 },
            "phone-guitar": { x: 656.2, y: 568.8, scale: 1.0 },
            
            // Text Label Offsets
            textPositions: {
                macbook: { x: 70, y: 95 },
                interface: { x: 50, y: 65 },
                vocals: { x: 33.7, y: 100 },
                keyboard: { x: 51.6, y: 110 },
                guitar: { x: 46.1, y: 115 }
            },

            // Viewport Crop Boundaries
            crop: { x: 130, y: 184, w: 730, h: 539 },

            // Wire Y heights
            wiresY: {
                vocals: 485.0,
                keys: 485.0,
                guitar: 712.0
            }
        };

        // Pairs to link together unless Command/Ctrl is pressed
        const pairs = {
            vocals: "phone-singer",
            keyboard: "ipad",
            guitar: "phone-guitar"
        };

        const canvas = document.getElementById('canvas');
        const controlsList = document.getElementById('controls-list');

        // Apply Viewport Crop Boundaries to SVG
        function applyViewportCrop() {
            canvas.setAttribute('viewBox', `${state.crop.x} ${state.crop.y} ${state.crop.w} ${state.crop.h}`);
            
            // Sync values to sidebar numeric inputs
            document.getElementById('crop-x').value = state.crop.x;
            document.getElementById('crop-y').value = state.crop.y;
            document.getElementById('crop-w').value = state.crop.w;
            document.getElementById('crop-h').value = state.crop.h;
        }

        function updateCrop() {
            state.crop.x = parseFloat(document.getElementById('crop-x').value) || 0;
            state.crop.y = parseFloat(document.getElementById('crop-y').value) || 0;
            state.crop.w = parseFloat(document.getElementById('crop-w').value) || 1000;
            state.crop.h = parseFloat(document.getElementById('crop-h').value) || 600;
            applyViewportCrop();
        }

        function resetCrop() {
            state.crop = { x: 130, y: 184, w: 730, h: 539 };
            applyViewportCrop();
        }

        // Render positions/transforms on initial load
        function updateTransforms() {
            for (const [id, value] of Object.entries(state)) {
                const el = document.getElementById(id);
                if (el && id !== 'crop' && id !== 'wiresY' && id !== 'textPositions') {
                    el.setAttribute('transform', `translate(${value.x}, ${value.y})`);
                }
            }

            // Sync Text positions
            for (const [id, value] of Object.entries(state.textPositions)) {
                const textEl = document.querySelector(`#${id} text`);
                if (textEl) {
                    textEl.setAttribute('x', value.x);
                    textEl.setAttribute('y', value.y);
                }
            }

            drawWires();
        }

        // Draw Right-Angled dynamic wires connecting to TEXT center
        function drawWires() {
            // 1) Vocals connection to Interface Input 1 (Leftmost circle X=state.interface.x + 20)
            const micX = state.vocals.x + state.textPositions.vocals.x; 
            const micY = state.vocals.y + state.textPositions.vocals.y;
            const interfaceX1 = state.interface.x + 20;
            const interfaceY1 = state.interface.y + 35; // Bottom entry
            const vocalsY = state.wiresY.vocals;
            const wireVocals = `M ${micX} ${micY} L ${micX} ${vocalsY} L ${interfaceX1} ${vocalsY} L ${interfaceX1} ${interfaceY1}`;
            document.getElementById('wire-vocals').setAttribute('d', wireVocals);

            // Handle circle positioning
            const handleVocals = document.getElementById('handle-vocals');
            handleVocals.setAttribute('cx', (micX + interfaceX1) / 2);
            handleVocals.setAttribute('cy', vocalsY);

            // 2) Keyboard connection to Interface Input 4 (Rightmost circle X=state.interface.x + 80)
            const keysX = state.keyboard.x + state.textPositions.keyboard.x;
            const keysY = state.keyboard.y + state.textPositions.keyboard.y;
            const interfaceX4 = state.interface.x + 80;
            const interfaceY4 = state.interface.y + 35; // Bottom entry
            const keysYVal = state.wiresY.keys;
            const wireKeys = `M ${keysX} ${keysY} L ${keysX} ${keysYVal} L ${interfaceX4} ${keysYVal} L ${interfaceX4} ${interfaceY4}`;
            document.getElementById('wire-keys').setAttribute('d', wireKeys);

            // Handle circle positioning
            const handleKeys = document.getElementById('handle-keys');
            handleKeys.setAttribute('cx', (keysX + interfaceX4) / 2);
            handleKeys.setAttribute('cy', keysYVal);

            // 3) Guitar connection to Interface Input 2/3 (Middle circle X=state.interface.x + 50)
            const guitarX = state.guitar.x + state.textPositions.guitar.x;
            const guitarY = state.guitar.y + state.textPositions.guitar.y;
            const interfaceX2 = state.interface.x + 50;
            const interfaceY2 = state.interface.y + 35; // Bottom entry
            const guitarYVal = state.wiresY.guitar;
            const wireGuitar = `M ${guitarX} ${guitarY} L ${guitarX} ${guitarYVal} L ${interfaceX2} ${guitarYVal} L ${interfaceX2} ${interfaceY2}`;
            document.getElementById('wire-guitar').setAttribute('d', wireGuitar);

            // Handle circle positioning
            const handleGuitar = document.getElementById('handle-guitar');
            handleGuitar.setAttribute('cx', (guitarX + interfaceX2) / 2);
            handleGuitar.setAttribute('cy', guitarYVal);
        }

        // Setup Drag & Drop directly on SVG
        let selectedElement = null;
        let selectedWireHandle = null;
        let selectedTextLabel = null;
        let offset = { x: 0, y: 0 };
        let draggedPair = null;

        canvas.addEventListener('mousedown', (e) => {
            const isCmdCtrl = e.metaKey || e.ctrlKey;

            // Check if Command/Ctrl + Clicking directly on text
            if (isCmdCtrl && e.target.tagName === 'text') {
                const parentG = e.target.closest('.draggable');
                if (parentG) {
                    selectedTextLabel = parentG.id;
                    const mousePos = getMousePosition(e);
                    // Relative offset inside text group
                    offset.x = mousePos.x - state.textPositions[parentG.id].x - state[parentG.id].x;
                    offset.y = mousePos.y - state.textPositions[parentG.id].y - state[parentG.id].y;
                    return;
                }
            }

            // Check if dragging a wire handle
            if (e.target.classList.contains('wire-handle')) {
                selectedWireHandle = e.target.id;
                return;
            }

            const el = e.target.closest('.draggable');
            if (el) {
                selectedElement = el;
                const id = el.id;
                const mousePos = getMousePosition(e);
                offset.x = mousePos.x - state[id].x;
                offset.y = mousePos.y - state[id].y;

                // Check pairing unless Cmd/Ctrl is pressed
                if (!isCmdCtrl) {
                    if (pairs[id]) {
                        draggedPair = { partner: pairs[id], offsetX: state[pairs[id]].x - state[id].x, offsetY: state[pairs[id]].y - state[id].y };
                    } else {
                        // Check if phone/iPad dragged, move its partner too
                        const partnerId = Object.keys(pairs).find(k => pairs[k] === id);
                        if (partnerId) {
                            draggedPair = { partner: partnerId, offsetX: state[partnerId].x - state[id].x, offsetY: state[partnerId].y - state[id].y };
                        }
                    }
                } else {
                    draggedPair = null;
                }
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const mousePos = getMousePosition(e);

            if (selectedTextLabel) {
                const id = selectedTextLabel;
                // Move text coordinate relative to its parent translate group
                state.textPositions[id].x = parseFloat((mousePos.x - state[id].x - offset.x).toFixed(1));
                state.textPositions[id].y = parseFloat((mousePos.y - state[id].y - offset.y).toFixed(1));
                updateTransforms();
                return;
            }

            if (selectedWireHandle) {
                const wireId = selectedWireHandle.split('-')[1]; // vocals, keys, or guitar
                state.wiresY[wireId] = parseFloat(mousePos.y.toFixed(1));
                updateTransforms();
                return;
            }

            if (selectedElement) {
                const id = selectedElement.id;
                state[id].x = parseFloat((mousePos.x - offset.x).toFixed(1));
                state[id].y = parseFloat((mousePos.y - offset.y).toFixed(1));
                
                if (draggedPair) {
                    state[draggedPair.partner].x = parseFloat((state[id].x + draggedPair.offsetX).toFixed(1));
                    state[draggedPair.partner].y = parseFloat((state[id].y + draggedPair.offsetY).toFixed(1));
                }

                buildControls();
                updateTransforms();
            }
        });

        canvas.addEventListener('mouseup', () => { selectedElement = null; selectedWireHandle = null; selectedTextLabel = null; draggedPair = null; });
        canvas.addEventListener('mouseleave', () => { selectedElement = null; selectedWireHandle = null; selectedTextLabel = null; draggedPair = null; });

        function getMousePosition(e) {
            const rect = canvas.getBoundingClientRect();
            // Map client mouse coordinate directly to SVG coordinate system with viewport crop
            return {
                x: state.crop.x + ((e.clientX - rect.left) / rect.width) * state.crop.w,
                y: state.crop.y + ((e.clientY - rect.top) / rect.height) * state.crop.h
            };
        }

        // Dynamically build input controls in Sidebar
        function buildControls() {
            // Keep Viewport Crop Section at the top
            const oldList = document.querySelectorAll('.control-group.dynamic');
            oldList.forEach(el => el.remove());

            for (const [id, value] of Object.entries(state)) {
                if (id === 'crop' || id === 'wiresY' || id === 'textPositions') continue;
                const group = document.createElement('div');
                group.className = 'control-group dynamic';
                group.innerHTML = `
                    <label style="color: #57DEE3; text-transform: uppercase;">${id}</label>
                    <div class="coords">
                        <div>
                            <label>X</label>
                            <input type="number" id="${id}-x" value="${value.x}" onchange="updateValue('${id}', 'x', this.value)">
                        </div>
                        <div>
                            <label>Y</label>
                            <input type="number" id="${id}-y" value="${value.y}" onchange="updateValue('${id}', 'y', this.value)">
                        </div>
                    </div>
                    <div style="margin-top: 8px;">
                        <label>Scale (0.5 - 1.5)</label>
                        <input type="range" id="${id}-scale" min="0.5" max="1.5" step="0.05" value="${value.scale}" oninput="updateValue('${id}', 'scale', this.value)">
                    </div>
                `;
                controlsList.appendChild(group);
            }
        }

        function updateValue(id, key, val) {
            state[id][key] = parseFloat(val);
            if (key === 'scale') {
                const el = document.getElementById(id);
                const sub = document.getElementById(`${id}-sub`);
                if (sub) {
                    sub.setAttribute('transform', `scale(${val})`);
                } else {
                    const firstG = el.querySelector('g');
                    if (firstG) firstG.setAttribute('transform', `scale(${val})`);
                }
            }
            updateTransforms();
        }

        // Modal output of completed SVG with ViewBox
        function showSVGOutput() {
            const modal = document.getElementById('output-modal');
            const txt = document.getElementById('svg-output');
            
            // Format wires dynamically
            const wireVocals = document.getElementById('wire-vocals').getAttribute('d');
            const wireKeys = document.getElementById('wire-keys').getAttribute('d');
            const wireGuitar = document.getElementById('wire-guitar').getAttribute('d');

            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${state.crop.x} ${state.crop.y} ${state.crop.w} ${state.crop.h}" width="100%" height="100%">
    <defs>
        <style>
            .device { stroke: #8a8599; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
            .device-fill { fill: #8a8599; }
            .device-bg { fill: #12121a; }
            .accent { stroke: #57DEE3; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
            .accent-fill { fill: #57DEE3; }
            .accent-bg { fill: rgba(87, 222, 227, 0.05); }
            .cable { stroke: #5a5570; stroke-width: 2; fill: none; stroke-dasharray: 6 8; stroke-linecap: round; stroke-linejoin: round; }
            .wifi { stroke: #57DEE3; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; fill: none; }
            .glow { filter: drop-shadow(0 0 12px rgba(87, 222, 227, 0.4)); }
            .glow-strong { filter: drop-shadow(0 0 20px rgba(87, 222, 227, 0.8)); }
            .text { font-family: 'Outfit', -apple-system, sans-serif; fill: #f0eef5; font-size: 18px; text-anchor: middle; font-weight: 500; }
            .text-sm { font-family: 'Outfit', -apple-system, sans-serif; fill: #8a8599; font-size: 14px; text-anchor: middle; }
        </style>
    </defs>
    
    <!-- Wireless Connections to Audio Interface (Colored dashed lines) -->
    <path d="${wireVocals}" class="wifi" stroke-dasharray="4 8" opacity="0.6"/>
    <path d="${wireKeys}" class="wifi" stroke-dasharray="4 8" opacity="0.6"/>
    <path d="${wireGuitar}" class="wifi" stroke-dasharray="4 8" opacity="0.6"/>

    <!-- Center: MacBook -->
    <g transform="translate(${state.macbook.x}, ${state.macbook.y})">
        <rect x="25" y="0" width="90" height="60" rx="5" class="device device-bg"/>
        <path d="M 0 65 L 140 65 A 5 5 0 0 0 140 60 L 0 60 A 5 5 0 0 0 0 65 Z" class="device device-bg"/>
        <rect x="30" y="5" width="80" height="50" rx="2" class="device" stroke-width="1.5" opacity="0.5"/>
        <rect x="35" y="10" width="70" height="18" rx="1.5" fill="#57DEE3" opacity="0.2"/>
        <rect x="35" y="35" width="70" height="12" rx="1.5" fill="#57DEE3" opacity="0.1"/>
        <text x="${state.textPositions.macbook.x}" y="${state.textPositions.macbook.y}" class="text">MacBook</text>
        <g transform="translate(70, -20)" class="glow-strong">
            <path d="M -12 -12 A 18 18 0 0 1 12 -12" class="wifi"/>
            <path d="M -22 -22 A 30 30 0 0 1 22 -22" class="wifi"/>
            <circle cx="0" cy="-2" r="3" class="accent-fill"/>
        </g>
    </g>

    <!-- Center: Audio Interface -->
    <g transform="translate(${state.interface.x}, ${state.interface.y})">
        <rect x="0" y="0" width="100" height="35" rx="4" class="device device-bg"/>
        <circle cx="20" cy="17.5" r="6" class="device"/>
        <circle cx="45" cy="17.5" r="5" class="device"/>
        <circle cx="65" cy="17.5" r="5" class="device"/>
        <circle cx="85" cy="17.5" r="5" class="device"/>
        <text x="${state.textPositions.interface.x}" y="${state.textPositions.interface.y}" class="text">Audio Interface</text>
    </g>

    <!-- Left: Vocals (Mic) -->
    <g transform="translate(${state.vocals.x}, ${state.vocals.y})">
        <g transform="scale(${state.vocals.scale})">
            <path d="m45.419 50.517 2.04 -0.486a4.651 4.651 0 0 0 3.474 -3.567l1.356 -6.454 -19.354 6.8 0.464 3.462a2.743 2.743 0 0 0 3.355 2.3l0.982 -0.234" class="device"/>
            <path d="m27.874 35.228 -4.741 2.5a3.574 3.574 0 0 0 -1.606 4.591l1.89 4.326a3.574 3.574 0 0 0 4.46 1.942l5.058 -1.776Z" class="device device-bg"/>
            <path d="m32.935 46.813 19.354 -6.803 -6.272 -14.36 -18.143 9.578 5.061 11.585z" class="device device-bg"/>
            <path d="m46.017 25.65 6.272 14.36 5.955 -2.093 -6.645 -15.213 -5.582 2.946z" class="device device-bg"/>
            <path d="M83.043 18.026a13.376 13.376 0 1 1 -17.612 -6.9" class="device"/>
            <path d="M16.716 45.091a1.758 1.758 0 0 0 1.4 3.2l5.3 -1.647 -1.89 -4.326Z" class="device"/>
            <path d="M45.605 51.709a3.935 3.935 0 0 0 -7.869 0v7.869a1.574 1.574 0 0 0 1.574 1.574h4.721a1.574 1.574 0 0 0 1.574 -1.574Z" class="device"/>
            <path d="m40.097 90 0 -28.848 3.147 0 0 28.848" class="device"/>
            <path d="m39.733 44.423 1.249 3.413" class="device"/>
            <path d="M77.885 34.72 67.291 10.466a13.466 13.466 0 0 0 -1.86 0.656 13.317 13.317 0 0 0 -1.745 0.919L74.279 36.3a13.539 13.539 0 0 0 3.606 -1.575Z" class="device"/>
            <path d="M58.045 19.3a13.379 13.379 0 0 0 7.078 16.2l-6.879 2.417L51.6 22.7Z" class="device"/>
            <path d="M41.671 51.306a0.4 0.4 0 1 1 -0.4 0.4 0.4 0.4 0 0 1 0.4 -0.4m0 -1a1.4 1.4 0 1 0 1.4 1.4 1.4 1.4 0 0 0 -1.4 -1.4Z" class="device-fill" stroke="none"/>
        </g>
        <text x="${state.textPositions.vocals.x}" y="${state.textPositions.vocals.y}" class="text">Vocals</text>
    </g>

    <!-- Left: iPhone (Singer) -->
    <g transform="translate(${state["phone-singer"].x}, ${state["phone-singer"].y})">
        <rect x="0" y="0" width="50" height="100" rx="8" class="accent accent-bg glow"/>
        <rect x="5" y="5" width="40" height="90" rx="4" class="accent" stroke-width="1.5" opacity="0.3"/>
        <!-- Window-like grid in top half -->
        <g opacity="0.6">
            <rect x="10" y="15" width="30" height="30" rx="2" class="accent" stroke-width="1" fill="none"/>
            <line x1="10" y1="30" x2="40" y2="30" class="accent" stroke-width="1"/>
            <line x1="25" y1="15" x2="25" y2="45" class="accent" stroke-width="1"/>
        </g>
        <!-- Waveform in bottom half -->
        <g class="glow" opacity="0.8">
            <line x1="14" y1="62" x2="14" y2="72" class="accent" stroke-width="2" stroke-linecap="round"/>
            <line x1="19.5" y1="58" x2="19.5" y2="76" class="accent" stroke-width="2" stroke-linecap="round"/>
            <line x1="25" y1="54" x2="25" y2="80" class="accent" stroke-width="2" stroke-linecap="round"/>
            <line x1="30.5" y1="58" x2="30.5" y2="76" class="accent" stroke-width="2" stroke-linecap="round"/>
            <line x1="36" y1="62" x2="36" y2="72" class="accent" stroke-width="2" stroke-linecap="round"/>
        </g>
        <g transform="translate(25, -12)" class="glow">
            <path d="M -8 -8 A 12 12 0 0 1 8 -8" class="wifi"/>
            <path d="M -14 -14 A 20 20 0 0 1 14 -14" class="wifi"/>
            <circle cx="0" cy="-2" r="2" class="accent-fill"/>
        </g>
    </g>

    <!-- Right Top: Keyboard -->
    <g transform="translate(${state.keyboard.x}, ${state.keyboard.y})">
        <g transform="scale(${state.keyboard.scale})">
            <rect x="5" y="25" width="90" height="50" rx="6" class="device device-bg"/>
            <rect x="10" y="45" width="80" height="25" rx="2" class="device" fill="none"/>
            <line x1="20" y1="45" x2="20" y2="70" class="device"/>
            <line x1="30" y1="45" x2="30" y2="70" class="device"/>
            <line x1="40" y1="45" x2="40" y2="70" class="device"/>
            <line x1="50" y1="45" x2="50" y2="70" class="device"/>
            <line x1="60" y1="45" x2="60" y2="70" class="device"/>
            <line x1="70" y1="45" x2="70" y2="70" class="device"/>
            <line x1="80" y1="45" x2="80" y2="70" class="device"/>
            <line x1="15" y1="45" x2="15" y2="60" class="device" stroke-width="4"/>
            <line x1="25" y1="45" x2="25" y2="60" class="device" stroke-width="4"/>
            <line x1="35" y1="45" x2="35" y2="60" class="device" stroke-width="4"/>
            <line x1="45" y1="45" x2="45" y2="60" class="device" stroke-width="4"/>
            <line x1="55" y1="45" x2="55" y2="60" class="device" stroke-width="4"/>
            <line x1="65" y1="45" x2="65" y2="60" class="device" stroke-width="4"/>
            <line x1="75" y1="45" x2="75" y2="60" class="device" stroke-width="4"/>
            <line x1="85" y1="45" x2="85" y2="60" class="device" stroke-width="4"/>
        </g>
        <text x="${state.textPositions.keyboard.x}" y="${state.textPositions.keyboard.y}" class="text">Keyboard</text>
    </g>

    <!-- Right Top: iPad (Keys) -->
    <g transform="translate(${state.ipad.x}, ${state.ipad.y})">
        <g transform="scale(${state.ipad.scale})">
            <rect x="0" y="0" width="105" height="75" rx="8" class="accent accent-bg glow"/>
            <rect x="5" y="5" width="95" height="65" rx="4" class="accent" stroke-width="1.5" opacity="0.3"/>
            <rect x="15" y="12" width="75" height="50" rx="3" class="accent" stroke-width="1.5" opacity="0.5"/>
            <line x1="15" y1="37" x2="90" y2="37" class="accent" stroke-width="0.75" opacity="0.5"/>
            <line x1="52" y1="12" x2="52" y2="62" class="accent" stroke-width="0.75" opacity="0.5"/>
            <circle cx="62" cy="42" r="5" class="accent-fill glow-strong"/>
            <g transform="translate(52, -15)" class="glow">
                <path d="M -10 -10 A 15 15 0 0 1 10 -10" class="wifi"/>
                <path d="M -18 -18 A 25 25 0 0 1 18 -18" class="wifi"/>
                <circle cx="0" cy="-2" r="2.5" class="accent-fill"/>
            </g>
        </g>
    </g>

    <!-- Right Bottom: Guitar -->
    <g transform="translate(${state.guitar.x}, ${state.guitar.y})">
        <g transform="scale(${state.guitar.scale})">
            <path d="m87.128 17.782 3.146 3.146" class="device"/>
            <path d="m79.346 10 3.312 3.311" class="device"/>
            <path d="m83.817 22.418 3.477 3.477" class="device"/>
            <path d="m74.379 12.98 2.98 2.981" class="device"/>
            <path d="m29.674 63.646 5.96 5.961" class="device"/>
            <path d="M42.092 63.15a2.108 2.108 0 0 1 -2.981 0l-2.98 -2.981a2.107 2.107 0 0 1 2.98 -2.98l2.981 2.98a2.108 2.108 0 0 1 0 2.981Z" class="device"/>
            <path d="M47.059 58.182a2.107 2.107 0 0 1 -2.98 0L41.1 55.2a2.108 2.108 0 0 1 2.981 -2.98l2.98 2.98a2.107 2.107 0 0 1 -0.002 2.982Z" class="device"/>
            <path d="M48.574 44.947a5.62 5.62 0 0 0 -6.015 -0.146L10.7 61.719a2.81 2.81 0 0 0 0.932 5.212l16.771 2.8a1.406 1.406 0 0 1 1.155 1.155l2.8 16.771a2.81 2.81 0 0 0 5.212 0.931l16.91 -31.866a5.622 5.622 0 0 0 -0.146 -6.015" class="device device-bg"/>
            <path d="M34.641 64.64a2.811 2.811 0 0 1 0 3.974h0a2.81 2.81 0 0 0 -0.8 2.384l0.636 4.453a2.81 2.81 0 0 0 5.223 1.005l10.755 -20.878a2.811 2.811 0 0 0 -0.448 -3.389l-2.832 -2.832a2.81 2.81 0 0 0 -3.513 -0.372L31.6 56.791a2.811 2.811 0 0 0 -0.46 4.346Z" class="device"/>
            <path d="M38.785 74.465a0.163 0.163 0 1 1 -0.164 0.163 0.163 0.163 0 0 1 0.164 -0.163m0 -1a1.163 1.163 0 1 0 1.163 1.163 1.163 1.163 0 0 0 -1.163 -1.163Z" class="device-fill" stroke="none"/>
            <path d="M40.892 70.25a0.163 0.163 0 1 1 -0.163 0.163 0.164 0.164 0 0 1 0.163 -0.163m0 -1a1.163 1.163 0 1 0 1.164 1.163 1.163 1.163 0 0 0 -1.164 -1.163Z" class="device-fill" stroke="none"/>
            <path d="M52.522 52.666a1.406 1.406 0 0 1 -2.012 0.026l-3.921 -3.921a1.4 1.4 0 0 1 0.026 -2.013l25.777 -23.843 3.974 3.974Z" class="device device-bg"/>
            <path d="M90.385 13.222a1.792 1.792 0 0 0 -2.26 -2.644l-13.818 6.909a2.111 2.111 0 0 0 -1.124 1.471l-0.791 3.957 3.974 3.974 4.15 -0.83a2.11 2.11 0 0 0 1.3 -0.842Z" class="device"/>
        </g>
        <text x="${state.textPositions.guitar.x}" y="${state.textPositions.guitar.y}" class="text">Guitar</text>
    </g>

    <!-- Right Bottom: iPhone (Guitar) -->
    <g transform="translate(${state["phone-guitar"].x}, ${state["phone-guitar"].y})">
        <rect x="0" y="0" width="50" height="100" rx="8" class="accent accent-bg glow"/>
        <rect x="5" y="5" width="40" height="90" rx="4" class="accent" stroke-width="1.5" opacity="0.3"/>
        <!-- Window-like grid in top half -->
        <g opacity="0.6">
            <rect x="10" y="15" width="30" height="30" rx="2" class="accent" stroke-width="1" fill="none"/>
            <line x1="10" y1="30" x2="40" y2="30" class="accent" stroke-width="1"/>
            <line x1="25" y1="15" x2="25" y2="45" class="accent" stroke-width="1"/>
        </g>
        <!-- Waveform in bottom half -->
        <g class="glow" opacity="0.8">
            <line x1="14" y1="62" x2="14" y2="72" class="accent" stroke-width="2" stroke-linecap="round"/>
            <line x1="19.5" y1="58" x2="19.5" y2="76" class="accent" stroke-width="2" stroke-linecap="round"/>
            <line x1="25" y1="54" x2="25" y2="80" class="accent" stroke-width="2" stroke-linecap="round"/>
            <line x1="30.5" y1="58" x2="30.5" y2="76" class="accent" stroke-width="2" stroke-linecap="round"/>
            <line x1="36" y1="62" x2="36" y2="72" class="accent" stroke-width="2" stroke-linecap="round"/>
        </g>
        <g transform="translate(25, -12)" class="glow">
            <path d="M -8 -8 A 12 12 0 0 1 8 -8" class="wifi"/>
            <path d="M -14 -14 A 20 20 0 0 1 14 -14" class="wifi"/>
            <circle cx="0" cy="-2" r="2" class="accent-fill"/>
        </g>
    </g>
</svg>`;
            txt.value = svgContent;
            modal.style.display = 'flex';
        }

        function closeModal() {
            document.getElementById('output-modal').style.display = 'none';
        }

        // Copy generated SVG directly into system clipboard
        function copySVGCode() {
            const txt = document.getElementById('svg-output');
            txt.select();
            document.execCommand('copy');
            alert('SVG Code copied to clipboard!');
            closeModal();
        }

        // Initialize Page
        buildControls();
        updateTransforms();
        applyViewportCrop();
