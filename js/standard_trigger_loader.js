/**
 * Standard Trigger Words Loader - Interactive Button Tags UI
 * Optimized & Surgical Fix Version
 */

import { app } from "../../scripts/app.js";

// Presets - Kept exactly as your original
const TRIGGER_WORD_PRESETS = {
    "Quality": ["masterpiece", "best quality", "very aesthetic", "absurdres", "high quality", "ultra high definition", "extremely high detail", "newest", "year 2024", "year 2025", "highres", "8K", "HDR"],
    "Lighting": ["volumetric lighting", "ambient occlusion", "dramatic lighting", "cinematic lighting", "rim light", "soft lighting", "studio lighting", "golden hour lighting", "natural lighting", "sunlight", "backlighting", "sharp focus", "glowing", "luminescent background"],
    "Composition": ["dynamic angle", "dynamic pose", "low-angle shot", "low angle", "looking at viewer", "from above", "from below", "upper body focus", "full body", "portrait", "close-up shot", "mid shot", "cowboy shot", "wide angle", "cinematic field of view", "perfect composition", "rule of thirds"],
    "Style": ["anime illustration", "semi-realistic anime illustration", "digital painting", "cel shading", "clean linework", "manga style lineart", "detailed", "highly detailed", "intricate details", "painterly"],
    "Detail": ["detailed eyes", "beautiful eye details", "detailed skin features", "detailed face features", "detailed hair features", "expressive eyes", "intricate iris", "detailed clothing", "detailed background", "fine texture details"],
    "Aesthetic": ["beautiful", "amazing", "stunning", "gorgeous", "perfect", "flawless", "eye-catching", "stylish", "elegant", "aesthetic"],
    "Motion": ["motion blur", "motion lines", "action pose", "dynamic action", "movement", "speed lines", "flowing", "fluid motion"]
};

TRIGGER_WORD_PRESETS["All"] = Object.values(TRIGGER_WORD_PRESETS).flat();

// Internal state protected from global scope
let wheelSensitivityCache = null;
let wheelSensitivityTime = 0;

function getWheelSensitivity() {
    const now = Date.now();
    if (wheelSensitivityCache && (now - wheelSensitivityTime) < 5000) return wheelSensitivityCache;
    const setting = app.ui.settings.getSettingValue("AegisFlow.WheelScrollSpeed", 0.02);
    wheelSensitivityCache = parseFloat(setting) ?? 0.02;
    wheelSensitivityTime = now;
    return wheelSensitivityCache;
}

function getPresetTags(category, defaultActive = true, defaultStrength = 1.0) {
    return (TRIGGER_WORD_PRESETS[category] || []).map(text => ({
        text, active: defaultActive, strength: defaultStrength
    }));
}

// UI RENDERER (Your Original Logic preserved)
function createTagsWidget(node, name, opts = {}) {
    const container = document.createElement("div");
    container.className = "comfy-tags-container";
    
    Object.assign(container.style, {
        display: "flex", flexWrap: "wrap", gap: "4px", padding: "6px",
        backgroundColor: "rgba(40, 44, 52, 0.6)", borderRadius: "6px",
        width: "100%", boxSizing: "border-box", overflow: "auto",
        minHeight: "150px", alignItems: "flex-start"
    });

    const widget = {
        type: "custom_tags",
        name: name,
        value: opts.defaultVal || [],
        options: opts,
        draw: () => {}, // Canvas drawing skipped as we use DOM
        computeSize: function(width) {
            const tagsCount = this.value?.length || 0;
            const rows = Math.max(1, Math.ceil(tagsCount / 3));
            const height = 12 + (rows * 26) + ((rows - 1) * 2);
            return [width, Math.max(150, height)];
        },
        serializeValue: function() {
            return JSON.stringify(Array.isArray(this.value) ? this.value : []);
        }
    };

    const renderTags = (tagsData) => {
        container.innerHTML = "";
        if (!Array.isArray(tagsData) || tagsData.length === 0) {
            const msg = document.createElement("div");
            msg.textContent = "No trigger words loaded";
            Object.assign(msg.style, { textAlign: "center", padding: "20px 0", color: "gray", fontStyle: "italic", width: "100%" });
            container.appendChild(msg);
            return;
        }

        tagsData.forEach((tag, index) => {
            const tagEl = document.createElement("div");
            const textSpan = document.createElement("span");
            textSpan.textContent = tag.text;
            
            // Re-applying your specific styles surgically
            Object.assign(tagEl.style, {
                padding: "3px 10px", borderRadius: "6px", fontSize: "13px", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: "6px", margin: "1px", height: "22px",
                backgroundColor: tag.active ? "rgba(59, 130, 246, 0.85)" : "rgba(100, 116, 139, 0.3)",
                color: tag.active ? "white" : "rgba(203, 213, 225, 0.6)",
                border: `1px solid ${tag.active ? "rgba(96, 165, 250, 0.8)" : "rgba(148, 163, 184, 0.4)"}`
            });

            tagEl.onclick = (e) => {
                e.stopPropagation();
                const updated = [...widget.value];
                updated[index].active = !updated[index].active;
                widget.value = updated;
                node.setDirtyCanvas(true);
            };

            // Strength Wheel
            tagEl.onwheel = (e) => {
                if (!widget.allowStrengthAdjustment) return;
                e.preventDefault(); e.stopPropagation();
                const updated = [...widget.value];
                const sens = getWheelSensitivity();
                updated[index].strength = Math.max(0, Math.min(2, (updated[index].strength || 1) + (e.deltaY < 0 ? sens : -sens)));
                widget.value = updated;
                node.setDirtyCanvas(true);
            };

            tagEl.appendChild(textSpan);
            container.appendChild(tagEl);
        });
    };

    widget.renderTags = renderTags;
    Object.defineProperty(widget, 'value', {
        get() { return this._value || []; },
        set(v) { this._value = v; renderTags(v); }
    });

    node.addDOMWidget(name, "custom_tags", container, {
        getValue: () => widget.value,
        setValue: (v) => { widget.value = v; }
    });

    widget.value = opts.defaultVal || [];
    return widget;
}

// CENTRALIZED NODE INITIALIZER
function initializeStandardNode(node) {
    if (node._custom_ui_ready) return; // Prevention of duplicate UI

    // 1. Ensure Serialized Widget exists
    let storage = node.widgets?.find(w => w.name === "modify_tags");
    if (!storage) {
        storage = node.addWidget("text", "modify_tags", "[]", () => {});
        storage.type = "hidden";
    }

    // 2. Create UI Widget
    const tagsWidget = createTagsWidget(node, "trigger_words_display");

    // 3. Link UI to Storage
    const valProp = Object.getOwnPropertyDescriptor(tagsWidget, 'value');
    Object.defineProperty(tagsWidget, 'value', {
        get: () => valProp.get.call(tagsWidget),
        set: (v) => {
            valProp.set.call(tagsWidget, v);
            storage.value = JSON.stringify(v);
        }
    });

    // 4. Set Initial Data
    try {
        const saved = JSON.parse(storage.value || "[]");
        if (saved.length > 0) {
            tagsWidget.value = saved;
        } else {
            const cat = node.widgets.find(w => w.name === "preset_category")?.value || "Quality";
            tagsWidget.value = getPresetTags(cat);
        }
    } catch (e) {
        tagsWidget.value = [];
    }

    // 5. Add Functionality Buttons
    node.addWidget("button", "Toggle All ON", null, () => {
        tagsWidget.value = tagsWidget.value.map(t => ({...t, active: true}));
    });
    node.addWidget("button", "Toggle All OFF", null, () => {
        tagsWidget.value = tagsWidget.value.map(t => ({...t, active: false}));
    });

    node._custom_ui_ready = true;
    setTimeout(() => node.setDirtyCanvas?.(true, true), 50);
}

app.registerExtension({
    name: "StandardTriggerWordsLoader",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name === "StandardTriggerWordsLoader") {
            
            // Hook into Node Creation
            const onCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function() {
                onCreated?.apply(this, arguments);
                initializeStandardNode(this);
            };

            // Hook into Workflow Loading
            const onConfig = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function() {
                onConfig?.apply(this, arguments);
                initializeStandardNode(this);
            };
        }
    }
});