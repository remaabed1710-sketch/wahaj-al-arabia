// =====================================
// وهج العربية - الملف البرمجي الرئيسي
// =====================================

// أدوات مساعدة عامة

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const field = document.createElement("textarea");
        field.value = text;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();

        let copied = false;
        try {
            copied = document.execCommand("copy");
        } catch {}

        field.remove();
        return copied;
    }
}

function stripDiacritics(text) {
    return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
}

function readFavorites() {
    try {
        const value = JSON.parse(localStorage.getItem("wahjFavorites") || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function writeFavorites(value) {
    try {
        localStorage.setItem("wahjFavorites", JSON.stringify(value));
    } catch (error) {
        console.warn("تعذر حفظ المفضلة", error);
    }
}

// 1. التنقل بين صفحات التطبيق

const pages = document.querySelectorAll(".page");
const navLinks = document.querySelectorAll(".navigation a");


function showPage(pageId) {
    // تحديث قائمة الصفحات عند كل تنقل
    const allPages = document.querySelectorAll(".page");
    const allNavLinks = document.querySelectorAll(".navigation a");

    allPages.forEach(page => {
        page.classList.remove("active");
    });

    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.add("active");
        selectedPage.hidden = false;

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    allNavLinks.forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === pageId
        );
    });

    document.querySelector(".navigation")?.classList.remove("open");
}

// الضغط على روابط القائمة
document.querySelectorAll(".navigation a").forEach(link => {
    link.addEventListener("click", function(event) {
        event.preventDefault();
        showPage(this.dataset.page);
    });
});


// زر ابدأ رحلتك
document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", function() {
        showPage(this.dataset.go);
    });
});

// 2. قائمة الجوال

const menuButton = document.getElementById("menuButton");

if (menuButton) {
    menuButton.addEventListener("click", () => {
        const navigation = document.querySelector(".navigation");
        navigation?.classList.toggle("open");
    });
}

// 3. لعبة معاني الكلمات

let score = 0;

const gameOptions = document.getElementById("gameOptions");
const gameResult = document.getElementById("gameResult");
const scoreDisplay = document.getElementById("score");

if (gameOptions) {
    gameOptions.addEventListener("click", function(event) {
        const button = event.target.closest("button");

        if (!button || button.disabled) return;

        const correctAnswer = "رائحة طيبة";
        const userAnswer = button.dataset.answer;

        const buttons = gameOptions.querySelectorAll("button");

        buttons.forEach(option => {
            option.disabled = true;
        });

        if (userAnswer === correctAnswer) {
            score += 10;

            if (gameResult) {
                gameResult.textContent =
                    "أحسنت! إجابة صحيحة، أحسنتِ استخدام العربية! ⭐";
            }
        } else {
            if (gameResult) {
                gameResult.textContent =
                    "محاولة جميلة! الإجابة الصحيحة هي: رائحة طيبة.";
            }
        }

        if (scoreDisplay) {
            scoreDisplay.textContent = score;
        }
    });
}

/* =========================================
   استوديو مرسم الحروف - وهج العربية
========================================= */

(() => {
    "use strict";

    const canvas = document.getElementById("artCanvas");
    const elementsArea = document.getElementById("artCanvasElements");
    const background = document.getElementById("artCanvasBackground");

    if (!canvas || !elementsArea || !background) return;

    const $ = id => document.getElementById(id);
    const NS = "http://www.w3.org/2000/svg";

    const input = $("artInput");
    const font = $("artFont");
    const fontSize = $("artFontSize");
    const textColor = $("artTextColor");
    const align = $("artAlign");
    const backgroundSelect = $("artBackground");
    const elementColor = $("artElementColor");
    const elementSize = $("artElementSize");
    const rotationInput = $("artRotation");
    const layersPanel = $("artLayers");
    const gallery = $("artGallery");

    let selectedElement = null;
    let history = [];
    let historyIndex = -1;
    let zoom = 100;
    let elementCounter = 0;
    let isDragging = false;
    let dragStart = null;

    const STORAGE_KEY = "wahajArabicArtGallery";

    const makeSvg = (name, attributes = {}) => {
        const element = document.createElementNS(NS, name);

        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });

        return element;
    };

    function getCanvasState() {
        return {
            background: background.getAttribute("fill"),
            elements: elementsArea.innerHTML
        };
    }

    function applyCanvasState(state) {
        background.setAttribute("fill", state.background);
        elementsArea.innerHTML = state.elements;
        selectedElement = null;
        updateLayers();
        syncControls();
    }

    function saveHistory() {
        const state = getCanvasState();
        const serialized = JSON.stringify(state);

        if (historyIndex >= 0 &&
            JSON.stringify(history[historyIndex]) === serialized) {
            return;
        }

        history = history.slice(0, historyIndex + 1);
        history.push(state);

        if (history.length > 50) {
            history.shift();
        }

        historyIndex = history.length - 1;
    }

    function undo() {
        if (historyIndex <= 0) return;

        historyIndex--;
        applyCanvasState(history[historyIndex]);
    }

    function redo() {
        if (historyIndex >= history.length - 1) return;

        historyIndex++;
        applyCanvasState(history[historyIndex]);
    }

    function getPosition(element) {
        const transform = element.getAttribute("transform") || "";
        const match = transform.match(
            /translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/
        );

        return match
            ? { x: Number(match[1]), y: Number(match[2]) }
            : { x: 450, y: 300 };
    }

    function getRotation(element) {
        const transform = element.getAttribute("transform") || "";
        const match = transform.match(/rotate\(\s*(-?[\d.]+)/);

        return match ? Number(match[1]) : 0;
    }

    function setTransform(element, x, y, rotation = 0) {
        element.setAttribute(
            "transform",
            `translate(${x} ${y}) rotate(${rotation})`
        );
    }

    function getTextAnchor() {
        const value = align?.value || "center";

        if (value === "right") return "start";
        if (value === "left") return "end";

        return "middle";
    }

    function createTextElement(text, options = {}) {
        const group = makeSvg("g", {
            "data-type": "text",
            "data-id": ++elementCounter,
            cursor: "move"
        });

        const textNode = makeSvg("text", {
            "text-anchor": options.anchor || getTextAnchor(),
            "font-family": options.font || font?.value || "Amiri",
            "font-size": options.size || Number(fontSize?.value) || 48,
            fill: options.color || textColor?.value || "#e5cc91",
            direction: "rtl",
            "unicode-bidi": "plaintext"
        });

        const lines = String(text || "وهج العربية").split("\n");
        const lineHeight = 1.4;

        lines.forEach((line, index) => {
            const tspan = makeSvg("tspan", {
                x: 0,
                dy: index === 0 ? 0 : `${lineHeight}em`
            });

            tspan.textContent = line;
            textNode.appendChild(tspan);
        });

        group.appendChild(textNode);

        setTransform(
            group,
            options.x ?? 450,
            options.y ?? 300,
            options.rotation ?? 0
        );

        return group;
    }

    function createOrnament(symbol, options = {}) {
        const group = makeSvg("g", {
            "data-type": "ornament",
            "data-id": ++elementCounter,
            cursor: "move"
        });

        const textNode = makeSvg("text", {
            x: 0,
            y: 0,
            "text-anchor": "middle",
            "dominant-baseline": "middle",
            "font-family": "Amiri",
            "font-size": options.size || Number(elementSize?.value) || 65,
            fill: options.color || elementColor?.value || "#c5a15b"
        });

        textNode.textContent = symbol;
        group.appendChild(textNode);

        setTransform(
            group,
            options.x ?? 450,
            options.y ?? 300,
            options.rotation ?? 0
        );

        return group;
    }

    function selectElement(element) {
        selectedElement = element;

        if (element) {
            const position = getPosition(element);

            if (rotationInput) {
                rotationInput.value = getRotation(element);
            }

            if (elementColor) {
                const child = element.querySelector("text");
                if (child) {
                    elementColor.value = child.getAttribute("fill") || "#c5a15b";
                }
            }

            if (elementSize) {
                const child = element.querySelector("text");
                if (child) {
                    elementSize.value =
                        child.getAttribute("font-size") || 65;
                }
            }

            if (element.dataset.type === "text" && input) {
                input.value = Array.from(
                    element.querySelectorAll("tspan")
                ).map(span => span.textContent).join("\n");

                if (font) {
                    font.value =
                        element.querySelector("text").getAttribute("font-family");
                }

                if (fontSize) {
                    fontSize.value =
                        element.querySelector("text").getAttribute("font-size");
                }

                if (textColor) {
                    textColor.value =
                        element.querySelector("text").getAttribute("fill");
                }
            }
        }

        updateLayers();
    }

    function syncControls() {
        if (!selectedElement) return;

        const position = getPosition(selectedElement);

        if (rotationInput) {
            rotationInput.value = getRotation(selectedElement);
        }
    }

    function updateLayers() {
        if (!layersPanel) return;

        layersPanel.innerHTML = "";

        const items = Array.from(elementsArea.children).reverse();

        if (!items.length) {
            layersPanel.innerHTML =
                "<p>لا توجد عناصر في اللوحة حتى الآن.</p>";
            return;
        }

        items.forEach(element => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "studio-layer-item";

            if (element === selectedElement) {
                item.classList.add("active");
            }

            const type = element.dataset.type;
            const text = type === "text"
                ? Array.from(element.querySelectorAll("tspan"))
                    .map(span => span.textContent).join(" ")
                : element.querySelector("text")?.textContent || "زخرفة";

            item.textContent =
                `${type === "text" ? "نص: " : "زخرفة: "}${text.slice(0, 22)}`;

            item.addEventListener("click", () => {
                selectElement(element);
            });

            layersPanel.appendChild(item);
        });
    }

    function addText() {
        const value = input?.value.trim();

        if (!value) {
            alert("اكتبي النص الذي تريدين إضافته أولاً.");
            return;
        }

        const element = createTextElement(value);
        elementsArea.appendChild(element);

        selectElement(element);
        saveHistory();
    }

    function addOrnament(symbol) {
        const element = createOrnament(symbol);
        elementsArea.appendChild(element);

        selectElement(element);
        saveHistory();
    }

    function updateSelectedText() {
        if (!selectedElement ||
            selectedElement.dataset.type !== "text") return;

        const value = input?.value.trim();

        if (!value) return;

        const old = selectedElement;
        const position = getPosition(old);
        const rotation = getRotation(old);

        const replacement = createTextElement(value, {
            x: position.x,
            y: position.y,
            rotation,
            font: font?.value,
            size: fontSize?.value,
            color: textColor?.value,
            anchor: getTextAnchor()
        });

        old.replaceWith(replacement);
        selectElement(replacement);
    }

    function updateSelectedAppearance() {
        if (!selectedElement) return;

        const textNode = selectedElement.querySelector("text");
        if (!textNode) return;

        if (selectedElement.dataset.type === "text") {
            textNode.setAttribute(
                "font-family",
                font?.value || "Amiri"
            );

            textNode.setAttribute(
                "font-size",
                fontSize?.value || 48
            );

            textNode.setAttribute(
                "fill",
                textColor?.value || "#e5cc91"
            );

            textNode.setAttribute("text-anchor", getTextAnchor());
        } else {
            textNode.setAttribute(
                "fill",
                elementColor?.value || "#c5a15b"
            );

            textNode.setAttribute(
                "font-size",
                elementSize?.value || 65
            );
        }

        const position = getPosition(selectedElement);

        setTransform(
            selectedElement,
            position.x,
            position.y,
            Number(rotationInput?.value) || 0
        );
    }

    function changeBackground(value) {
        const backgrounds = {
            green: "#123d32",
            ivory: "#faf7ef",
            gold: "#8a6a36",
            brown: "#604331",
            dark: "#202820",
            transparent: "transparent"
        };

        background.setAttribute(
            "fill",
            backgrounds[value] || value || "#123d32"
        );

        saveHistory();
    }

    function duplicateSelected() {
        if (!selectedElement) return;

        const clone = selectedElement.cloneNode(true);
        const position = getPosition(selectedElement);

        clone.dataset.id = ++elementCounter;

        setTransform(
            clone,
            position.x + 35,
            position.y + 35,
            getRotation(selectedElement)
        );

        elementsArea.appendChild(clone);
        selectElement(clone);
        saveHistory();
    }

    function deleteSelected() {
        if (!selectedElement) return;

        selectedElement.remove();
        selectedElement = null;

        updateLayers();
        saveHistory();
    }

    function bringFront() {
        if (!selectedElement) return;

        elementsArea.appendChild(selectedElement);
        updateLayers();
        saveHistory();
    }

    function sendBack() {
        if (!selectedElement) return;

        elementsArea.prepend(selectedElement);
        updateLayers();
        saveHistory();
    }

    function resetCanvas() {
        if (!confirm("هل تريدين مسح جميع العناصر وإعادة اللوحة إلى وضعها الأول؟")) {
            return;
        }

        elementsArea.innerHTML = "";
        background.setAttribute("fill", "#123d32");
        selectedElement = null;

        if (input) input.value = "";

        updateLayers();
        saveHistory();
    }

    function getPointerPosition(event) {
        const point = canvas.createSVGPoint();

        point.x = event.clientX;
        point.y = event.clientY;

        return point.matrixTransform(
            canvas.getScreenCTM().inverse()
        );
    }

    elementsArea.addEventListener("pointerdown", event => {
        const group = event.target.closest("g[data-type]");

        if (!group || !elementsArea.contains(group)) return;

        selectElement(group);

        const point = getPointerPosition(event);
        const position = getPosition(group);

        isDragging = true;

        dragStart = {
            element: group,
            pointerX: point.x,
            pointerY: point.y,
            x: position.x,
            y: position.y
        };

        group.setPointerCapture?.(event.pointerId);
        event.preventDefault();
    });

    elementsArea.addEventListener("pointermove", event => {
        if (!isDragging || !dragStart) return;

        const point = getPointerPosition(event);

        const x = dragStart.x + point.x - dragStart.pointerX;
        const y = dragStart.y + point.y - dragStart.pointerY;

        setTransform(
            dragStart.element,
            x,
            y,
            getRotation(dragStart.element)
        );
    });

    function finishDragging() {
        if (!isDragging) return;

        isDragging = false;
        dragStart = null;
        saveHistory();
    }

    elementsArea.addEventListener("pointerup", finishDragging);
    elementsArea.addEventListener("pointercancel", finishDragging);

    $("artAddText")?.addEventListener("click", addText);

    document.querySelectorAll("[data-ornament]").forEach(button => {
        button.addEventListener("click", () => {
            addOrnament(button.dataset.ornament);
        });
    });

    $("artUndo")?.addEventListener("click", undo);
    $("artRedo")?.addEventListener("click", redo);
    $("artReset")?.addEventListener("click", resetCanvas);
    $("artDuplicate")?.addEventListener("click", duplicateSelected);
    $("artDelete")?.addEventListener("click", deleteSelected);
    $("artBringFront")?.addEventListener("click", bringFront);
    $("artSendBack")?.addEventListener("click", sendBack);

    input?.addEventListener("input", () => {
        if (selectedElement?.dataset.type === "text") {
            updateSelectedText();
        }
    });

    [font, fontSize, textColor, align, elementColor,
     elementSize, rotationInput].forEach(control => {
        control?.addEventListener("input", updateSelectedAppearance);
        control?.addEventListener("change", updateSelectedAppearance);
    });

    backgroundSelect?.addEventListener("change", () => {
        changeBackground(backgroundSelect.value);
    });

    document.querySelectorAll("[data-art-color]").forEach(button => {
        button.addEventListener("click", () => {
            const color = button.dataset.artColor;

            if (textColor) textColor.value = color;

            if (selectedElement?.dataset.type === "text") {
                updateSelectedAppearance();
                saveHistory();
            }
        });
    });

    function updateZoom() {
        canvas.style.width = `${zoom}%`;

        if ($("artZoomValue")) {
            $("artZoomValue").textContent = `${zoom}%`;
        }
    }

    $("artZoomIn")?.addEventListener("click", () => {
        zoom = Math.min(zoom + 10, 150);
        updateZoom();
    });

    $("artZoomOut")?.addEventListener("click", () => {
        zoom = Math.max(zoom - 10, 50);
        updateZoom();
    });

    function useTemplate(name) {
        const templates = {
            name: {
                text: "وهج العربية",
                background: "#123d32",
                color: "#e5cc91",
                ornament: "۞"
            },
            quote: {
                text: "لغتنا هويتنا",
                background: "#faf7ef",
                color: "#123d32",
                ornament: "❁"
            },
            poem: {
                text: "وما نيل المطالب بالتمني",
                background: "#604331",
                color: "#e5cc91",
                ornament: "❦"
            },
            greeting: {
                text: "أهلاً وسهلاً",
                background: "#123d32",
                color: "#e5cc91",
                ornament: "✧"
            },
            heritage: {
                text: "أصالة الحرف العربي",
                background: "#8a6a36",
                color: "#faf7ef",
                ornament: "༺"
            },
            arabic: {
                text: "الضاد لغة الجمال",
                background: "#202820",
                color: "#e5cc91",
                ornament: "✺"
            }
        };

        const template = templates[name];
        if (!template) return;

        elementsArea.innerHTML = "";
        background.setAttribute("fill", template.background);

        if (input) input.value = template.text;
        if (textColor) textColor.value = template.color;

        const textElement = createTextElement(template.text, {
            color: template.color
        });

        elementsArea.appendChild(textElement);

        const ornament = createOrnament(template.ornament, {
            x: 450,
            y: 170,
            color: template.color
        });

        elementsArea.appendChild(ornament);

        selectElement(textElement);
        saveHistory();
    }

    document.querySelectorAll("[data-template]").forEach(button => {
        button.addEventListener("click", () => {
            useTemplate(button.dataset.template);
        });
    });

    function getCleanSvg() {
        const clone = canvas.cloneNode(true);

        clone.setAttribute("xmlns", NS);
        clone.setAttribute("width", "900");
        clone.setAttribute("height", "600");

        return new XMLSerializer().serializeToString(clone);
    }

    function downloadFile(url, filename) {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    async function exportPNG() {
        try {
            if (document.fonts?.ready) {
                await document.fonts.ready;
            }

            const svgText = getCleanSvg();
            const blob = new Blob([svgText], {
                type: "image/svg+xml;charset=utf-8"
            });

            const url = URL.createObjectURL(blob);
            const image = new Image();

            image.onload = () => {
                const output = document.createElement("canvas");
                output.width = 1800;
                output.height = 1200;

                const context = output.getContext("2d");
                context.drawImage(image, 0, 0, 1800, 1200);

                output.toBlob(png => {
                    if (!png) {
                        alert("تعذر إنشاء الصورة.");
                        URL.revokeObjectURL(url);
                        return;
                    }

                    const pngUrl = URL.createObjectURL(png);
                    downloadFile(pngUrl, "وهج-العربية.png");

                    setTimeout(() => {
                        URL.revokeObjectURL(pngUrl);
                        URL.revokeObjectURL(url);
                    }, 1500);
                }, "image/png");
            };

            image.onerror = () => {
                URL.revokeObjectURL(url);
                alert("تعذر تصدير اللوحة. تحققي من الخطوط المستخدمة.");
            };

            image.src = url;
        } catch (error) {
            console.error(error);
            alert("حدث خطأ أثناء تصدير اللوحة.");
        }
    }

    $("artExport")?.addEventListener("click", exportPNG);

    function getGalleryItems() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function renderGallery() {
        if (!gallery) return;

        const items = getGalleryItems();
        gallery.innerHTML = "";

        if (!items.length) {
            gallery.innerHTML = "<p>لم تحفظي أي لوحة بعد.</p>";
            return;
        }

        items.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "art-gallery-item";

            const image = document.createElement("img");
            image.src = item.image;
            image.alt = "لوحة محفوظة";

            const loadButton = document.createElement("button");
            loadButton.type = "button";
            loadButton.textContent = "فتح اللوحة";

            loadButton.addEventListener("click", () => {
                background.setAttribute("fill", item.state.background);
                elementsArea.innerHTML = item.state.elements;
                selectedElement = null;
                updateLayers();
                saveHistory();
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "حذف اللوحة";

            deleteButton.addEventListener("click", () => {
                const updated = getGalleryItems();
                updated.splice(index, 1);

                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(updated)
                );

                renderGallery();
            });

            card.append(image, loadButton, deleteButton);
            gallery.appendChild(card);
        });
    }

    async function saveArtwork() {
        try {
            const svgText = getCleanSvg();
            const svgBlob = new Blob([svgText], {
                type: "image/svg+xml;charset=utf-8"
            });

            const url = URL.createObjectURL(svgBlob);
            const image = new Image();

            image.onload = () => {
                const output = document.createElement("canvas");
                output.width = 900;
                output.height = 600;

                const context = output.getContext("2d");
                context.drawImage(image, 0, 0, 900, 600);

                const item = {
                    image: output.toDataURL("image/png"),
                    state: getCanvasState(),
                    date: new Date().toISOString()
                };

                try {
                    const items = getGalleryItems();
                    items.unshift(item);

                    localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify(items.slice(0, 12))
                    );

                    renderGallery();
                    alert("تم حفظ اللوحة في معرضك بنجاح.");
                } catch {
                    alert("مساحة التخزين ممتلئة. احذفي بعض اللوحات القديمة.");
                }

                URL.revokeObjectURL(url);
            };

            image.onerror = () => {
                URL.revokeObjectURL(url);
                alert("تعذر حفظ اللوحة.");
            };

            image.src = url;
        } catch (error) {
            console.error(error);
            alert("حدث خطأ أثناء حفظ اللوحة.");
        }
    }

    $("artSave")?.addEventListener("click", saveArtwork);

    // تهيئة الاستوديو

    saveHistory();
    updateLayers();
    updateZoom();
    renderGallery();

})();


// 6. تهيئة التطبيق

showPage("home");

console.log("مرحبًا بك في وهج العربية 🌿");
// ======================================
// 7. ديوان الشعر - قصيدة المتنبي
// ======================================

const mutanabiPoem = `وَاحَرّ قَلْباهُ ممّنْ قَلْبُهُ شَبِمُ
وَمَنْ بجِسْمي وَحالي عِندَهُ سَقَمُ
ما لي أُكَتِّمُ حُبًّا قَدْ بَرَى جَسَدي
وَتَدّعي حُبّ سَيفِ الدّوْلةِ الأُمَم ُ
إنْ كَانَ يَجْمَعُنَا حُبٌّ لِغُرّتِهِ
فَلَيْتَ أنّا بِقَدْرِ الحُبّ نَقْتَسِمُ
قد زُرْتُهُ وَسُيُوفُ الهِنْدِ مُغْمَدَةٌ
وَقد نَظَرْتُ إلَيْهِ وَالسّيُوفُ دَمُ
فكانَ أحْسَنَ خَلقِ الله كُلّهِمِ
وَكانَ أحسنَ ما فِي الأحسَنِ الشّيَمُ
فَوْتُ العَدُوّ الذي يَمّمْتَهُ ظَفَرٌ
فِي طَيّهِ أسَفٌ فِي طَيّهِ نِعَمُ
قد نابَ عنكَ شديدُ الخوْفِ وَاصْطنعتْ
لَكَ المَهابَةُ ما لا تَصْنَعُ البُهَمُ
ألزَمْتَ نَفْسَكَ شَيْئاً لَيسَ يَلزَمُها
أنْ لا يُوارِيَهُمْ أرْضٌ وَلا عَلَمُ
أكُلّمَا رُمْتَ جَيْشاً فانْثَنَى هَرَباً
تَصَرّفَتْ بِكَ فِي آثَارِهِ الهِمَمُ
عَلَيْكَ هَزْمُهُمُ فِي كلّ مُعْتَرَكٍ
وَمَا عَلَيْكَ بِهِمْ عَارٌ إذا انهَزَمُوا
أمَا تَرى ظَفَراً حُلْواً سِوَى ظَفَرٍ
تَصافَحَتْ فيهِ بِيضُ الهِنْدِ وَاللِّممُ
يا أعدَلَ النّاسِ إلاّ فِي مُعامَلَتي
فيكَ الخِصامُ وَأنتَ الخصْمُ وَالحكَمُ
أُعِيذُها نَظَراتٍ مِنْكَ صادِقَةً
أن تحسَبَ الشّحمَ فيمن شحمهُ وَرَمُ
وَمَا انْتِفَاعُ أخي الدّنْيَا بِنَاظِرِهِ
إذا اسْتَوَتْ عِنْدَهُ الأنْوارُ وَالظُّلَمُ
سَيعْلَمُ الجَمعُ ممّنْ ضَمّ مَجلِسُنا
بأنّني خَيرُ مَنْ تَسْعَى بهِ قَدَمُ
أنَا الذي نَظَرَ الأعْمَى إلى أدَبي
وَأَسْمَعَتْ كَلِماتي مَنْ بهِ صَمَمُ
أنَامُ مِلْءَ جُفوني عَنْ شَوَارِدِهَا
وَيَسْهَرُ الخَلْقُ جَرّاهَا وَيخْتَصِمُ
وَجاهِلٍ مَدّهُ فِي جَهْلِهِ ضَحِكي
حَتَّى أتَتْه يَدٌ فَرّاسَةٌ وَفَمُ
إذا رَأيْتَ نُيُوبَ اللّيْثِ بارِزَةً
فَلا تَظُنّنّ أنّ اللّيْثَ يَبتَسِمُ
وَمُهْجَةٍ مُهْجَتي من همّ صَاحِبها
أدرَكْتُهَا بجَوَادٍ ظَهْرُه حَرَمُ
رِجلاهُ فِي الرّكضِ رِجلٌ وَاليدانِ يَدٌ
وَفِعلُهُ ما تُريدُ الكَفُّ وَالقَدَمُ
وَمُرْهَفٍ سرْتُ بينَ الجَحْفَلَينِ بهِ
حتَّى ضرَبْتُ وَمَوْجُ المَوْتِ يَلْتَطِمُ
ألخَيْلُ وَاللّيْلُ وَالبَيْداءُ تَعرِفُني
وَالسّيفُ وَالرّمحُ والقرْطاسُ وَالقَلَمُ
صَحِبْتُ فِي الفَلَواتِ الوَحشَ منفَرِداً
حتى تَعَجّبَ مني القُورُ وَالأكَمُ
يَا مَنْ يَعِزّ عَلَيْنَا أنْ نُفَارِقَهُمْ
وَجدانُنا كُلَّ شيءٍ بَعدَكمْ عَدَمُ
مَا كانَ أخلَقَنَا مِنكُمْ بتَكرِمَةٍ
لَوْ أنّ أمْرَكُمُ مِن أمرِنَا أمَمُ
إنْ كانَ سَرّكُمُ ما قالَ حاسِدُنَا
فَمَا لجُرْحٍ إذا أرْضاكُمُ ألَمُ
وَبَيْنَنَا لَوْ رَعَيْتُمْ ذاكَ مَعرِفَةٌ
إنّ المَعارِفَ فِي أهْلِ النُّهَى ذِمَمُ
كم تَطْلُبُونَ لَنَا عَيْباً فيُعجِزُكمْ
وَيَكْرَهُ الله ما تَأتُونَ وَالكَرَمُ
ما أبعدَ العَيبَ والنّقصانَ منْ شَرَفِي
أنَا الثّرَيّا وَذانِ الشّيبُ وَالهَرَمُ
لَيْتَ الغَمَامَ الذي عندي صَواعِقُهُ
يُزيلُهُنّ إلى مَنْ عِنْدَهُ الدِّيَمُ
أرَى النّوَى يَقتَضيني كلَّ مَرْحَلَةٍ
لا تَستَقِلّ بِهَا الوَخّادَةُ الرُّسُمُ
لَئِنْ تَرَكْنَ ضُميراً عَنْ مَيامِنِنا
لَيَحْدُثَنّ لمَنْ وَدّعْتُهُمْ نَدَمُ
إذا تَرَحّلْتَ عن قَوْمٍ وَقَد قَدَرُوا
أنْ لا تُفارِقَهُمْ فالرّاحِلونَ هُمُ
شَرُّ البِلادِ مَكانٌ لا صَديقَ بِهِ
وَشَرُّ ما يَكسِبُ الإنسانُ ما يَصِمُ
وَشَرُّ ما قَنّصَتْهُ رَاحَتي قَنَصٌ
شُهْبُ البُزاةِ سَواءٌ فيهِ والرَّخَمُ
بأيّ لَفْظٍ تَقُولُ الشّعْرَ زِعْنِفَةٌ
تَجُوزُ عِندَكَ لا عُرْبٌ وَلا عَجَمُ
هَذا عِتابُكَ إلاّ أنّهُ مِقَةٌ
قد ضُمّنَ الدُّرَّ إلاّ أنّهُ كَلِمُ`;

// تجهيز عناصر القارئ

const poemVerses = document.getElementById("poemVerses");
const openMutanabi = document.getElementById("openMutanabi");
const poemReader = document.getElementById("poemReader");

let mutanabiDiacriticsVisible = true;

function renderMutanabi() {
    if (!poemVerses) return;

    poemVerses.innerHTML = mutanabiPoem
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const verse = mutanabiDiacriticsVisible
                ? line
                : stripDiacritics(line);

            return `<p class="verse">${verse}</p>`;
        })
        .join("");
}

// عرض أبيات القصيدة
renderMutanabi();

// فتح قارئ القصيدة

function openPoem() {
    if (!poemReader) {
        console.error("لم يتم العثور على العنصر poemReader في HTML");
        return;
    }

    poemReader.classList.remove("hidden");
    poemReader.hidden = false;
    poemReader.style.setProperty("display", "block", "important");

    poemReader.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

if (openMutanabi) {
    openMutanabi.addEventListener("click", function(event) {
        event.preventDefault();
        openPoem();
    });
} else {
    console.error("لم يتم العثور على الزر openMutanabi في HTML");
}

// 8. إظهار وإخفاء التشكيل

const toggleDiacritics = document.getElementById("toggleDiacritics");

toggleDiacritics?.addEventListener("click", event => {
    mutanabiDiacriticsVisible = !mutanabiDiacriticsVisible;
    renderMutanabi();

    event.currentTarget.textContent = mutanabiDiacriticsVisible
        ? "إزالة التشكيل"
        : "إعادة التشكيل";
});

// 9. تكبير وتصغير الخط

let poemFontSize = 20;

document.getElementById("increaseFont")?.addEventListener("click", () => {
    if (!poemVerses) return;

    poemFontSize = Math.min(poemFontSize + 2, 36);
    poemVerses.style.fontSize = poemFontSize + "px";
});

document.getElementById("decreaseFont")?.addEventListener("click", () => {
    if (!poemVerses) return;

    poemFontSize = Math.max(poemFontSize - 2, 14);
    poemVerses.style.fontSize = poemFontSize + "px";
});

// 10. نسخ القصيدة

document.getElementById("copyPoem")?.addEventListener("click", async () => {
    const copied = await copyText(mutanabiPoem);

    if (copied) {
        alert("تم نسخ القصيدة بنجاح");
    } else {
        alert("تعذر النسخ. حاولي تحديد النص ونسخه يدويًا.");
    }
});

// 11. الرجوع إلى مكتبة الشعر

document.getElementById("backToLibrary")?.addEventListener("click", () => {
    if (!poemReader) return;

    poemReader.classList.add("hidden");
    poemReader.style.removeProperty("display");
    poemReader.hidden = true;
});

// 12. إظهار وإخفاء شرح القصيدة

const explanationToggle = document.getElementById("explanationToggle");
const explanationContent = document.getElementById("explanationContent");
const explanationArrow = document.getElementById("explanationArrow");

if (explanationToggle && explanationContent) {
    explanationToggle.addEventListener("click", () => {
        const isHidden = explanationContent.hidden;

        explanationContent.hidden = !isHidden;

        explanationToggle.setAttribute(
            "aria-expanded",
            String(isHidden)
        );

        if (explanationArrow) {
            explanationArrow.textContent = isHidden ? "－" : "＋";
        }

        if (isHidden) {
            explanationContent.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        }
    });
} else {
    console.error("لم يتم العثور على زر الشرح أو محتوى الشرح");
}

console.log("تم تحميل قصيدة المتنبي بنجاح 🌿");
// ======================================
// 13. قصيدة أحمد شوقي - ريم على القاع
// قارئ مستقل تمامًا عن قارئ المتنبي
// ======================================

const shawqiPoem = `ريمٌ عَلى القاعِ بَينَ البانِ وَالعَلَمِ
أَحَلَّ سَفكَ دَمي في الأَشهُرِ الحُرُمِ
رَمى القَضاءُ بِعَينَي جُؤذَرٍ أَسَداً
يا ساكِنَ القاعِ أَدرِك ساكِنَ الأَجَمِ
لَمّا رَنا حَدَّثَتني النَفسُ قائِلَةً
يا وَيحَ جَنبِكَ بِالسَهمِ المُصيبِ رُمي
جَحَدتُها وَكَتَمتُ السَهمَ في كَبِدي
جُرحُ الأَحِبَّةِ عِندي غَيرُ ذي أَلَمِ
رُزِقتَ أَسمَحَ ما في الناسِ مِن خُلُقٍ
إِذا رُزِقتَ اِلتِماسَ العُذرِ في الشِيَمِ
يا لائِمي في هَواهُ وَالهَوى قَدَرٌ
لَو شَفَّكَ الوَجدُ لَم تَعذِل وَلَم تَلُمِ
لَقَد أَنَلتُكَ أُذناً غَيرَ واعِيَةٍ
وَرُبَّ مُنتَصِتٍ وَالقَلبُ في صَمَمِ
يا ناعِسَ الطَرفِ لا ذُقتَ الهَوى أَبَداً
أَسهَرتَ مُضناكَ في حِفظِ الهَوى فَنَمِ
أَفديكَ إِلفاً وَلا آلو الخَيالَ فِدىً
أَغراكَ باِلبُخلِ مَن أَغراهُ بِالكَرَمِ
سَرى فَصادَفَ جُرحاً دامِياً فَأَسا
وَرُبَّ فَضلٍ عَلى العُشّاقِ لِلحُلُمِ
مَنِ المَوائِسُ باناً بِالرُبى وَقَناً
اللاعِباتُ بِروحي السافِحاتُ دَمي
السافِراتُ كَأَمثالِ البُدورِ ضُحىً
يُغِرنَ شَمسَ الضُحى بِالحَليِ وَالعِصَمِ
القاتِلاتُ بِأَجفانٍ بِها سَقَمٌ
وَلِلمَنِيَّةِ أَسبابٌ مِنَ السَقَمِ
العاثِراتُ بِأَلبابِ الرِجالِ وَما
أُقِلنَ مِن عَثَراتِ الدَلِّ في الرَسَمِ
المُضرِماتُ خُدوداً أَسفَرَت وَجَلَت
عَن فِتنَةٍ تُسلِمُ الأَكبادَ لِلضَرَمِ
الحامِلاتُ لِواءَ الحُسنِ مُختَلِفاً
أَشكالُهُ وَهوَ فَردٌ غَيرُ مُنقَسِمِ
مِن كُلِّ بَيضاءَ أَو سَمراءَ زُيِّنَتا
لِلعَينِ وَالحُسنُ في الآرامِ كَالعُصُمِ
يُرَعنَ لِلبَصَرِ السامي وَمِن عَجَبٍ
إِذا أَشَرنَ أَسَرنَ اللَيثَ بِالغَنَمِ
وَضَعتُ خَدّي وَقَسَّمتُ الفُؤادَ رُبيً
يَرتَعنَ في كُنُسٍ مِنهُ وَفي أَكَمِ
يا بِنتَ ذي اللَبَدِ المُحَمّى جانِبُهُ
أَلقاكِ في الغابِ أَم أَلقاكِ في الأُطُمِ
ما كُنتُ أَعلَمُ حَتّى عَنَّ مَسكَنُهُ
أَنَّ المُنى وَالمَنايا مَضرِبُ الخِيَمِ
مَن أَنبَتَ الغُصنَ مِن صَمصامَةٍ ذَكَرٍ
وَأَخرَجَ الريمَ مِن ضِرغامَةٍ قَرِمِ
بَيني وَبَينُكِ مِن سُمرِ القَنا حُجُبٌ
وَمِثلَها عِفَّةٌ عُذرِيَّةُ العِصَمِ
لَم أَغشَ مَغناكِ إِلّا في غُضونِ كِرىً
مَغناكَ أَبعَدُ لِلمُشتاقِ مِن إِرَمِ
يا نَفسُ دُنياكِ تُخفى كُلَّ مُبكِيَةٍ
وَإِن بَدا لَكِ مِنها حُسنُ مُبتَسَمِ
فُضّي بِتَقواكِ فاهاً كُلَّما ضَحِكَت
كَما يَفُضُّ أَذى الرَقشاءِ بِالثَرَمِ
مَخطوبَةٌ مُنذُ كانَ الناسُ خاطِبَةٌ
مِن أَوَّلِ الدَهرِ لَم تُرمِل وَلَم تَئَمِ
يَفنى الزَمانُ وَيَبقى مِن إِساءَتِها
جُرحٌ بِآدَمَ يَبكي مِنهُ في الأَدَمِ
لا تَحفَلي بِجَناها أَو جِنايَتِها
المَوتُ بِالزَهرِ مِثلُ المَوتِ بِالفَحَمِ
كَم نائِمٍ لا يَراها وَهيَ ساهِرَةٌ
لَولا الأَمانِيُّ وَالأَحلامُ لَم يَنَمِ
طَوراً تَمُدُّكَ في نُعمى وَعافِيَةٍ
وَتارَةً في قَرارِ البُؤسِ وَالوَصَمِ
كَم ضَلَّلَتكَ وَمَن تُحجَب بَصيرَتُهُ
إِن يَلقَ صابا يَرِد أَو عَلقَماً يَسُمُ
يا وَيلَتاهُ لِنَفسي راعَها وَدَها
مُسوَدَّةُ الصُحفِ في مُبيَضَّةِ اللَمَمِ
رَكَضتُها في مَريعِ المَعصِياتِ وَما
أَخَذتُ مِن حِميَةِ الطاعاتِ لِلتُخَمِ
هامَت عَلى أَثَرِ اللَذّاتِ تَطلُبُها
وَالنَفسُ إِن يَدعُها داعي الصِبا تَهِمِ
صَلاحُ أَمرِكَ لِلأَخلاقِ مَرجِعُهُ
فَقَوِّمِ النَفسَ بِالأَخلاقِ تَستَقِمِ
وَالنَفسُ مِن خَيرِها في خَيرِ عافِيَةٍ
وَالنَفسُ مِن شَرِّها في مَرتَعٍ وَخِمِ
تَطغى إِذا مُكِّنَت مِن لَذَّةٍ وَهَوىً
طَغيَ الجِيادِ إِذا عَضَّت عَلى الشُكُمِ
إِن جَلَّ ذَنبي عَنِ الغُفرانِ لي أَمَلٌ
في اللَهِ يَجعَلُني في خَيرِ مُعتَصِمِ
أَلقى رَجائي إِذا عَزَّ المُجيرُ عَلى
مُفَرِّجِ الكَرَبِ في الدارَينِ وَالغَمَمِ
إِذا خَفَضتُ جَناحَ الذُلِّ أَسأَلُهُ
عِزَّ الشَفاعَةِ لَم أَسأَل سِوى أُمَمِ
وَإِن تَقَدَّمَ ذو تَقوى بِصالِحَةٍ
قَدَّمتُ بَينَ يَدَيهِ عَبرَةَ النَدَمِ
لَزِمتُ بابَ أَميرِ الأَنبِياءِ وَمَن
يُمسِك بِمِفتاحِ بابِ اللَهِ يَغتَنِمِ
فَكُلُّ فَضلٍ وَإِحسانٍ وَعارِفَةٍ
ما بَينَ مُستَلِمٍ مِنهُ وَمُلتَزِمِ
عَلَّقتُ مِن مَدحِهِ حَبلاً أُعَزُّ بِهِ
في يَومِ لا عِزَّ بِالأَنسابِ وَاللُحَمِ
يُزري قَريضي زُهَيراً حينَ أَمدَحُهُ
وَلا يُقاسُ إِلى جودي لَدى هَرَمِ
مُحَمَّدٌ صَفوَةُ الباري وَرَحمَتُهُ
وَبُغيَةُ اللَهِ مِن خَلقٍ وَمِن نَسَمِ
وَصاحِبُ الحَوضِ يَومَ الرُسلِ سائِلَةٌ
مَتى الوُورودُ وَجِبريلُ الأَمينُ ظَمي
سَناؤُهُ وَسَناهُ الشَمسُ طالِعَةً
فَالجِرمُ في فَلَكٍ وَالضَوءُ في عَلَمِ
قَد أَخطَأَ النَجمَ ما نالَت أُبُوَّتُهُ
مِن سُؤدُدٍ باذِخٍ في مَظهَرٍ سَنِمِ
نُموا إِلَيهِ فَزادوا في الوَرى شَرَفاً
وَرُبَّ أَصلٍ لِفَرعٍ في الفَخارِ نُمي
حَواهُ في سُبُحاتِ الطُهرِ قَبلَهُمُ
نورانِ قاما مَقامَ الصُلبِ وَالرَحِمِ
لَمّا رَآهُ بَحيرا قالَ نَعرِفُهُ
بِما حَفِظنا مِنَ الأَسماءِ وَالسِيَمِ
سائِل حِراءَ وَروحَ القُدسِ هَل عَلِما
مَصونَ سِرٍّ عَنِ الإِدراكِ مُنكَتِمِ
كَم جيئَةٍ وَذَهابٍ شُرِّفَت بِهِما
بَطحاءُ مَكَّةَ في الإِصباحِ وَالغَسَمِ
وَوَحشَةٍ لِاِبنِ عَبدِ اللَهِ بينَهُما
أَشهى مِنَ الأُنسِ بِالأَحسابِ وَالحَشَمِ
يُسامِرُ الوَحيَ فيها قَبلَ مَهبِطِهِ
وَمَن يُبَشِّر بِسيمى الخَيرِ يَتَّسِمِ
لَمّا دَعا الصَحبُ يَستَسقونَ مِن ظَمَإٍ
فاضَت يَداهُ مِنَ التَسنيمِ بِالسَنَمِ
وَظَلَّلَتهُ فَصارَت تَستَظِلُّ بِهِ
غَمامَةٌ جَذَبَتها خيرَةُ الدِيَمِ
مَحَبَّةٌ لِرَسولِ اللَهِ أُشرِبَها
قَعائِدُ الدَيرِ وَالرُهبانُ في القِمَمِ
إِنَّ الشَمائِلَ إِن رَقَّت يَكادُ بِها
يُغرى الجَمادُ وَيُغرى كُلُّ ذي نَسَمِ
وَنودِيَ اِقرَأ تَعالى اللَهُ قائِلُها
لَم تَتّصِل قَبلَ مَن قيلَت لَهُ بِفَمِ
هُناكَ أَذَّنَ لِلرَحَمَنِ فَاِمتَلَأَت
أَسماعُ مَكَّةَ مِن قُدسِيَّةِ النَغَمِ
فَلا تَسَل عَن قُرَيشٍ كَيفَ حَيرَتُها
وَكَيفَ نُفرَتُها في السَهلِ وَالعَلَمِ
تَساءَلوا عَن عَظيمٍ قَد أَلَمَّ بِهِم
رَمى المَشايِخَ وَالوِلدانِ بِاللَمَمِ
يا جاهِلينَ عَلى الهادي وَدَعوَتِهِ
هَل تَجهَلونَ مَكانَ الصادِقِ العَلَمِ
لَقَّبتُموهُ أَمينَ القَومِ في صِغَرٍ
وَما الأَمينُ عَلى قَولٍ بِمُتَّهَمِ
فاقَ البُدورَ وَفاقَ الأَنبِياءَ فَكَم
بِالخُلقِ وَالخَلقِ مِن حُسنٍ وَمِن عِظَمِ
جاءَ النبِيّونَ بِالآياتِ فَاِنصَرَمَت
وَجِئتَنا بِحَكيمٍ غَيرِ مُنصَرِمِ
آياتُهُ كُلَّما طالَ المَدى جُدَدٌ
يَزينُهُنَّ جَلالُ العِتقِ وَالقِدَمِ
يَكادُ في لَفظَةٍ مِنهُ مُشَرَّفَةٍ
يوصيكَ بِالحَقِّ وَالتَقوى وَبِالرَحِمِ
يا أَفصَحَ الناطِقينَ الضادَ قاطِبَةً
حَديثُكَ الشَهدُ عِندَ الذائِقِ الفَهِمِ
حَلَّيتَ مِن عَطَلٍ جيدَ البَيانِ بِهِ
في كُلِّ مُنتَثِرٍ في حُسنِ مُنتَظِمِ
بِكُلِّ قَولٍ كَريمٍ أَنتَ قائِلُهُ
تُحيِ القُلوبَ وَتُحيِ مَيِّتَ الهِمَمِ
سَرَت بَشائِرُ باِلهادي وَمَولِدِهِ
في الشَرقِ وَالغَربِ مَسرى النورِ في الظُلَمِ
تَخَطَّفَت مُهَجَ الطاغينَ مِن عَرَبٍ
وَطَيَّرَت أَنفُسَ الباغينَ مِن عُجُمِ
ريعَت لَها شَرَفُ الإيوانِ فَاِنصَدَعَت
مِن صَدمَةِ الحَقِّ لا مِن صَدمَةِ القُدُمِ
أَتَيتَ وَالناسُ فَوضى لا تَمُرُّ بِهِم
إِلّا عَلى صَنَمٍ قَد هامَ في صَنَمِ
وَالأَرضُ مَملوءَةٌ جَوراً مُسَخَّرَةٌ
لِكُلِّ طاغِيَةٍ في الخَلقِ مُحتَكِمِ
مُسَيطِرُ الفُرسِ يَبغي في رَعِيَّتِهِ
وَقَيصَرُ الرومِ مِن كِبرٍ أَصَمُّ عَمِ
يُعَذِّبانِ عِبادَ اللَهِ في شُبَهٍ
وَيَذبَحانِ كَما ضَحَّيتَ بِالغَنَمِ
وَالخَلقُ يَفتِكُ أَقواهُم بِأَضعَفِهِم
كَاللَيثِ بِالبَهمِ أَو كَالحوتِ بِالبَلَمِ
أَسرى بِكَ اللَهُ لَيلاً إِذ مَلائِكُهُ
وَالرُسلُ في المَسجِدِ الأَقصى عَلى قَدَمِ
لَمّا خَطَرتَ بِهِ اِلتَفّوا بِسَيِّدِهِم
كَالشُهبِ بِالبَدرِ أَو كَالجُندِ بِالعَلَمِ
صَلّى وَراءَكَ مِنهُم كُلُّ ذي خَطَرٍ
وَمَن يَفُز بِحَبيبِ اللَهِ يَأتَمِمِ
جُبتَ السَماواتِ أَو ما فَوقَهُنَّ بِهِم
عَلى مُنَوَّرَةٍ دُرِّيَّةِ اللُجُمِ
رَكوبَةً لَكَ مِن عِزٍّ وَمِن شَرَفٍ
لا في الجِيادِ وَلا في الأَينُقِ الرُسُمِ
مَشيئَةُ الخالِقِ الباري وَصَنعَتُهُ
وَقُدرَةُ اللَهِ فَوقَ الشَكِّ وَالتُهَمِ
حَتّى بَلَغتَ سَماءً لا يُطارُ لَها
عَلى جَناحٍ وَلا يُسعى عَلى قَدَمِ
وَقيلَ كُلُّ نَبِيٍّ عِندَ رُتبَتِهِ
وَيا مُحَمَّدُ هَذا العَرشُ فَاِستَلِمِ
خَطَطتَ لِلدينِ وَالدُنيا عُلومَهُما
يا قارِئَ اللَوحِ بَل يا لامِسَ القَلَمِ
أَحَطتَ بَينَهُما بِالسِرِّ وَاِنكَشَفَت
لَكَ الخَزائِنُ مِن عِلمٍ وَمِن حِكَمِ
وَضاعَفَ القُربُ ما قُلِّدتَ مِن مِنَنٍ
بِلا عِدادٍ وَما طُوِّقتَ مِن نِعَمِ
سَل عُصبَةَ الشِركِ حَولَ الغارِ سائِمَةً
لَولا مُطارَدَةُ المُختارِ لَم تُسَمِ
هَل أَبصَروا الأَثَرَ الوَضّاءَ أَم سَمِعوا
هَمسَ التَسابيحِ وَالقُرآنِ مِن أُمَمِ
وَهَل تَمَثَّلَ نَسجُ العَنكَبوتِ لَهُم
كَالغابِ وَالحائِماتُ وَالزُغبُ كَالرُخَمِ
فَأَدبَروا وَوُجوهُ الأَرضِ تَلعَنُهُم
كَباطِلٍ مِن جَلالِ الحَقِّ مُنهَزِمِ
لَولا يَدُ اللَهِ بِالجارَينَ ما سَلِما
وَعَينُهُ حَولَ رُكنِ الدينِ لَم يَقُمِ
تَوارَيا بِجَناحِ اللَهِ وَاِستَتَرا
وَمَن يَضُمُّ جَناحُ اللَهِ لا يُضَمِ
يا أَحمَدَ الخَيرِ لي جاهٌ بِتَسمِيَتي
وَكَيفَ لا يَتَسامى بِالرَسولِ سَمي
المادِحونَ وَأَربابُ الهَوى تَبَعٌ
لِصاحِبِ البُردَةِ الفَيحاءِ ذي القَدَمِ
مَدييحُهُ فيكَ حُبٌّ خالِصٌ وَهَوىً
وَصادِقُ الحُبِّ يُملي صادِقَ الكَلَمِ
اللَهُ يَشهَدُ أَنّي لا أُعارِضُهُ
من ذا يُعارِضُ صَوبَ العارِضِ العَرِمِ
وَإِنَّما أَنا بَعضُ الغابِطينَ وَمَن
يَغبِط وَلِيَّكَ لا يُذمَم وَلا يُلَمِ
هَذا مَقامٌ مِنَ الرَحمَنِ مُقتَبَسٌ
تَرمي مَهابَتُهُ سَحبانَ بِالبَكَمِ
البَدرُ دونَكَ في حُسنٍ وَفي شَرَفٍ
وَالبَحرُ دونَكَ في خَيرٍ وَفي كَرَمِ
شُمُّ الجِبالِ إِذا طاوَلتَها اِنخَفَضَت
وَالأَنجُمُ الزُهرُ ما واسَمتَها تَسِمِ
وَاللَيثُ دونَكَ بَأساً عِندَ وَثبَتِهِ
إِذا مَشَيتَ إِلى شاكي السِلاحِ كَمي
تَهفو إِلَيكَ وَإِن أَدمَيتَ حَبَّتَها
في الحَربِ أَفئِدَةُ الأَبطالِ وَالبُهَمِ
مَحَبَّةُ اللَهِ أَلقاها وَهَيبَتُهُ
عَلى اِبنِ آمِنَةٍ في كُلِّ مُصطَدَمِ
كَأَنَّ وَجهَكَ تَحتَ النَقعِ بَدرُ دُجىً
يُضيءُ مُلتَثِماً أَو غَيرَ مُلتَثِمِ
بَدرٌ تَطَلَّعَ في بَدرٍ فَغُرَّتُهُ
كَغُرَّةِ النَصرِ تَجلو داجِيَ الظُلَمِ
ذُكِرتَ بِاليُتمِ في القُرآنِ تَكرِمَةً
وَقيمَةُ اللُؤلُؤِ المَكنونِ في اليُتُمِ
اللَهُ قَسَّمَ بَينَ الناسِ رِزقَهُمُ
وَأَنتَ خُيِّرتَ في الأَرزاقِ وَالقِسَمِ
إِن قُلتَ في الأَمرِ لا أَو قُلتَ فيهِ نَعَم
فَخيرَةُ اللَهِ في لا مِنكَ أَو نَعَمِ
أَخوكَ عيسى دَعا مَيتاً فَقامَ لَهُ
وَأَنتَ أَحيَيتَ أَجيالاً مِنَ الزِمَمِ
وَالجَهلُ مَوتٌ فَإِن أوتيتَ مُعجِزَةً
فَاِبعَث مِنَ الجَهلِ أَو فَاِبعَث مِنَ الرَجَمِ
قالوا غَزَوتَ وَرُسلُ اللَهِ ما بُعِثوا
لِقَتلِ نَفسٍ وَلا جاؤوا لِسَفكِ دَمِ
جَهلٌ وَتَضليلُ أَحلامٍ وَسَفسَطَةٌ
فَتَحتَ بِالسَيفِ بَعدَ الفَتحِ بِالقَلَمِ
لَمّا أَتى لَكَ عَفواً كُلُّ ذي حَسَبٍ
تَكَفَّلَ السَيفُ بِالجُهّالِ وَالعَمَمِ
وَالشَرُّ إِن تَلقَهُ بِالخَيرِ ضِقتَ بِهِ
ذَرعاً وَإِن تَلقَهُ بِالشَرِّ يَنحَسِمِ
سَلِ المَسيحِيَّةَ الغَرّاءَ كَم شَرِبَت
بِالصابِ مِن شَهَواتِ الظالِمِ الغَلِمِ
طَريدَةُ الشِركِ يُؤذيها وَيوسِعُها
في كُلِّ حينٍ قِتالاً ساطِعَ الحَدَمِ
لَولا حُماةٌ لَها هَبّوا لِنُصرَتِها
بِالسَيفِ ما اِنتَفَعَت بِالرِفقِ وَالرُحَمِ
لَولا مَكانٌ لِعيسى عِندَ مُرسِلِهِ
وَحُرمَةٌ وَجَبَت لِلروحِ في القِدَمِ
لَسُمِّرَ البَدَنُ الطُهرُ الشَريفُ عَلى
لَوحَينِ لَم يَخشَ مُؤذيهِ وَلَم يَجِمِ
جَلَّ المَسيحُ وَذاقَ الصَلبَ شانِئُهُ
إِنَّ العِقابَ بِقَدرِ الذَنبِ وَالجُرُمِ
أَخو النَبِيِّ وَروحُ اللَهِ في نُزُلٍ
فَوقَ السَماءِ وَدونَ العَرشِ مُحتَرَمِ
عَلَّمتَهُم كُلَّ شَيءٍ يَجهَلونَ بِهِ
حَتّى القِتالَ وَما فيهِ مِنَ الذِمَمِ
دَعَوتَهُم لِجِهادٍ فيهِ سُؤدُدُهُم
وَالحَربُ أُسُّ نِظامِ الكَونِ وَالأُمَمِ
لَولاهُ لَم نَرَ لِلدَولاتِ في زَمَنٍ
ما طالَ مِن عُمُدٍ أَو قَرَّ مِن دُهُمِ
تِلكَ الشَواهِدُ تَترى كُلَّ آوِنَةٍ
في الأَعصُرِ الغُرِّ لا في الأَعصُرِ الدُهُمِ
بِالأَمسِ مالَت عُروشٌ وَاِعتَلَت سُرُرٌ
لَولا القَذائِفُ لَم تَثلَم وَلَم تَصُمِ
أَشياعُ عيسى أَعَدّوا كُلَّ قاصِمَةٍ
وَلَم نُعِدُّ سِوى حالاتِ مُنقَصِمِ
مَهما دُعيتَ إِلى الهَيجاءِ قُمتَ لَها
تَرمي بِأُسدٍ وَيَرمي اللَهُ بِالرُجُمِ
عَلى لِوائِكَ مِنهُم كُلُّ مُنتَقِمٍ
لِلَّهِ مُستَقتِلٍ في اللَهِ مُعتَزِمِ
مُسَبِّحٍ لِلِقاءِ اللَهِ مُضطَرِمٍ
شَوقاً عَلى سابِخٍ كَالبَرقِ مُضطَرِمِ
لَو صادَفَ الدَهرَ يَبغي نَقلَةً فَرَمى
بِعَزمِهِ في رِحالِ الدَهرِ لَم يَرِمِ
بيضٌ مَفاليلُ مِن فِعلِ الحُروبِ بِهِم
مِن أَسيُفِ اللَهِ لا الهِندِيَّةُ الخُذُمُ
كَم في التُرابِ إِذا فَتَّشتَ عَن رَجُلٍ
مَن ماتَ بِالعَهدِ أَو مَن ماتَ بِالقَسَمِ
لَولا مَواهِبُ في بَعضِ الأَنامِ لَما
تَفاوَتَ الناسُ في الأَقدارِ وَالقِيَمِ
شَريعَةٌ لَكَ فَجَّرتَ العُقولَ بِها
عَن زاخِرٍ بِصُنوفِ العِلمِ مُلتَطِمِ
يَلوحُ حَولَ سَنا التَوحيدِ جَوهَرُها
كَالحَليِ لِلسَيفِ أَو كَالوَشيِ لِلعَلَمِ
غَرّاءُ حامَت عَلَيها أَنفُسٌ وَنُهىً
وَمَن يَجِد سَلسَلاً مِن حِكمَةٍ يَحُمِ
نورُ السَبيلِ يُساسُ العالِمونَ بِها
تَكَفَّلَت بِشَبابِ الدَهرِ وَالهَرَمِ
يَجري الزَمانُ وَأَحكامُ الزَمانِ عَلى
حُكمٍ لَها نافِذٍ في الخَلقِ مُرتَسِمِ
لَمّا اِعتَلَت دَولَةُ الإِسلامِ وَاِتَّسَعَت
مَشَت مَمالِكُهُ في نورِها التَمَمِ
وَعَلَّمَت أُمَّةً بِالقَفرِ نازِلَةً
رَعيَ القَياصِرِ بَعدَ الشاءِ وَالنَعَمِ
كَم شَيَّدَ المُصلِحونَ العامِلونَ بِها
في الشَرقِ وَالغَربِ مُلكاً باذِخَ العِظَمِ
لِلعِلمِ وَالعَدلِ وَالتَمدينِ ما عَزَموا
مِنَ الأُمورِ وَما شَدّوا مِنَ الحُزُمِ
سُرعانَ ما فَتَحوا الدُنيا لِمِلَّتِهِم
وَأَنهَلوا الناسَ مِن سَلسالِها الشَبِمِ
ساروا عَلَيها هُداةَ الناسِ فَهيَ بِهِم
إِلى الفَلاحِ طَريقٌ واضِحُ العَظَمِ
لا يَهدِمُ الدَهرُ رُكناً شادَ عَدلَهُمُ
وَحائِطُ البَغيِ إِن تَلمَسهُ يَنهَدِمِ
نالوا السَعادَةَ في الدارَينِ وَاِجتَمَعوا
عَلى عَميمٍ مِنَ الرُضوانِ مُقتَسَمِ
دَع عَنكَ روما وَآثينا وَما حَوَتا
كُلُّ اليَواقيتِ في بَغدادَ وَالتُوَمِ
وَخَلِّ كِسرى وَإِيواناً يَدِلُّ بِهِ
هَوىً عَلى أَثَرِ النيرانِ وَالأَيُمِ
وَاِترُك رَعمَسيسَ إِنَّ المُلكَ مَظهَرُهُ
في نَهضَةِ العَدلِ لا في نَهضَةِ الهَرَمِ
دارُ الشَرائِعِ روما كُلَّما ذُكِرَت
دارُ السَلامِ لَها أَلقَت يَدَ السَلَمِ
ما ضارَعَتها بَياناً عِندَ مُلتَأَمٍ
وَلا حَكَتها قَضاءً عِندَ مُختَصَمِ
وَلا اِحتَوَت في طِرازٍ مِن قَياصِرِها
عَلى رَشيدٍ وَمَأمونٍ وَمُعتَصِمِ
مَنِ الَّذينَ إِذا سارَت كَتائِبُهُم
تَصَرَّفوا بِحُدودِ الأَرضِ وَالتُخَمِ
وَيَجلِسونَ إِلى عِلمٍ وَمَعرِفَةٍ
فَلا يُدانَونَ في عَقلٍ وَلا فَهَمِ
يُطَأطِئُ العُلَماءُ الهامَ إِن نَبَسوا
مِن هَيبَةِ العِلمِ لا مِن هَيبَةِ الحُكُمِ
وَيُمطِرونَ فَما بِالأَرضِ مِن مَحَلٍ
وَلا بِمَن باتَ فَوقَ الأَرضِ مِن عُدُمِ
خَلائِفُ اللَهِ جَلّوا عَن مُوازَنَةٍ
فَلا تَقيسَنَّ أَملاكَ الوَرى بِهِمِ
مَن في البَرِيَّةِ كَالفاروقِ مَعدَلَةً
وَكَاِبنِ عَبدِ العَزيزِ الخاشِعِ الحَشِمِ
وَكَالإِمامِ إِذا ما فَضَّ مُزدَحِماً
بِمَدمَعٍ في مَآقي القَومِ مُزدَحِمِ
الزاخِرُ العَذبُ في عِلمٍ وَفي أَدَبٍ
وَالناصِرُ النَدبِ في حَربٍ وَفي سَلَمِ
أَو كَاِبنِ عَفّانَ وَالقُرآنُ في يَدِهِ
يَحنو عَلَيهِ كَما تَحنو عَلى الفُطُمِ
وَيَجمَعُ الآيَ تَرتيباً وَيَنظُمُها
عِقداً بِجيدِ اللَيالي غَيرَ مُنفَصِمِ
جُرحانِ في كَبِدِ الإِسلامِ ما اِلتَأَما
جُرحُ الشَهيدِ وَجُرحٌ بِالكِتابِ دَمي
وَما بَلاءُ أَبي بَكرٍ بِمُتَّهَمٍ
بَعدَ الجَلائِلِ في الأَفعالِ وَالخِدَمِ
بِالحَزمِ وَالعَزمِ حاطَ الدينَ في مِحَنٍ
أَضَلَّتِ الحُلمَ مِن كَهلٍ وَمُحتَلِمِ
وَحِدنَ بِالراشِدِ الفاروقِ عَن رُشدٍ
في المَوتِ وَهوَ يَقينٌ غَيرُ مُنبَهِمِ
يُجادِلُ القَومَ مُستَلّاً مُهَنَّدَهُ
في أَعظَمِ الرُسلِ قَدراً كَيفَ لَم يَدُمِ
لا تَعذُلوهُ إِذا طافَ الذُهولُ بِهِ
ماتَ الحَبيبُ فَضَلَّ الصَبُّ عَن رَغَمِ
يا رَبِّ صَلِّ وَسَلِّم ما أَرَدتَ عَلى
نَزيلِ عَرشِكَ خَيرِ الرُسلِ كُلِّهِمِ
مُحيِ اللَيالي صَلاةً لا يُقَطِّعُها
إِلّا بِدَمعٍ مِنَ الإِشفاقِ مُنسَجِمِ
مُسَبِّحاً لَكَ جُنحَ اللَيلِ مُحتَمِلاً
ضُرّاً مِنَ السُهدِ أَو ضُرّاً مِنَ الوَرَمِ
رَضِيَّةٌ نَفسُهُ لا تَشتَكي سَأَماً
وَما مَعَ الحُبِّ إِن أَخلَصتَ مِن سَأَمِ
وَصَلِّ رَبّي عَلى آلٍ لَهُ نُخَبٍ
جَعَلتَ فيهِم لِواءَ البَيتِ وَالحَرَمِ
بيضُ الوُجوهِ وَوَجهُ الدَهرِ ذو حَلَكٍ
شُمُّ الأُنوفِ وَأَنفُ الحادِثاتِ حَمى
وَأَهدِ خَيرَ صَلاةٍ مِنكَ أَربَعَةً
في الصَحبِ صُحبَتُهُم مَرعِيَّةُ الحُرَمِ
الراكِبينَ إِذا نادى النَبِيُّ بِهِم
ما هالَ مِن جَلَلٍ وَاِشتَدَّ مِن عَمَمِ
الصابِرينَ وَنَفسُ الأَرضِ واجِفَةٌ
الضاحِكينَ إِلى الأَخطارِ وَالقُحَمِ
يا رَبِّ هَبَّت شُعوبٌ مِن مَنِيَّتِها
وَاِستَيقَظَت أُمَمٌ مِن رَقدَةِ العَدَمِ
سَعدٌ وَنَحسٌ وَمُلكٌ أَنتَ مالِكُهُ
تُديلُ مِن نِعَمٍ فيهِ وَمِن نِقَمِ
رَأى قَضاؤُكَ فينا رَأيَ حِكمَتِهِ
أَكرِم بِوَجهِكَ مِن قاضٍ وَمُنتَقِمِ
فَاِلطُف لِأَجلِ رَسولِ العالَمينَ بِنا
وَلا تَزِد قَومَهُ خَسفاً وَلا تُسِمِ
يا رَبِّ أَحسَنتَ بَدءَ المُسلِمينَ بِهِ
فَتَمِّمِ الفَضلَ وَاِمنَح حُسنَ مُختَتَمِ`;

(function initShawqiReader() {
    const library = document.querySelector(".poem-library");
    if (!library) return;

    const shawqiCard = document.createElement("article");
    shawqiCard.className = "poem-card shawqi-card";
    shawqiCard.innerHTML = `
        <div class="poem-card-decoration">۞</div>
        <span class="poem-era">الشعر الحديث – مدرسة الإحياء</span>
        <h3>ريم على القاع بين البان والعلم</h3>
        <p class="poem-author">أحمد شوقي</p>
        <div class="poem-card-meta">
            <span>${shawqiPoem.trim().split("\n").length / 2 | 0} بيتًا تقريبًا</span>
            <span>مدائح نبوية</span>
        </div>
        <button class="primary-button" id="openShawqi">افتح القصيدة ←</button>
    `;
    library.appendChild(shawqiCard);

    const reader = document.createElement("section");
    reader.id = "shawqiReader";
    reader.className = "poem-reader shawqi-reader";
    reader.hidden = true;
    reader.innerHTML = `
      <button class="back-button" id="backFromShawqi">→ العودة إلى الديوان</button>
      <article class="manuscript">
       <div class="manuscript-frame">
        <div class="manuscript-ornament">۞</div>
        <span class="eyebrow">ديوان الشعر العربي</span>
        <h2 class="poem-title">ريم على القاع بين البان والعلم</h2>
        <div class="poet-profile">
          <span class="poet-symbol">أمير الشعراء</span>
          <div><h3>أحمد شوقي</h3><p>شاعر مصري – مدرسة الإحياء</p></div>
          <span class="era-label">العصر الحديث</span>
        </div>
        <div class="poem-toolbar">
          <button id="shawqiDiacritics">إزالة التشكيل</button>
          <button id="shawqiFavorite">☆ إضافة للمفضلة</button>
          <button id="shawqiCopy">نسخ القصيدة</button>
          <button id="shawqiDecrease">A−</button>
          <button id="shawqiIncrease">A+</button>
          <button id="shawqiShare">مشاركة</button>
        </div>
        <div class="verse-count">${shawqiPoem.trim().split("\n").length} شطرًا من القصيدة</div>
        <div id="shawqiVerses" class="poem-verses"></div>
        <div class="manuscript-ornament">❖ ۞ ❖</div>
        <div class="poem-explanation">
          <button id="shawqiExplanationToggle" class="explanation-heading" aria-expanded="false" aria-controls="shawqiExplanationContent">
            <span>✧ رحلة في معاني القصيدة</span><span id="shawqiExplanationArrow">＋</span>
          </button>
          <div id="shawqiExplanationContent" hidden>
            <div class="analysis-intro">
              <span class="analysis-label">قراءة أدبية</span>
              <h3>عن القصيدة</h3>
              <p>قصيدة «ريم على القاع بين البان والعلم» من قصائد أحمد شوقي، وتُعرف أيضًا بقصيدة نهج البردة. يبدأ الشاعر بمقدمة وجدانية، ثم ينتقل إلى تأملات في الدنيا والنفس والأخلاق، وبعدها يمدح النبي محمدًا ﷺ، ويتناول السيرة النبوية ومكانة الرسالة، ثم يعرض صفحات من التاريخ والحضارة الإسلامية ويختم بالصلاة والدعاء.</p>
            </div>
            <div class="explanation-part">
              <h3>المحور الأول: المقدمة الغزلية</h3>
              <p>يفتتح شوقي القصيدة بصورة «الريم»؛ أي الظبي، ويستخدم ألفاظ الطبيعة والصيد والسهام ليصوّر أثر الجمال في النفس. وتقوم الأبيات الأولى على التشبيه والاستعارة والتعبير الوجداني.</p>
            </div>
            <div class="explanation-part">
              <h3>المحور الثاني: التأمل في الدنيا والنفس</h3>
              <p>ينتقل الشاعر إلى التحذير من تقلّب الدنيا وخداع مظاهرها، ثم يدعو إلى تهذيب النفس وتقويمها بالأخلاق والتقوى، ويؤكد أن صلاح الإنسان يبدأ من إصلاح سلوكه.</p>
            </div>
            <div class="explanation-part">
              <h3>المحور الثالث: المديح النبوي والسيرة</h3>
              <p>يخصص شوقي مساحة واسعة لمدح النبي ﷺ، فيذكر صفاته ومكانته، وميلاده، والوحي، والهجرة، والإسراء والمعراج، وما ارتبط بسيرته من دلائل النبوة ومواقف الثبات.</p>
            </div>
            <div class="explanation-part">
              <h3>المحور الرابع: الرسالة والحضارة</h3>
              <p>يعرض الشاعر أثر الرسالة في نقل الناس من الجهل والظلم إلى العلم والعدل، ويستحضر نماذج من التاريخ الإسلامي، ويقارن بين مظاهر القوة المادية وقيم العلم والإنصاف.</p>
            </div>
            <div class="explanation-part">
              <h3>المحور الخامس: الصلاة والدعاء</h3>
              <p>تختم القصيدة بالصلاة على النبي ﷺ وآله وصحبه، ثم بالدعاء للأمة باللطف والرحمة وحسن العاقبة.</p>
            </div>
            <div class="explanation-part">
              <h3>مفردات مختارة</h3>
              <dl class="vocabulary">
                <dt>الريم</dt><dd>الظبي الأبيض.</dd>
                <dt>البان</dt><dd>شجر معروف بطول أغصانه ولينها.</dd>
                <dt>العَلَم</dt><dd>الجبل أو العلامة البارزة.</dd>
                <dt>الأَجَم</dt><dd>موضع كثيف الشجر تتخذه السباع مأوى.</dd>
                <dt>الشِيَم</dt><dd>الطباع والأخلاق.</dd>
                <dt>الوَجد</dt><dd>شدة الحب أو الحزن بحسب السياق.</dd>
                <dt>العِصَم</dt><dd>ما يُعتصم به، وتأتي بمعنى الحماية والمنعة.</dd>
                <dt>القَنا</dt><dd>الرماح.</dd>
                <dt>الدِيَم</dt><dd>الأمطار الهادئة المتتابعة.</dd>
                <dt>الهِمم</dt><dd>العزائم والإرادات.</dd>
              </dl>
            </div>
            <div class="explanation-part">
              <h3>صور بلاغية وفنية</h3>
              <ul>
                <li>«أحل سفك دمي في الأشهر الحرم»: تصوير أثر الجمال بصورة السهم والقتل المعنوي.</li>
                <li>«يا ساكن القاع أدرك ساكن الأجم»: مقابلة مكانية بين القاع والأجم، وفيها حركة تصويرية.</li>
                <li>«صلاح أمرك للأخلاق مرجعه»: أسلوب حكمي مباشر يوجز فكرة القصيدة الأخلاقية.</li>
                <li>تتكرر الاستعارات والتشبيهات في وصف الطبيعة والسيرة ومكانة النبي ﷺ.</li>
              </ul>
            </div>
            <div class="explanation-part">
              <h3>نبذة عن أحمد شوقي</h3>
              <p>أحمد شوقي (1868–1932) شاعر مصري بارز، لُقّب بأمير الشعراء، وكان من أعلام مدرسة الإحياء والبعث. جمع في شعره بين التراث العربي والموضوعات الوطنية والاجتماعية والمدائح النبوية والمسرح الشعري.</p>
            </div>
            <p class="editorial-note">ملاحظة: عُرض النص كما أُرسل في المحادثة. قد تختلف بعض الألفاظ أو الضبط بين طبعات القصيدة ورواياتها.</p>
          </div>
        </div>
        <div class="manuscript-ornament">۞</div>
       </div>
      </article>`;
    library.parentElement.appendChild(reader);

    const style = document.createElement("style");
    style.textContent = `
      .shawqi-card { margin-top: 22px; }
      #shawqiReader[hidden] { display:none !important; }
      #shawqiReader { margin-top:28px; }
      #shawqiVerses { font-size:20px; }
      #shawqiVerses .verse { line-height:2.15; }
      #shawqiVerses.no-diacritics { direction:rtl; }
      #shawqiVerses.no-diacritics .verse { }
      @media(max-width:600px) {
        .shawqi-card { margin-top:16px; }
        #shawqiReader .poem-toolbar { flex-wrap:wrap; }
      }`;
    document.head.appendChild(style);

    const verses = reader.querySelector("#shawqiVerses");
    let showMarks = true;
    let fontSize = 20;
    let favorite = readFavorites();
    const poemKey = "shawqi-ream";

    const renderVerses = () => {
        verses.innerHTML = shawqiPoem.trim().split("\n").map(line =>
            `<p class="verse">${showMarks ? line : stripDiacritics(line)}</p>`
        ).join("");
    };

    renderVerses();

    const openButton = reader.parentElement.querySelector("#openShawqi");

    openButton.addEventListener("click", () => {
        reader.hidden = false;
        reader.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    reader.querySelector("#backFromShawqi").addEventListener("click", () => {
        reader.hidden = true;
        shawqiCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });

    reader.querySelector("#shawqiDiacritics").addEventListener("click", event => {
        showMarks = !showMarks;
        event.currentTarget.textContent = showMarks
            ? "إزالة التشكيل"
            : "إعادة التشكيل";
        renderVerses();
    });

    reader.querySelector("#shawqiFavorite").addEventListener("click", event => {
        favorite = favorite.includes(poemKey)
            ? favorite.filter(x => x !== poemKey)
            : [...favorite, poemKey];

        writeFavorites(favorite);

        event.currentTarget.textContent = favorite.includes(poemKey)
            ? "★ في المفضلة"
            : "☆ إضافة للمفضلة";
    });

    if (favorite.includes(poemKey)) {
        reader.querySelector("#shawqiFavorite").textContent = "★ في المفضلة";
    }

    reader.querySelector("#shawqiCopy").addEventListener("click", async () => {
        const copied = await copyText(shawqiPoem);

        alert(copied
            ? "تم نسخ قصيدة أحمد شوقي."
            : "تعذر النسخ. حددي النص وانسخيه يدويًا.");
    });

    reader.querySelector("#shawqiIncrease").addEventListener("click", () => {
        fontSize = Math.min(fontSize + 2, 36);
        verses.style.fontSize = fontSize + "px";
    });

    reader.querySelector("#shawqiDecrease").addEventListener("click", () => {
        fontSize = Math.max(fontSize - 2, 14);
        verses.style.fontSize = fontSize + "px";
    });

    reader.querySelector("#shawqiShare").addEventListener("click", async () => {
        const shareData = {
            title: "ريم على القاع بين البان والعلم – أحمد شوقي",
            text: "قصيدة أحمد شوقي: ريم على القاع بين البان والعلم"
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                if (error.name !== "AbortError") {
                    alert("تعذرت المشاركة.");
                }
            }
        } else {
            const copied = await copyText(shareData.title);
            alert(copied
                ? "نُسخ عنوان القصيدة لمشاركته."
                : "المشاركة غير متاحة في هذا المتصفح.");
        }
    });

    const toggle = reader.querySelector("#shawqiExplanationToggle");
    const content = reader.querySelector("#shawqiExplanationContent");

    toggle.addEventListener("click", () => {
        const opening = content.hidden;
        content.hidden = !opening;

        toggle.setAttribute("aria-expanded", String(opening));

        reader.querySelector("#shawqiExplanationArrow").textContent =
            opening ? "－" : "＋";
    });
})();
// ==============================================
// 14. أبو العلاء المعري - أفوق البدر يوضع لي مهاد
// قارئ مستقل مع 51 بيتًا ووظائفه الخاصة
// ==============================================

const maarriPoemPairs = [
  ["أفَوْقَ البَدْرِ يُوضَعُ لي مِهَادُ", "أمِ الجوْزاءُ تحْتَ يدِي وِسادُ"],
  ["قَنِعْتُ فخِلْتُ أنّ النجْمَ دوني", "وسِيّانِ التّقَنّعُ والجِهادُ"],
  ["وأطْرَبَني الشّبابُ غَداةَ ولّى", "فليْتَ سِنِيهِ صوْتٌ يُسْتَعادُ"],
  ["وليس صِبا يُفادُ وراء شيْبٍ", "بأعْوَزَ مِن أخي ثِقَةٍ يُفادُ"],
  ["كأني حيثُ يَنْشا الدَّجْنُ تحتي", "فها أنا لا أُطَلّ ولا أُجادُ"],
  ["رُوَيْدَكَ أيّها العاوي ورائي", "لتُخْبِرَني متى نَطَقَ الجَمادُ"],
  ["سِفاهٌ ذادَ عنْكَ الناسَ حِلْمٌ", "وَغَيٌّ فيه مَنْفَعَةٌ رَشادُ"],
  ["أأخْمُلُ والنّبَاهَةُ فيّ لَفْظٌ", "وأُقْتِرُ والقَناعَةُ لي عَتادُ"],
  ["وألْقى الموْتَ لم تَخِدِ المَطايا", "بحاجاتي ولم تَجِفِ الجِيادُ"],
  ["ولو قِيل اسْألوا شَرَفاً لقُلْنا", "يَعيشُ لنا الأميرُ ولا نُزادُ"],
  ["شكَا فتَشكّتِ الدّنيا ومادَتْ", "بأهْلِيهَا الغَوَائِرُ والنّجادُ"],
  ["وأُرْعِدَتِ القنا زَمَعاً وخَوْفاً", "لذلك والمُهنّدَةُ الحِدادُ"],
  ["وكيفَ يَقِرّ قلْبٌ في ضُلوعٍ", "وقد رَجَفَتْ لِعِلّتِهِ البِلادُ"],
  ["بَنى من جَوْهَرِ العَلْياء بيْتاً", "كأنّ النّيّراتِ له عِمادُ"],
  ["إذا شَمسُ الضّحَى نَظَرَتْ إليه", "أقَرّتْ أنّ حُلّتَها حِدادُ"],
  ["فلولا اللهُ قال الناس أضْحَتْ", "ثمانِيَةً به السّبْعُ الشّدادُ"],
  ["أغَرُّ نَمَتْهُ من غَسّانَ غُرّ", "تَدِينُ لعِزّهِمْ إرَمٌ وعادُ"],
  ["بَنُو أمْلاكِ جَفْنَةَ قَرّبَتْهُمْ", "إلى الرّومِ اللّجَاجَةُ والعِنادُ"],
  ["أرادَتْ أن تُقِيدَهُمُ قُرَيْشٌ", "وكانوا لا يُنالُ لهم قِيادُ"],
  ["أقائِدَها تُغِصّ الجوّ نَقْعاً", "وفوْقَ الأرضِ من عَلَقٍ جِسادُ"],
  ["وقد أدْمَتْ هَوادِيَها العَوالي", "وأنْضَبَها التّطَاوُلُ والطّرادُ"],
  ["مُقَلَّدَةً بهاماتِ الأعادي", "كما بالدُّرَ قُلّدَتِ الخِرَادُ"],
  ["عليها اللابِسُونَ لكُلّ هَيْجٍ", "بُرُوداً غُمْضُ لابسِها سُهادُ"],
  ["كأبْوابِ الأراقِمِ مَزّقَتْها", "فخَاطَتْها بأعْيُنِهَا الجَرَادُ"],
  ["إليكَ طَوَى المَفاوِزَ كلُّ رَكْبٍ", "سَمَا بِهمِ التّغَرّبُ والبعادُ"],
  ["وإصْباحٍ فَلَيْنا اللّيلَ عنه", "كما يُفْلى عن النّارِ الرّمادُ"],
  ["أبلّ به الدّجى مِن كلّ سُقْمٍ", "وكوْكَبُهُ مريضٌ ما يُعادُ"],
  ["ولو طَلَعَ الصّباحُ لفُكّ عنه", "مِن الظّلْماءِ غُلُّ أو صِفادُ"],
  ["تَلوذُ بنا القَطا مُسْتَجْدِياتٍ", "لِما ضَمِنتْ من الماء المَزادُ"],
  ["يَكَدْنَ يَرِدْنَ من حدَق المَطايا", "مَوَارِدَ ماؤها أبَداً ثِمادُ"],
  ["فكَمْ جاوَزْنَ مِن بَلَدٍ بَعيدٍ", "وسائِرُ نُطْقِنا هِيدٌ وهادُ"],
  ["ومِنْ غَلَلٍ تَحِيدُ الرّيحُ عنه", "مَخافَةَ أنْ يُمَزّقَها القَتادُ"],
  ["وكُنّ يَرَيْنَ نارَ الزّنْدِ فيه", "فلم يُبْصِرْنَ إذ وَرَتِ الزّنادُ"],
  ["لو أنّ بَيَاضَ عَيْنِ المَرْءِ صُبْحٌ", "هُنالِكَ ما أضاء به السّوادُ"],
  ["وأرضٍ بِتُّ أقْري الوَحشَ زادي", "بها ليَثُوبَ لي مِنْهُنّ زادُ"],
  ["فأُطْعِمُها لأجْعَلَها طَعامي", "ورُبّ قَطيعَةٍ جَلَبَ الوِدادُ"],
  ["ترَكْتُ بها الرّقادَ وزُرْتُ أرضاً", "يُحاذِرُ أن يُلِمّ بها الرّقادُ"],
  ["رأيْتُكَ ساخِطاً ما جاء عَفواً", "ولو جادَتْكَ بالذهَبِ العِهادُ"],
  ["فما تَعْتَدّ مالاً غيرَ مالٍ", "حَبَاكَ به طِعانٌ أو جِلادُ"],
  ["وتُنْفِدُ كلّ وَفْرٍ حُزْتَ قَسْراً", "لعِلْمِكَ أنّ آخِرَهُ نَفادُ"],
  ["ألِفْتَ الحَرْبَ حتى قال قَوْمٌ", "أمَا لصَلاحِ بينكُما فسادُ"],
  ["تموتُ الدّرْعُ دونَكَ حَتْفَ أنْفٍ", "ويَبْلى فوْقَ عاتِقِكَ النّجادُ"],
  ["ركِبْتَ العاصِفاتِ فما تُجارَى", "وسُدْتَ العالَمِينَ فما تُسادُ"],
  ["متى أرْمِ السُّهَى لكَ أنْتَظِمْهُ", "كأنّ هَواكَ في سَهْمي سَدادُ"],
  ["تَذُودُ عُلاكَ شُرّادَ المَعاني", "إليّ فمَنْ زُهَيرٌ أو زِيادُ"],
  ["إذا ما صِدْتُها قالت رِجالٌ", "ألمْ تكُنِ الكواكبُ لا تُصادُ"],
  ["مِنَ اللاّتي أمَدّ بِهِنّ طَبْعٌ", "وهَذّبَهُنّ فِكْرٌ وانْتِقادُ"],
  ["ولولا فَرْطُ حُبّكَ ما ازْدهاني", "إلى المَدْحِ الطّريفُ ولا التّلادُ"],
  ["تُوَرّي عنكَ أَلْسِنَةُ اللّيالي", "كأنّكَ في ضمائِرهَا اعتِقادُ"],
  ["فإنْ يكُنِ الزّمان يريدُ مَعْنى", "فإنّكَ ذلكَ المَعْنى المُرادُ"],
  ["يَكادُ مُحَيَّنٌ لاقى المَنايا", "بسَيْفِكَ لا يكونُ له مَعادُ"]
];

(function initMaarriReader() {
    const library = document.querySelector(".poem-library");
    if (!library) return;

    const card = document.createElement("article");
    card.className = "poem-card maarri-card";
    card.innerHTML = `
      <div class="poem-card-decoration">۞</div>
      <span class="poem-era">العصر العباسي</span>
      <h3>أفوق البدر يوضع لي مهاد</h3>
      <p class="poem-author">أبو العلاء المعري</p>
      <div class="poem-card-meta"><span>51 بيتًا</span><span>مدح وفخر ورحلة</span></div>
      <button class="primary-button" id="openMaarri">افتح القصيدة ←</button>`;
    library.appendChild(card);

    const reader = document.createElement("section");
    reader.id = "maarriReader";
    reader.className = "poem-reader maarri-reader";
    reader.hidden = true;
    reader.innerHTML = `
      <button class="back-button" id="backFromMaarri">→ العودة إلى الديوان</button>
      <article class="manuscript"><div class="manuscript-frame">
        <div class="manuscript-ornament">۞</div>
        <span class="eyebrow">ديوان العصر العباسي</span>
        <h2 class="poem-title">أفوق البدر يوضع لي مهاد</h2>
        <div class="poet-profile">
          <span class="poet-symbol">رهين المحبسين</span>
          <div><h3>أبو العلاء المعري</h3><p>أحمد بن عبد الله المعري</p></div>
          <span class="era-label">العصر العباسي</span>
        </div>
        <div class="poem-toolbar">
          <button id="maarriDiacritics">إزالة التشكيل</button>
          <button id="maarriFavorite">☆ إضافة للمفضلة</button>
          <button id="maarriCopy">نسخ القصيدة</button>
          <button id="maarriDecrease">A−</button>
          <button id="maarriIncrease">A+</button>
          <button id="maarriShare">مشاركة</button>
        </div>
        <div class="verse-count">51 بيتًا من الشعر العباسي</div>
        <div id="maarriVerses" class="poem-verses" aria-label="أبيات القصيدة"></div>
        <div class="manuscript-ornament">❖ ۞ ❖</div>
        <div class="poem-explanation">
          <button id="maarriExplanationToggle" class="explanation-heading" aria-expanded="false" aria-controls="maarriExplanationContent">
            <span>✧ رحلة في معاني القصيدة</span><span id="maarriExplanationArrow">＋</span>
          </button>
          <div id="maarriExplanationContent" hidden>
            <div class="analysis-intro">
              <span class="analysis-label">قراءة أدبية</span>
              <h3>أبو العلاء المعري والقصيدة</h3>
              <p>أبو العلاء أحمد بن عبد الله المعري (363–449هـ / 973–1057م) شاعر وفيلسوف ولغوي من أعلام العصر العباسي، عُرف بسعة ثقافته وعمق تأمله في الحياة واللغة، ولُقّب برهين المحبسين. وتكشف هذه القصيدة عن تمكنه من اللغة والصورة، وتمزج التأمل الذاتي بوصف الرحلة والمدح.</p>
            </div>
            <div class="explanation-part">
              <h3>الفكرة العامة</h3>
              <p>تبدأ القصيدة بتأمل الشاعر في مكانته وقناعته ومرور الشباب، ثم تنتقل إلى وصف حال الممدوح وما يحيط به من هيبة واضطراب في البلاد، وتعرض نسبه ومآثر قومه، ثم تصف رحلة الشاعر ومشاق الطريق، وتنتهي بمدح الممدوح وإبراز أثره في شعر الشاعر ووجدانه.</p>
            </div>
            <div class="explanation-part">
              <h3>المحور الأول: التأمل في الذات والزمن (الأبيات 1–8)</h3>
              <p>يفتتح المعري بصور فلكية مبالغ فيها تعبر عن علو الطموح والاعتداد بالقناعة. ثم يستعيد زمن الشباب بعد انقضائه، ويتأمل أثر الشيب، ويوازن بين الشهرة والقناعة، وبين الخمول والنباهة.</p>
              <p class="poem-quote">وأطْرَبَني الشّبابُ غَداةَ ولّى — فليْتَ سِنِيهِ صوْتٌ يُسْتَعادُ</p>
            </div>
            <div class="explanation-part">
              <h3>المحور الثاني: الممدوح وأصله ومكانته (الأبيات 9–24)</h3>
              <p>يتحول الخطاب إلى الأمير الممدوح، فيذكر الشاعر اضطراب البلاد من أجله، ويصوره صاحب مجد رفيع ونسب عريق متصل بغسان وآل جفنة. وتبرز في هذه الأبيات مفردات الحرب والقيادة والهيبة، في سياق المدح والفخر.</p>
              <p class="poem-quote">بَنى من جَوْهَرِ العَلْياء بيْتاً — كأنّ النّيّراتِ له عِمادُ</p>
            </div>
            <div class="explanation-part">
              <h3>المحور الثالث: الرحلة ومشاق الطريق (الأبيات 25–38)</h3>
              <p>يصف الشاعر الركبان وهم يطوون الفيافي، والليل الطويل، والظمأ، والطرق الوعرة. ويستعين بصور القطا والماء والسراب والنار ليجعل مشقة السفر محسوسة، ثم يذكر إكرام الوحش من زاده في صورة شعرية لافتة.</p>
              <p class="poem-quote">إليكَ طَوَى المَفاوِزَ كلُّ رَكْبٍ — سَمَا بِهمِ التّغَرّبُ والبعادُ</p>
            </div>
            <div class="explanation-part">
              <h3>المحور الرابع: المدح والخاتمة (الأبيات 39–51)</h3>
              <p>يعود الشاعر إلى الثناء على الأمير، فيربط المال بالغلبة والبذل، ويصف اعتياده الحرب وشجاعته وعلو منزلته. ثم ينتقل إلى الإشادة بقدرة الممدوح على إلهام المعاني الشعرية، ويختم بتأكيد أن الممدوح هو المعنى الذي يطلبه الزمان.</p>
              <p class="poem-quote">فإنْ يكُنِ الزّمان يريدُ مَعْنى — فإنّكَ ذلكَ المَعْنى المُرادُ</p>
            </div>
            <div class="explanation-part">
              <h3>معاني المفردات الصعبة</h3>
              <dl class="vocabulary">
                <dt>المِهاد</dt><dd>الفراش أو ما يُمهّد للجلوس والاضطجاع.</dd>
                <dt>الجوزاء</dt><dd>كوكبة من النجوم معروفة في السماء.</dd>
                <dt>التقنّع</dt><dd>التستر والتعفف، ويأتي هنا في مقابلة المجاهرة والطلب.</dd>
                <dt>الدَّجْن</dt><dd>الظلمة أو الغيم المتراكم.</dd>
                <dt>أخمل</dt><dd>أبقى في الخمول ولم أظهر.</dd>
                <dt>القَنا</dt><dd>الرماح.</dd>
                <dt>المُهنّدة</dt><dd>السيوف المنسوبة إلى الهند لجودتها.</dd>
                <dt>النَّجاد</dt><dd>حمائل السيف أو ما يُعلّق به.</dd>
                <dt>المفاوز</dt><dd>الفيافي والصحارى الواسعة.</dd>
                <dt>القطا</dt><dd>نوع من الطيور الصحراوية.</dd>
                <dt>الثِّماد</dt><dd>المياه القليلة التي تبقى في الأرض.</dd>
                <dt>القَتاد</dt><dd>شجر كثير الشوك.</dd>
                <dt>الوَفْر</dt><dd>المال الكثير.</dd>
                <dt>التِّلاد</dt><dd>المال أو المجد القديم الموروث.</dd>
                <dt>المُحَيَّن</dt><dd>من دنا أجله أو حان حينه.</dd>
              </dl>
            </div>
            <div class="explanation-part">
              <h3>الصور البلاغية والأساليب</h3>
              <ul>
                <li><strong>المبالغة والتخييل:</strong> في مطلع القصيدة، إذ يجعل البدر موضعًا للمهاد والجوزاء وسادة، لتصوير علو الهمة.</li>
                <li><strong>الاستعارة:</strong> في «شكَا فتشكّت الدنيا ومادت»، إذ صُوّرت الدنيا كإنسان يشكو ويتألم.</li>
                <li><strong>التشبيه:</strong> في «كأن النيرات له عماد»، حيث تُشبَّه النجوم بأعمدة تشد بناء المجد.</li>
                <li><strong>التصوير الحركي:</strong> في وصف الركب وطيّ المفاوز، بما يوحي بسرعة الرحلة وبعد المسافة.</li>
                <li><strong>المقابلة:</strong> بين الشباب والشيب، وبين القناعة والطلب، وبين المال الزائل والمجد الباقي.</li>
        <li><strong>الأسلوب الخبري:</strong> يغلب على القصيدة لتقرير صفات الممدوح وسرد مشاهد الرحلة، مع ورود الاستفهام والنداء في مواضع التأمل.</li>
              </ul>
            </div>
            <div class="explanation-part">
              <h3>سياق القصيدة وموضوع المدح</h3>
              <p>تنتظم القصيدة في تقاليد المدح العباسي؛ فالشاعر يخاطب أميرًا يصفه بالشرف والقوة والقيادة، ويصل مدحه بأصل غساني وبمشاهد الحرب والرحلة. كما تتجاور ذات الشاعر المتأملة مع صورة الممدوح، فيصبح المدح باعثًا على إظهار القدرة الشعرية والوفاء.</p>
              <p class="editorial-note">النص المعروض هو النص الذي زوّدنا به صاحب المشروع، وقد حُفظ ترتيب الأبيات وألفاظها وتشكيلها كما وردت في الرسالة.</p>
            </div>
          </div>
        </div>
        <div class="manuscript-ornament">۞</div>
      </div></article>`;
    library.parentElement.appendChild(reader);

    const style = document.createElement("style");
    style.textContent = `
      .maarri-card { margin-top:22px; }
      #maarriReader[hidden] { display:none !important; }
      #maarriReader { margin-top:28px; direction:rtl; }
      #maarriReader .manuscript-frame { position:relative; overflow:hidden; }
      #maarriReader .manuscript-frame::before {
        content:"۞  ❖  ۞"; position:absolute; inset:14px 14px auto;
        text-align:center; color:rgba(164,128,65,.13); font-size:28px; pointer-events:none;
      }
      #maarriVerses { font-family:"Amiri",serif; font-size:21px; text-align:center; }
      #maarriVerses .maarri-verse {
        margin:0; padding:15px 10px; line-height:2.25; color:#263c33;
        border-bottom:1px solid rgba(197,161,91,.25);
      }
      #maarriVerses .maarri-verse:last-child { border-bottom:0; }
      #maarriVerses .hemistich { display:inline; }
      #maarriVerses .hemistich + .hemistich::before { content:"  ـــ  "; color:#b18b4b; padding:0 7px; }
      #maarriReader .poem-toolbar { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
      #maarriReader .poem-toolbar button { cursor:pointer; }
      #maarriReader .explanation-part { margin:18px 0; padding:18px; background:#fffdf7; border:1px solid #e8dec8; border-radius:13px; line-height:2; }
      #maarriReader .explanation-part h3 { color:#205b48; margin:0 0 10px; }
      #maarriReader .vocabulary { display:grid; grid-template-columns:minmax(90px,auto) 1fr; gap:7px 14px; }
      #maarriReader .vocabulary dt { color:#8b6934; font-weight:700; }
      #maarriReader .vocabulary dd { margin:0; }
      #maarriReader .editorial-note { color:#75684f; font-size:.9em; margin-top:15px; }
      @media(max-width:600px) {
        .maarri-card { margin-top:16px; }
        #maarriVerses { font-size:19px; }
        #maarriVerses .maarri-verse { padding:12px 3px; line-height:2.15; }
        #maarriVerses .hemistich + .hemistich::before { content:" — "; padding:0 2px; }
        #maarriReader .explanation-part { padding:14px; }
      }`;
    document.head.appendChild(style);

    const verses = reader.querySelector("#maarriVerses");
    let diacriticsVisible = true;
    let fontSize = 21;
    const poemKey = "maarri-afwq-albadr";

    const renderPoem = () => {
        verses.innerHTML = maarriPoemPairs.map((pair, index) => {
            const first = diacriticsVisible ? pair[0] : stripDiacritics(pair[0]);
            const second = diacriticsVisible ? pair[1] : stripDiacritics(pair[1]);

            return `<p class="maarri-verse"><span class="verse-number">${index + 1}.</span> <span class="hemistich">${first}</span><span class="hemistich">${second}</span></p>`;
        }).join("");
    };

    renderPoem();

    card.querySelector("#openMaarri").addEventListener("click", () => {
        reader.hidden = false;
        reader.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    reader.querySelector("#backFromMaarri").addEventListener("click", () => {
        reader.hidden = true;
        card.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });

    reader.querySelector("#maarriDiacritics").addEventListener("click", event => {
        diacriticsVisible = !diacriticsVisible;

        event.currentTarget.textContent = diacriticsVisible
            ? "إزالة التشكيل"
            : "إعادة التشكيل";

        renderPoem();
    });

    const favoriteButton = reader.querySelector("#maarriFavorite");

    const refreshFavoriteLabel = () => {
        favoriteButton.textContent = readFavorites().includes(poemKey)
            ? "★ إزالة من المفضلة"
            : "☆ إضافة للمفضلة";
    };

    refreshFavoriteLabel();

    favoriteButton.addEventListener("click", () => {
        const favorites = readFavorites();

        writeFavorites(
            favorites.includes(poemKey)
                ? favorites.filter(item => item !== poemKey)
                : [...favorites, poemKey]
        );

        refreshFavoriteLabel();
    });

    reader.querySelector("#maarriCopy").addEventListener("click", async () => {
        const text = maarriPoemPairs.map(pair => pair.join("\n")).join("\n\n");
        const copied = await copyText(text);

        alert(copied
            ? "تم نسخ القصيدة كاملة."
            : "تعذر النسخ التلقائي؛ حددي الأبيات وانسخيها يدويًا.");
    });

    reader.querySelector("#maarriIncrease").addEventListener("click", () => {
        fontSize = Math.min(fontSize + 2, 36);
        verses.style.fontSize = fontSize + "px";
    });

    reader.querySelector("#maarriDecrease").addEventListener("click", () => {
        fontSize = Math.max(fontSize - 2, 14);
        verses.style.fontSize = fontSize + "px";
    });

    reader.querySelector("#maarriShare").addEventListener("click", async () => {
        const shareData = {
            title: "أفوق البدر يوضع لي مهاد – أبو العلاء المعري",
            text: "قصيدة من 51 بيتًا لأبي العلاء المعري ضمن ديوان وهج العربية."
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                if (error.name !== "AbortError") {
                    alert("تعذرت المشاركة.");
                }
            }
        } else {
            const copied = await copyText(
                shareData.title + "\n" + shareData.text
            );

            alert(copied
                ? "تم نسخ بيانات القصيدة لمشاركتها."
                : "المشاركة غير متاحة في هذا المتصفح.");
        }
    });

    const explanationToggle = reader.querySelector("#maarriExplanationToggle");
    const explanationContent = reader.querySelector("#maarriExplanationContent");

    explanationToggle.addEventListener("click", () => {
        const opening = explanationContent.hidden;
        explanationContent.hidden = !opening;

        explanationToggle.setAttribute("aria-expanded", String(opening));

        reader.querySelector("#maarriExplanationArrow").textContent =
            opening ? "－" : "＋";
    });

    console.log(`تم تحميل قصيدة أبي العلاء المعري: ${maarriPoemPairs.length} بيتًا.`);
})();
// =============================================
// 10. قصيدة «أنا الذي سمتني أمي حيدره»
// نص منسوب إلى علي بن أبي طالب رضي الله عنه
// =============================================

(function initHaidaraReader() {
    const library = document.querySelector(".poem-library");
    if (!library || document.getElementById("haidaraReader")) return;

    const haidaraLines = [
        "أَنا الَّذي سَمَتني أُمي حَيدَرَه",
        "ضِرغامُ آجامٍ وَلَيثُ قَسوَرَه",
        "عَبْلُ الذِّرَاعَيْنِ شَدِيدُ الْقَصَرَهْ",
        "كَلَيثِ غاباتٍ كَريهِ المَنظَرَه",
        "عَلى الأَعادي مِثلَ رِيحٍ صَرصَرَه",
        "أَكيلُكُم بِالسَيفِ كَيلَ السَندَرَه",
        "أَضرِبُكُم ضَرباً يَبينُ الفَقَرَه",
        "وَأَتْرُكُ الْقِرْنَ بِقَاعٍ جَزَرَهْ",
        "أَضرِبُ بِالسَيفِ رِقابَ الكَفَرَه",
        "ضَربَ غُلامٍ ماجِدٍ حَزوَرَه",
        "مَن يَترُكِ الحَقَّ يَقوِّم صِغَرَه",
        "أَقتُلُ مِنهُم سَبعَةً أَو عَشَرَة",
        "فَكُلَّهُم أَهلُ فُسوقٍ فَجَرَه"
    ];

    const poemText = haidaraLines.join("\n");
    const poemKey = "ali-haidara-attributed";

    // بطاقة القصيدة في الديوان
    const card = document.createElement("article");
    card.className = "poem-card haidara-card";

    card.innerHTML = `
        <div class="poem-card-decoration">۞</div>
        <span class="poem-era">الشعر المنسوب إلى العصر الإسلامي المبكر</span>
        <h3>أنا الذي سمتني أمي حيدره</h3>
        <p class="poem-author">منسوبة إلى علي بن أبي طالب رضي الله عنه</p>

        <div class="poem-card-meta">
            <span>7 أبيات وفق بيانات المصدر</span>
            <span>فخر وحماسة</span>
        </div>

        <button class="primary-button" id="openHaidara">
            افتح القصيدة ←
        </button>
    `;

    library.appendChild(card);

    // صفحة قراءة القصيدة
    const reader = document.createElement("section");
    reader.id = "haidaraReader";
    reader.className = "poem-reader haidara-reader";
    reader.hidden = true;

    reader.innerHTML = `
        <button class="back-button" id="backFromHaidara">
            → العودة إلى الديوان
        </button>

        <article class="manuscript">
            <div class="manuscript-frame">

                <div class="manuscript-ornament">۞</div>
                <span class="eyebrow">ديوان الشعر العربي</span>

                <h2 class="poem-title">
                    أنا الذي سمتني أمي حيدره
                </h2>

                <div class="poet-profile">
                    <span class="poet-symbol">الفارس</span>
                    <div>
                        <h3>علي بن أبي طالب</h3>
                        <p>رضي الله عنه — نسبة النص غير محسومة</p>
                    </div>
                    <span class="era-label">العصر الإسلامي المبكر</span>
                </div>

                <div class="haidara-attribution-note">
                    تنبيه توثيقي: هذه القصيدة منسوبة إلى علي بن أبي طالب
                    رضي الله عنه، ولا نجزم بصحة نسبتها دون الرجوع إلى
                    مصدر تراثي موثوق وتحقيق روايات النص.
                </div>

                <div class="poem-toolbar">
                    <button id="haidaraDiacritics">إزالة التشكيل</button>
                    <button id="haidaraFavorite">☆ إضافة للمفضلة</button>
                    <button id="haidaraCopy">نسخ القصيدة</button>
                    <button id="haidaraDecrease">A−</button>
                    <button id="haidaraIncrease">A+</button>
                    <button id="haidaraShare">مشاركة</button>
                </div>

                <div class="verse-count">
                    7 أبيات وفق بيانات المصدر — عُرضت الأسطر المنقولة
                    كما وردت دون إعادة تقسيم
                </div>

                <div id="haidaraVerses" class="poem-verses"
                     aria-label="نص القصيدة"></div>

                <div class="manuscript-ornament">❖ ۞ ❖</div>

                <div class="poem-explanation">

                    <button id="haidaraExplanationToggle"
                            class="explanation-heading"
                            aria-expanded="false"
                            aria-controls="haidaraExplanationContent">
                        <span>✧ رحلة في معاني القصيدة</span>
                        <span id="haidaraExplanationArrow">＋</span>
                    </button>

                    <div id="haidaraExplanationContent" hidden>

                        <div class="haidara-study-intro">
                            <span class="analysis-label">
                                دراسة أدبية ولغوية
                            </span>

                            <h3>
                                قراءة في الرجز المنسوب إلى علي بن أبي طالب
                            </h3>

                            <p>
                                تتناول هذه القراءة النص كما ورد في التفريغ
                                المرسل، مع الفصل بين دلالة الألفاظ والصور
                                من جهة، وبين صحة الرواية والنسبة من جهة أخرى.
                                ولا يُعدّ الشرح إثباتًا تاريخيًا لنسبة الأبيات.
                            </p>
                        </div>

                        <nav class="haidara-index" aria-label="فهرس أقسام الشرح">
                            <strong>فهرس الشرح</strong>
                            <a href="#haidara-story">قصة القصيدة</a>
                            <a href="#haidara-summary">ملخص القصيدة</a>
                            <a href="#haidara-vocab">شرح المفردات</a>
                            <a href="#haidara-rhetoric">التحليل البلاغي</a>
                            <a href="#haidara-style">الإيقاع والأسلوب</a>
                            <a href="#haidara-documentation">النسبة والتوثيق</a>
                        </nav>

                        <details class="haidara-section" id="haidara-story" open>
                            <summary>01 · قصة القصيدة</summary>
                            <div class="haidara-section-body">
                                <p>
                                    تربط الرواية المتداولة هذا الرجز بأخبار
                                    خيبر، وتذكر أنه قيل في سياق المبارزة
                                    ومواجهة مرحب. وتُروى الأبيات في هذا السياق
                                    على أنها منسوبة إلى علي بن أبي طالب
                                    رضي الله عنه.
                                </p>

                                <p>
                                    لكن تداول القصة في كتب أو مواقع الأدب
                                    لا يكفي وحده للحكم بصحة جميع ألفاظ النص
                                    أو ثبوت نسبته؛ فذلك يحتاج إلى مراجعة
                                    مصادر الرواية ومقارنة صيغ النص في
                                    المصادر المختلفة.
                                </p>

                                <p class="editorial-note">
                                    <strong>تنبيه:</strong>
                                    القصة هنا تُعرض بوصفها رواية مشهورة
                                    متداولة، لا بوصفها واقعة موثقة بكل
                                    تفاصيلها في هذا الموضع.
                                </p>
                            </div>
                        </details>

                        <details class="haidara-section" id="haidara-summary">
                            <summary>02 · ملخص القصيدة وأفكارها</summary>
                            <div class="haidara-section-body">
                                <h4>الفكرة العامة</h4>

                                <p>
                                    يعرض النص صوت متكلم يعرّف بنفسه،
                                    ويستحضر صور القوة والإقدام في مقام
                                    مواجهة خصم، ضمن نبرة فخر وحماسة.
                                </p>

                                <ul>
                                    <li>
                                        <strong>الفخر والاعتزاز بالنفس:</strong>
                                        يبدأ المتكلم بتعريف نفسه بلقب حيدرة،
                                        ثم يحيط صورته بألفاظ ذات دلالة
                                        على الشدة والقوة.
                                    </li>

                                    <li>
                                        <strong>الشجاعة والقوة:</strong>
                                        تتكرر صور الأسد والريح الشديدة
                                        لتقديم شخصية لا تتراجع في موقف
                                        المواجهة.
                                    </li>

                                    <li>
                                        <strong>الوعيد في سياق المبارزة:</strong>
                                        تظهر في النص لغة تهديد ومبالغة
                                        حماسية، وهي جزء من تقاليد الرجز
                                        الحربي ووظيفته التعبيرية.
                                    </li>

                                    <li>
                                        <strong>الحق والباطل:</strong>
                                        يرد ذكر الحق في مقابل وصف الخصوم
                                        بالفسوق والفجور؛ وهذا يعكس الإطار
                                        الأخلاقي الذي يصوغه المتكلم داخل النص.
                                    </li>

                                    <li>
                                        <strong>الرسالة المستفادة:</strong>
                                        يقدّم النص صورة الاعتزاز والثبات
                                        والإقدام، ويكشف كيف تُستخدم اللغة
                                        المكثفة والصور القوية للتعبير عن
                                        الثقة في مقام التحدي.
                                    </li>
                                </ul>
                            </div>
                        </details>

                        <details class="haidara-section" id="haidara-vocab">
                            <summary>03 · شرح المفردات</summary>
                            <div class="haidara-section-body">
                                <p>
                                    تتتابع الأسطر في بناء صورة المتكلم:
                                    تعريف بالاسم، ثم أوصاف مستمدة من عالم
                                    السباع والطبيعة، ثم انتقال إلى خطاب
                                    المواجهة، وأخيرًا إلى مفردات تتصل
                                    بالحق والفسوق.
                                </p>

                                <dl class="vocabulary haidara-vocabulary">
                                    <dt>حيدرة</dt>
                                    <dd>
                                        اسم يُفسَّر في الشروح بأنه من أسماء
                                        الأسد، ويُذكر هنا بوصفه الاسم الذي
                                        عُرف به المتكلم في مطلع الرجز.
                                    </dd>

                                    <dt>ضِرغام</dt>
                                    <dd>
                                        من أسماء الأسد، ويُستعمل للدلالة
                                        على الشدة والقوة.
                                    </dd>

                                    <dt>آجام</dt>
                                    <dd>
                                        جمع أَجَمة، وهي موضع كثير الشجر
                                        تتخذه السباع مأوى.
                                    </dd>

                                    <dt>قَسْوَرَة</dt>
                                    <dd>
                                        لفظة وردت في العربية لمعانٍ منها
                                        الأسد أو الصائد، ويتحدد المراد
                                        منها بالسياق والرواية.
                                    </dd>

                                    <dt>عَبْلُ الذراعين</dt>
                                    <dd>
                                        غليظ الذراعين أو قويهما؛ وهو وصف
                                        جسدي يُراد به الإيحاء بالقوة.
                                    </dd>

                                    <dt>ريح صَرْصَرَة</dt>
                                    <dd>
                                        ريح شديدة، وتوصف في الاستعمال
                                        العربي بالشدة والبرد أو الصوت.
                                    </dd>

                                    <dt>السَّندَرَة</dt>
                                    <dd>
                                        لفظة غامضة في هذا التركيب.
                                        وقد وردت لها تفسيرات في الشروح،
                                        لكن لا يصح الجزم بمعنى محدد لها
                                        دون تحقيق اللفظ ومقارنة الروايات.
                                    </dd>

                                    <dt>يَبينُ الفَقَرَة</dt>
                                    <dd>
                                        تركيب يفيد الشدة في أثر الفعل
                                        بحسب ظاهر السياق، غير أن ضبط
                                        العبارة وروايتها يحتاجان إلى مراجعة.
                                    </dd>

                                    <dt>القِرْن</dt>
                                    <dd>
                                        النظير أو المكافئ، ويُطلق على
                                        الخصم الذي يواجه المرء في منافسة.
                                    </dd>

                                    <dt>فُسوق</dt>
                                    <dd>
                                        الخروج عن الطاعة والاستقامة.
                                    </dd>

                                    <dt>فَجَرَة</dt>
                                    <dd>
                                        جمع فاجر؛ أي من يُنسب إليه الميل
                                        عن الاستقامة وارتكاب المعاصي.
                                    </dd>

                                    <dt>يُقوِّم</dt>
                                    <dd>
                                        يُعدّل ويُصلح، وقد يأتي بمعنى
                                        يجعل الشيء مستقيمًا.
                                    </dd>

                                    <dt>صِغَرَه</dt>
                                    <dd>
                                        قد يُفهم على معنى صغر الشأن
                                        أو الضعف في هذا السياق، لكن
                                        دلالة التركيب كاملةً تتوقف
                                        على ضبط الرواية.
                                    </dd>
                                </dl>

                                <p class="editorial-note">
                                    لم تُثبت هنا معانٍ قطعية للألفاظ
                                    والتراكيب المختلف في ضبطها، ولا سيما
                                    السندرة ويبين الفقرة ويقوّم صغره.
                                </p>
                            </div>
                        </details>

                        <details class="haidara-section" id="haidara-rhetoric">
                            <summary>04 · التحليل البلاغي والصور الفنية</summary>
                            <div class="haidara-section-body">
                                <h4>الاستعارات والتشبيهات</h4>

                                <p>
                                    تتراكم أسماء الأسد مثل ضرغام وليث
                                    وقسورة في رسم صورة حماسية للمتكلم.
                                    ويمكن قراءة هذا التتابع على أنه
                                    استعارة لصفات القوة والهيبة.
                                </p>

                                <p>
                                    وفي صورة مثل ريح صرصر تشبيه يقرّب
                                    معنى الشدة والاندفاع إلى الحس،
                                    ويستدعي صورة عنصر طبيعي قوي.
                                </p>

                                <h4>الكناية</h4>

                                <p>
                                    وصف الذراعين بالغلظ كناية عن القوة
                                    البدنية والقدرة، لا مجرد وصف شكلي.
                                    أما بعض التراكيب الأخرى فينبغي شرحها
                                    بتحفظ بسبب اختلاف الضبط واحتمال
                                    اختلاف الرواية.
                                </p>

                                <h4>المقابلة بين الحق والباطل</h4>

                                <p>
                                    يضع النص لفظ الحق في جهة، وألفاظ
                                    الفسوق والفجرة في الجهة المقابلة.
                                    وهذه مقابلة معنوية تُظهر الطريقة
                                    التي يصوغ بها المتكلم موقفه أخلاقيًا.
                                </p>

                                <h4>أثر الألفاظ القوية</h4>

                                <p>
                                    اختيار ألفاظ من حقل الأسد والريح
                                    والقوة يمنح النص نبرة حماسية،
                                    ويجعل المتكلم حاضرًا في صورة
                                    التحدي والثقة.
                                </p>
                            </div>
                        </details>

                        <details class="haidara-section" id="haidara-style">
                            <summary>05 · الإيقاع والروي والأسلوب</summary>
                            <div class="haidara-section-body">
                                <p>
                                    <strong>الإيقاع:</strong>
                                    يقوم النص على نبرة رجزية حماسية،
                                    تتناسب مع الإلقاء في مقام التحدي
                                    والمواجهة.
                                </p>

                                <p>
                                    <strong>النهايات الصوتية:</strong>
                                    تتكرر في الأسطر المنقولة نهايات
                                    متقاربة مثل حيدره وقسوره وصرصره،
                                    بما يصنع جرسًا متجانسًا.
                                    أما تحديد حرف الروي تحديدًا عروضيًا
                                    دقيقًا فيتطلب ضبط النص كاملًا
                                    ومقابلة روايته.
                                </p>

                                <p>
                                    <strong>الأسلوب:</strong>
                                    يغلب على النص الإخبار المباشر
                                    والتعريف بالنفس، مع كثافة في
                                    الأوصاف والتراكيب القصيرة.
                                </p>

                                <p>
                                    <strong>الرجز:</strong>
                                    يُعرف الرجز بملاءمته للارتجال
                                    وسرعة الإلقاء في كثير من استعمالاته،
                                    لكن تعيين الوزن وضبطه يحتاج إلى
                                    نص مضبوط ومحقق.
                                </p>
                            </div>
                        </details>

                        <details class="haidara-section" id="haidara-documentation">
                            <summary>06 · النسبة والتوثيق والخلاصة</summary>
                            <div class="haidara-section-body">
                                <p>
                                    النص منسوب في التداول إلى علي بن
                                    أبي طالب رضي الله عنه، وتربطه
                                    الرواية المشهورة بأخبار خيبر
                                    ومبارزة مرحب. غير أن هذه الإشارة
                                    لا تعني أن النسبة أو جميع ألفاظ
                                    النص قد ثبتت تحقيقًا.
                                </p>

                                <p>
                                    للتوثيق العلمي يلزم الرجوع إلى
                                    مصادر تراثية محددة، وفحص سياق
                                    إيراد الخبر، ومقارنة ألفاظ الرجز
                                    وترتيبها بين الروايات.
                                </p>

                                <p>
                                    كما أن بيانات المصدر المنقول تشير
                                    إلى سبعة أبيات، بينما التفريغ الذي
                                    زُوّد به المشروع يضم ثلاثة عشر سطرًا.
                                    لذلك حُفظ ترتيب الأسطر كما ورد،
                                    ولم تُدمج أو تُقسّم إلى أبيات
                                    من عندنا.
                                </p>

                                <div class="analysis-conclusion">
                                    <h4>الخلاصة الأدبية</h4>
                                    <p>
                                        يعتمد النص على الفخر والحماسة،
                                        ويصوغ صورة المتكلم من خلال
                                        مفردات القوة وصور الطبيعة،
                                        ثم يربط موقفه بمعجم الحق
                                        والاستقامة. وتكمن أبرز سماته
                                        في كثافة الألفاظ، وتتابع الصور،
                                        والنبرة الإيقاعية المباشرة،
                                        مع ضرورة إبقاء النسبة والرواية
                                        في إطار التحفظ العلمي.
                                    </p>
                                </div>

                                <p class="editorial-note">
                                    <strong>قاعدة تحريرية:</strong>
                                    تُعرض القصيدة بوصفها نصًا منسوبًا،
                                    وتُعرض قصة خيبر بوصفها رواية متداولة،
                                    ولا تُقدّم التفسيرات المحتملة للكلمات
                                    الغامضة على أنها حقائق لغوية محسومة.
                                </p>
                            </div>
                        </details>

                    </div>
                </div>

                <div class="manuscript-ornament">۞</div>
            </div>
        </article>
    `;

    library.parentElement.appendChild(reader);

    // تنسيق صفحة القصيدة والشرح
    const style = document.createElement("style");

    style.textContent = `
        .haidara-card {
            margin-top: 22px;
        }

        #haidaraReader[hidden] {
            display: none !important;
        }

        #haidaraReader {
            margin-top: 28px;
            direction: rtl;
        }

        #haidaraReader .manuscript-frame {
            background: #faf7ef;
            border: 1px solid #dfcfaa;
        }

        #haidaraReader .poem-title,
        #haidaraVerses {
            font-family: "Amiri", serif;
        }

        #haidaraReader .poem-title {
            color: #173f34;
        }

        #haidaraReader .poet-profile {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }

        #haidaraReader .haidara-attribution-note {
            margin: 16px auto;
            max-width: 850px;
            padding: 11px 15px;
            border-right: 3px solid #b18b4b;
            background: rgba(197,161,91,.10);
            color: #675735;
            line-height: 1.9;
            font-size: .92rem;
        }

        #haidaraReader .poem-toolbar {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
        }

        #haidaraReader .poem-toolbar button {
            cursor: pointer;
        }

        #haidaraVerses {
            text-align: center;
            font-size: 23px;
            line-height: 2.3;
            color: #263c33;
        }

        #haidaraVerses .haidara-line {
            margin: 0;
            padding: 8px 5px;
            border-bottom: 1px solid rgba(197,161,91,.22);
        }

        #haidaraReader .vocabulary {
            display: grid;
            grid-template-columns: minmax(100px,auto) 1fr;
            gap: 7px 14px;
        }

        #haidaraReader .vocabulary dt {
            color: #8b6934;
            font-weight: 700;
        }

        #haidaraReader .vocabulary dd {
            margin: 0;
        }

        #haidaraReader .editorial-note {
            color: #75684f;
            font-size: .9em;
            margin-top: 13px;
        }

        #haidaraExplanationContent {
            color: #30463d;
            font-family: "Cairo", sans-serif;
        }

        #haidaraExplanationContent .haidara-study-intro {
            padding: 20px;
            margin: 18px 0;
            border-radius: 15px;
            background: rgba(18,61,50,.07);
            border: 1px solid rgba(18,61,50,.16);
            line-height: 2;
        }

        #haidaraExplanationContent .haidara-study-intro h3 {
            color: #123d32;
            margin: 5px 0 9px;
        }

        #haidaraExplanationContent .haidara-index {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            padding: 14px;
            margin: 18px 0;
            border: 1px solid #e6dac0;
            border-radius: 14px;
            background: #fffdf8;
        }

        #haidaraExplanationContent .haidara-index strong {
            color: #174638;
            margin-left: 5px;
        }

        #haidaraExplanationContent .haidara-index a {
            color: #72582d;
            text-decoration: none;
            padding: 6px 10px;
            border-radius: 20px;
            background: rgba(197,161,91,.13);
            font-size: .9rem;
        }

        #haidaraExplanationContent .haidara-index a:hover,
        #haidaraExplanationContent .haidara-index a:focus {
            background: rgba(197,161,91,.25);
            text-decoration: underline;
        }

        #haidaraExplanationContent .haidara-section {
            margin: 13px 0;
            border: 1px solid #e5dac4;
            border-radius: 14px;
            background: #fffdf8;
            overflow: hidden;
            scroll-margin-top: 20px;
        }

        #haidaraExplanationContent .haidara-section summary {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 16px 18px;
            cursor: pointer;
            list-style: none;
            color: #174638;
            font-weight: 800;
        }

        #haidaraExplanationContent .haidara-section summary::-webkit-details-marker {
            display: none;
        }

        #haidaraExplanationContent .haidara-section summary::after {
            content: "＋";
            color: #a78343;
            font-size: 1.15rem;
        }

        #haidaraExplanationContent .haidara-section[open] summary::after {
            content: "－";
        }

        #haidaraExplanationContent .haidara-section-body {
            padding: 0 19px 18px;
            line-height: 2.05;
        }

        #haidaraExplanationContent .haidara-section-body h4 {
            margin: 15px 0 5px;
            color: #205b48;
        }

        #haidaraExplanationContent .haidara-section-body p {
            margin: 8px 0;
        }

        #haidaraExplanationContent .haidara-section-body li {
            margin: 6px 0;
        }

        #haidaraExplanationContent .haidara-vocabulary dt {
            color: #9a7435;
            font-weight: 800;
            background: rgba(197,161,91,.12);
            border-radius: 7px;
            padding: 2px 8px;
            width: max-content;
        }

        #haidaraExplanationContent .haidara-vocabulary dd {
            padding: 2px 0 8px;
        }

        #haidaraExplanationContent .analysis-conclusion {
            margin-top: 16px;
            padding: 17px;
            border-radius: 12px;
            background: rgba(18,61,50,.07);
        }

        @media (max-width: 600px) {
            .haidara-card {
                margin-top: 16px;
            }

            #haidaraVerses {
                font-size: 20px;
                line-height: 2.1;
            }

            #haidaraReader .vocabulary {
                grid-template-columns: 1fr;
                gap: 2px;
            }

            #haidaraReader .vocabulary dd {
                margin-bottom: 9px;
            }

            #haidaraExplanationContent .haidara-index {
                gap: 6px;
            }

            #haidaraExplanationContent .haidara-index strong {
                width: 100%;
            }

            #haidaraExplanationContent .haidara-section summary {
                padding: 14px;
            }

            #haidaraExplanationContent .haidara-section-body {
                padding: 0 13px 14px;
            }
        }
    `;

    document.head.appendChild(style);

    // عرض أبيات القصيدة
    const verses = reader.querySelector("#haidaraVerses");
    const diacriticsButton = reader.querySelector("#haidaraDiacritics");

    let diacriticsVisible = true;
    let fontSize = 23;

    const stripDiacritics = value =>
        value.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");

    const renderPoem = () => {
        verses.innerHTML = haidaraLines.map((line, index) => {
            const shown = diacriticsVisible
                ? line
                : stripDiacritics(line);

            return `
                <p class="haidara-line" data-line="${index + 1}">
                    ${shown}
                </p>
            `;
        }).join("");
    };

    // المفضلة
    const readFavorites = () => {
        try {
            const value = JSON.parse(
                localStorage.getItem("wahjFavorites") || "[]"
            );

            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    };

    const writeFavorites = values => {
        try {
            localStorage.setItem(
                "wahjFavorites",
                JSON.stringify(values)
            );
        } catch (error) {
            console.warn("تعذر حفظ المفضلة", error);
        }
    };

    // نسخ النص
    const copyText = async value => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
                return true;
            }
        } catch (_) {}

        const field = document.createElement("textarea");
        field.value = value;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";

        document.body.appendChild(field);
        field.select();

        let copied = false;

        try {
            copied = document.execCommand("copy");
        } catch (_) {}

        field.remove();

        return copied;
    };

    renderPoem();

    // فتح القصيدة
    card.querySelector("#openHaidara").addEventListener("click", () => {
        reader.hidden = false;
        reader.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    // العودة إلى الديوان
    reader.querySelector("#backFromHaidara").addEventListener("click", () => {
        reader.hidden = true;
        card.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });

    // إزالة التشكيل وإعادته
    diacriticsButton.addEventListener("click", () => {
        diacriticsVisible = !diacriticsVisible;

        diacriticsButton.textContent = diacriticsVisible
            ? "إزالة التشكيل"
            : "إعادة التشكيل";

        renderPoem();
    });

    // زر المفضلة
    const favoriteButton = reader.querySelector("#haidaraFavorite");

    const updateFavoriteLabel = () => {
        favoriteButton.textContent =
            readFavorites().includes(poemKey)
                ? "★ إزالة من المفضلة"
                : "☆ إضافة للمفضلة";
    };

    updateFavoriteLabel();

    favoriteButton.addEventListener("click", () => {
        const favorites = readFavorites();

        const updated = favorites.includes(poemKey)
            ? favorites.filter(item => item !== poemKey)
            : [...favorites, poemKey];

        writeFavorites(updated);
        updateFavoriteLabel();
    });

    // نسخ القصيدة
    reader.querySelector("#haidaraCopy").addEventListener("click", async () => {
        const fullText =
            "أنا الذي سمتني أمي حيدره\n" + poemText;

        const copied = await copyText(fullText);

        alert(
            copied
                ? "تم نسخ القصيدة."
                : "تعذر النسخ التلقائي؛ يمكنك تحديد النص ونسخه يدويًا."
        );
    });

    // تكبير الخط
    reader.querySelector("#haidaraIncrease").addEventListener("click", () => {
        fontSize = Math.min(fontSize + 2, 38);
        verses.style.fontSize = fontSize + "px";
    });

    // تصغير الخط
    reader.querySelector("#haidaraDecrease").addEventListener("click", () => {
        fontSize = Math.max(fontSize - 2, 14);
        verses.style.fontSize = fontSize + "px";
    });

    // مشاركة القصيدة
    reader.querySelector("#haidaraShare").addEventListener("click", async () => {
        const shareData = {
            title: "أنا الذي سمتني أمي حيدره — قصيدة منسوبة إلى علي بن أبي طالب",
            text:
                "قصيدة منسوبة إلى علي بن أبي طالب رضي الله عنه ضمن ديوان وهج العربية. نسبة النص تحتاج إلى توثيق.\n" +
                poemText,
            url: location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                if (error.name !== "AbortError") {
                    alert("تعذرت المشاركة.");
                }
            }
        } else {
            const copied = await copyText(
                shareData.title + "\n" + shareData.text
            );

            alert(
                copied
                    ? "تم نسخ بيانات القصيدة."
                    : "المشاركة غير متاحة في هذا المتصفح."
            );
        }
    });

    // التنقل بين أقسام الشرح
    reader.querySelectorAll(".haidara-index a").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();

            const target = reader.querySelector(
                link.getAttribute("href")
            );

            if (!target) return;

            const explanationContent = reader.querySelector(
                "#haidaraExplanationContent"
            );

            if (!explanationContent.hidden) {
                target.open = true;

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });

    // فتح وإغلاق الشرح
    const explanationToggle = reader.querySelector(
        "#haidaraExplanationToggle"
    );

    const explanationContent = reader.querySelector(
        "#haidaraExplanationContent"
    );

    explanationToggle.addEventListener("click", () => {
        const opening = explanationContent.hidden;

        explanationContent.hidden = !opening;

        explanationToggle.setAttribute(
            "aria-expanded",
            String(opening)
        );

        reader.querySelector(
            "#haidaraExplanationArrow"
        ).textContent = opening ? "－" : "＋";
    });

    console.log(
        "تمت إضافة القصيدة المنسوبة إلى علي بن أبي طالب إلى ديوان وهج العربية."
    );
})();

/* ==========================================
   تحدّي العربية - وهج العربية
   ست ألعاب تفاعلية بثلاثة مستويات
========================================== */

(() => {
    "use strict";

    if (document.getElementById("arabicChallenge")) return;

    const games = [
        {
            id: "letters",
            title: "رتّب الحروف",
            icon: "🔤",
            description: "رتّب الحروف المبعثرة لتكوين الكلمة الصحيحة.",
            levels: [
                [
                    { q: "رتّب الحروف: ة ـ ب ـ ت ـ ك", a: "كتبة", options: ["كتبة", "كتب", "تكتب", "كتاب"] },
                    { q: "رتّب الحروف: م ـ ل ـ ع", a: "علم", options: ["علم", "عمل", "ملع", "عالم"] },
                    { q: "رتّب الحروف: ر ـ ح ـ ب", a: "بحر", options: ["حرب", "بحر", "ربح", "برح"] }
                ],
                [
                    { q: "رتّب الحروف: ة ـ ر ـ ا ـ ض ـ ح", a: "حضارة", options: ["حضارة", "حاضرة", "حراسة", "حائرة"] },
                    { q: "رتّب الحروف: ة ـ ف ـ ا ـ ق ـ ث", a: "ثقافة", options: ["ثقافة", "قافية", "ثقة", "فائقة"] },
                    { q: "رتّب الحروف: ة ـ غ ـ ل ـ ب", a: "بلاغة", options: ["بلاغة", "بليغة", "غلبة", "بلاغ"] }
                ],
                [
                    { q: "اختر الكلمة التي تتكون من الحروف: ا ـ س ـ ت ـ ق ـ ل ـ ا ـ ل", a: "استقلال", options: ["استقلال", "استقبال", "استغلال", "استدلال"] },
                    { q: "اختر الكلمة التي تتكون من الحروف: م ـ س ـ ؤ ـ و ـ ل ـ ي ـ ة", a: "مسؤولية", options: ["مسؤولية", "مساواة", "مسألة", "مساعية"] },
                    { q: "اختر الكلمة التي تتكون من الحروف: ا ـ ب ـ ت ـ ك ـ ا ـ ر", a: "ابتكار", options: ["ابتكار", "اختبار", "احتكار", "اعتبار"] }
                ]
            ]
        },
        {
            id: "meanings",
            title: "تحدّي معاني الكلمات",
            icon: "📚",
            description: "اختبر حصيلتك اللغوية ومعرفتك بمعاني المفردات.",
            levels: [
                [
                    { q: "ما معنى كلمة «الوجيب»؟", a: "اضطراب القلب", options: ["اضطراب القلب", "سكون الليل", "نور الشمس", "صوت المطر"] },
                    { q: "ما معنى «الضياء»؟", a: "النور", options: ["الظلام", "النور", "الهواء", "الماء"] },
                    { q: "ما معنى «الفطنة»؟", a: "الذكاء وسرعة الفهم", options: ["الكسل", "الحزن", "الذكاء وسرعة الفهم", "الخوف"] }
                ],
                [
                    { q: "ما معنى «السؤدد»؟", a: "الشرف والمجد", options: ["الشرف والمجد", "الفقر", "الضعف", "الندم"] },
                    { q: "ما معنى «الأريحية»؟", a: "السماحة وطيب النفس", options: ["الغضب", "السماحة وطيب النفس", "التردد", "الخوف"] },
                    { q: "ما معنى «الوجدان»؟", a: "الشعور والإحساس", options: ["المكان", "الشعور والإحساس", "الزمان", "الطعام"] }
                ],
                [
                    { q: "ما معنى «الإبانة»؟", a: "الإيضاح والكشف", options: ["الإخفاء", "الإيضاح والكشف", "التكرار", "الاختصار"] },
                    { q: "ما معنى «الضراعة»؟", a: "التذلل والخشوع", options: ["الكبرياء", "التذلل والخشوع", "الفرح", "السرعة"] },
                    { q: "ما معنى «المهابة»؟", a: "الهيبة والوقار", options: ["المرح", "الهيبة والوقار", "الضعف", "النسيان"] }
                ]
            ]
        },
        {
            id: "spelling",
            title: "العبقرية الإملائية",
            icon: "✍️",
            description: "اختر الكتابة الصحيحة للكلمات العربية.",
            levels: [
                [
                    { q: "أي الكلمات مكتوبة بصورة صحيحة؟", a: "مسؤول", options: ["مسئول", "مسؤول", "مسوؤل", "مسول"] },
                    { q: "اختر الكتابة الصحيحة:", a: "هؤلاء", options: ["هاؤلاء", "هؤلاء", "هأولاء", "هاؤلأء"] },
                    { q: "اختر الكتابة الصحيحة:", a: "امرأة", options: ["إمرأة", "امرأة", "امراءة", "إمرأه"] }
                ],
                [
                    { q: "أي الكلمات صحيحة؟", a: "استثناء", options: ["إستثناء", "استثناء", "استثنا", "إستثنا"] },
                    { q: "اختر الكتابة الصحيحة:", a: "مروءة", options: ["مروأة", "مروءة", "مروئة", "مروأة"] },
                    { q: "أي الكلمات صحيحة؟", a: "اطمئنان", options: ["إطمئنان", "اطمئنان", "اطمأنان", "اطمئنان"] }
                ],
                [
                    { q: "اختر الكلمة الصحيحة:", a: "لآلئ", options: ["لألئ", "لآلئ", "لألىء", "لآلىء"] },
                    { q: "أي الكلمات صحيحة؟", a: "تبوّء", options: ["تبوء", "تبوّء", "تبوؤ", "تبؤ"] },
                    { q: "اختر الكتابة الصحيحة:", a: "هيئة", options: ["هيأة", "هيئة", "هيئه", "هيأة"] }
                ]
            ]
        },
        {
            id: "proverbs",
            title: "أكمل المثل",
            icon: "💡",
            description: "أكمل الأمثال العربية المشهورة.",
            levels: [
                [
                    { q: "الصديق وقت ...", a: "الضيق", options: ["الفرح", "الضيق", "الراحة", "السفر"] },
                    { q: "في التأني ...", a: "السلامة", options: ["الندامة", "السلامة", "الخسارة", "الحيرة"] },
                    { q: "من جدّ ...", a: "وجد", options: ["تعب", "وجد", "نام", "سافر"] }
                ],
                [
                    { q: "ربّ أخٍ لك لم ...", a: "تلده أمك", options: ["تعرفه", "تلده أمك", "تسمعه", "تلقه"] },
                    { q: "الكتاب يُقرأ من ...", a: "عنوانه", options: ["آخره", "عنوانه", "وسطه", "غلافه"] },
                    { q: "على قدر أهل العزم تأتي ...", a: "العزائم", options: ["الراحة", "العزائم", "الأيام", "الأحلام"] }
                ],
                [
                    { q: "إذا كان الكلام من فضة فالسكوت من ...", a: "ذهب", options: ["ماس", "ذهب", "فضة", "نور"] },
                    { q: "تجري الرياح بما لا تشتهي ...", a: "السفن", options: ["القلوب", "السفن", "الطيور", "الجبال"] },
                    { q: "من راقب الناس مات ...", a: "همًّا", options: ["فرحًا", "همًّا", "علمًا", "صبرًا"] }
                ]
            ]
        },
        {
            id: "grammar",
            title: "ملك النحو",
            icon: "👑",
            description: "اختبر معلوماتك في النحو والإعراب.",
            levels: [
                [
                    { q: "ما نوع كلمة «الطالب» في: حضر الطالب؟", a: "فاعل", options: ["مبتدأ", "فاعل", "مفعول به", "خبر"] },
                    { q: "ما علامة رفع المبتدأ المفرد؟", a: "الضمة", options: ["الفتحة", "الكسرة", "الضمة", "السكون"] },
                    { q: "ما نوع الجملة: السماء صافية؟", a: "اسمية", options: ["فعلية", "اسمية", "شرطية", "تعجبية"] }
                ],
                [
                    { q: "إنّ وأخواتها تنصب ...", a: "الاسم", options: ["الخبر", "الاسم", "الفعل", "الفاعل"] },
                    { q: "كان وأخواتها ترفع ...", a: "الاسم", options: ["الخبر", "المفعول", "الاسم", "الحال"] },
                    { q: "ما إعراب «المجتهد» في: إن الطالب مجتهد؟", a: "خبر إن مرفوع", options: ["اسم إن منصوب", "خبر إن مرفوع", "فاعل مرفوع", "مفعول به"] }
                ],
                [
                    { q: "ما إعراب «العلم» في: أحب العلم؟", a: "مفعول به منصوب", options: ["فاعل مرفوع", "مبتدأ مرفوع", "مفعول به منصوب", "خبر مرفوع"] },
                    { q: "ما علامة نصب جمع المذكر السالم؟", a: "الياء", options: ["الواو", "الألف", "الياء", "الضمة"] },
                    { q: "ما إعراب «المعلمون» في: حضر المعلمون؟", a: "فاعل مرفوع بالواو", options: ["مفعول به", "فاعل مرفوع بالواو", "مبتدأ منصوب", "خبر مجرور"] }
                ]
            ]
        },
        {
            id: "poetry",
            title: "أكمل البيت الشعري",
            icon: "🪶",
            description: "أكمل أبياتًا مشهورة من الشعر العربي.",
            levels: [
                [
                    { q: "الخيل والليل والبيداء تعرفني ...", a: "والسيف والرمح والقرطاس والقلم", options: ["والسيف والرمح والقرطاس والقلم", "والعلم والحلم والصدق والكرم", "والشمس والقمر والليل والنجوم", "والبحر والنهر والروض والشجر"] },
                    { q: "إذا غامرت في شرف مروم ...", a: "فلا تقنع بما دون النجوم", options: ["فلا تقنع بما دون النجوم", "فلا تخشَ من طول الطريق", "فكن صبورًا في الحياة", "فإن المجد يبقى للأمم"] },
                    { q: "على قدر أهل العزم تأتي ...", a: "العزائم", options: ["القصائد", "العزائم", "المكارم", "النوائب"] }
                ],
                [
                    { q: "ومن يجعل المعروف في غير أهله ...", a: "يكن حمده ذمًّا عليه ويندم", options: ["يكن حمده ذمًّا عليه ويندم", "يجد الخير في كل مكان", "ينل المجد بين الأمم", "يعيش سعيدًا مطمئنًا"] },
                    { q: "وللحرية الحمراء باب ...", a: "بكل يد مضرجة يدق", options: ["بكل يد مضرجة يدق", "يفتحه الصبر واليقين", "تحرسه النجوم", "تزينه الأزهار"] },
                    { q: "وما نيل المطالب بالتمني ...", a: "ولكن تؤخذ الدنيا غلابا", options: ["ولكن تؤخذ الدنيا غلابا", "ولكن بالعلم نرتقي", "ولكن بالصبر ننتصر", "ولكن بالعمل نحيا"] }
                ],
                [
                    { q: "إذا الشعب يومًا أراد الحياة ...", a: "فلا بد أن يستجيب القدر", options: ["فلا بد أن يستجيب القدر", "فإن الحياة جميلة", "فلا بد أن يزول الخطر", "فإن الصبر مفتاح الظفر"] },
                    { q: "قم للمعلم وفّه التبجيلا ...", a: "كاد المعلم أن يكون رسولا", options: ["كاد المعلم أن يكون رسولا", "فالعلم يرفع كل جيل", "إن المعلم قدوة الأجيال", "والعلم نور في العقول"] },
                    { q: "ألا ليت الشباب يعود يومًا ...", a: "فأخبره بما فعل المشيب", options: ["فأخبره بما فعل المشيب", "لأعيش أيامًا جميلة", "لأكتب الشعر من جديد", "لأرى الأحباب من جديد"] }
                ]
            ]
        }
    ];

    const root = document.createElement("section");
    root.id = "arabicChallenge";
    root.className = "page content-section";
    root.dir = "rtl";

    root.innerHTML = `
        <div class="challenge-shell">
            <header class="challenge-hero">
                <span class="challenge-kicker">وهج العربية يقدم</span>
                <div class="challenge-hero-icon">✦</div>
                <h2>تحدّي العربية</h2>
                <p>رحلة ممتعة لاكتشاف جمال لغتنا وإتقان أسرارها</p>
                <div class="challenge-stats">
                    <span>🎯 ست ألعاب</span>
                    <span>🏆 ثلاثة مستويات</span>
                    <span>📖 معرفة ومتعة</span>
                </div>
            </header>

            <div class="challenge-view" id="challengeHome">
                <div class="challenge-section-title">
                    <div>
                        <span>اختر مغامرتك</span>
                        <h3>ألعاب اللغة العربية</h3>
                    </div>
                    <span class="challenge-sparkle">✧</span>
                </div>
                <div class="challenge-grid" id="challengeGames"></div>
            </div>

            <div class="challenge-view" id="challengePlay" hidden>
                <div class="challenge-play-top">
                    <button class="challenge-back" id="challengeBack">← الألعاب</button>
                    <span id="challengeLevelLabel"></span>
                </div>
                <div class="challenge-progress">
                    <div class="challenge-progress-fill" id="challengeProgress"></div>
                </div>
                <div class="challenge-score-row">
                    <span id="challengeQuestionNumber">السؤال 1</span>
                    <span>⭐ <b id="challengeScore">0</b></span>
                </div>
                <div class="challenge-question-card">
                    <div class="challenge-question-icon" id="challengeGameIcon"></div>
                    <h3 id="challengeQuestion"></h3>
                    <div id="challengeAnswers" class="challenge-answers"></div>
                    <div id="challengeFeedback" class="challenge-feedback" aria-live="polite"></div>
                    <button id="challengeNext" class="challenge-primary" disabled>السؤال التالي ←</button>
                </div>
            </div>

            <div class="challenge-view" id="challengeResult" hidden>
                <div class="challenge-result-card">
                    <div class="challenge-trophy">🏆</div>
                    <span class="challenge-kicker">انتهى التحدّي</span>
                    <h3 id="challengeResultTitle">أحسنت!</h3>
                    <div class="challenge-final-score" id="challengeFinalScore"></div>
                    <p id="challengeResultMessage"></p>
                    <div class="challenge-result-actions">
                        <button class="challenge-primary" id="challengeReplay">أعد اللعب</button>
                        <button class="challenge-secondary" id="challengeHomeButton">قائمة الألعاب</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
        #arabicChallenge {
            --ch-green: #123d32;
            --ch-green2: #1c5948;
            --ch-gold: #c5a15b;
            --ch-ivory: #faf7ef;
            --ch-ink: #263c33;
            direction: rtl;
            padding: 25px 15px 55px;
            color: var(--ch-ink);
        }
        #arabicChallenge[hidden], #arabicChallenge [hidden] { display:none !important; }
        .challenge-shell { max-width:1100px; margin:auto; }
        .challenge-hero {
            position:relative; overflow:hidden; text-align:center;
            padding:45px 20px; border-radius:25px;
            color:#fff; background:linear-gradient(135deg,#10382e,#1c5948);
            box-shadow:0 15px 35px #123d3220;
        }
        .challenge-hero:before,.challenge-hero:after {
            content:""; position:absolute; width:180px;height:180px;
            border:1px solid #d9b76c55;border-radius:50%;
        }
        .challenge-hero:before {top:-100px;right:-50px}
        .challenge-hero:after {bottom:-120px;left:-60px}
        .challenge-kicker {color:#e5cc91;font-size:.85rem;letter-spacing:1px}
        .challenge-hero-icon {font-size:35px;color:#e5cc91;margin:8px}
        .challenge-hero h2 {font-size:clamp(2rem,5vw,3.1rem);margin:5px 0}
        .challenge-hero p {color:#f2ead8;margin:10px 0 22px}
        .challenge-stats {display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
        .challenge-stats span {border:1px solid #ffffff40;padding:8px 13px;border-radius:30px;font-size:.85rem}
        .challenge-section-title {display:flex;align-items:center;justify-content:space-between;margin:32px 0 18px}
        .challenge-section-title span {color:#a78343;font-size:.9rem}
        .challenge-section-title h3 {margin:5px 0;color:var(--ch-green);font-size:1.5rem}
        .challenge-sparkle {font-size:30px}
        .challenge-grid {display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:17px}
        .challenge-game-card {
            text-align:right;border:1px solid #e9dfcb;background:#fffdf8;
            border-radius:19px;padding:21px;transition:.25s;
            box-shadow:0 5px 16px #123d3209;
        }
        .challenge-game-card:hover {transform:translateY(-5px);box-shadow:0 12px 25px #123d3218;border-color:#c5a15b}
        .challenge-game-icon {width:55px;height:55px;display:grid;place-items:center;
            border-radius:16px;background:#f1ead9;font-size:27px;margin-bottom:14px}
        .challenge-game-card h4 {color:var(--ch-green);font-size:1.15rem;margin:0 0 7px}
        .challenge-game-card p {color:#6d786f;line-height:1.8;font-size:.9rem;min-height:48px}
        .challenge-game-card button,.challenge-primary,.challenge-secondary,.challenge-back {
            border:0;border-radius:11px;padding:11px 17px;cursor:pointer;
            font-family:inherit;font-weight:700;transition:.2s;
        }
        .challenge-game-card button,.challenge-primary {background:var(--ch-green);color:#fff}
        .challenge-game-card button:hover,.challenge-primary:hover {background:var(--ch-green2);transform:translateY(-2px)}
        .challenge-play-top {display:flex;justify-content:space-between;align-items:center;margin:25px 0 15px}
        .challenge-back,.challenge-secondary {background:#eee6d5;color:var(--ch-green)}
        .challenge-progress {height:9px;background:#e8e0d1;border-radius:20px;overflow:hidden}
        .challenge-progress-fill {height:100%;width:0;background:linear-gradient(90deg,#c5a15b,#e5cc91);transition:width .3s}
        .challenge-score-row {display:flex;justify-content:space-between;margin:15px 0;color:#66746b}
        .challenge-question-card {max-width:750px;margin:20px auto;background:#fffdf8;border:1px solid #e8dfce;border-radius:22px;padding:clamp(20px,4vw,35px);text-align:center;box-shadow:0 12px 30px #123d3210}
        .challenge-question-icon {font-size:34px}
        .challenge-question-card h3 {color:var(--ch-green);font-size:1.35rem;line-height:1.9;margin:15px 0 25px}
        .challenge-answers {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
        .challenge-answer {padding:14px 10px;border:1px solid #e3dac8;background:#fff;border-radius:12px;color:#34483d;font:inherit;cursor:pointer;transition:.2s}
        .challenge-answer:hover:not(:disabled) {border-color:#b38d4d;background:#faf4e7}
        .challenge-answer.correct {background:#e4f2e8;border-color:#4b9b67;color:#176034}
        .challenge-answer.wrong {background:#fbe9e6;border-color:#d17b70;color:#8c3329}
        .challenge-answer:disabled {cursor:default}
        .challenge-feedback {min-height:35px;margin:15px 0;font-weight:700}
        .challenge-feedback.good {color:#287344}
        .challenge-feedback.bad {color:#a44538}
        .challenge-primary:disabled {opacity:.4;cursor:not-allowed;transform:none}
        .challenge-result-card {max-width:600px;margin:35px auto;text-align:center;padding:35px 20px;background:#fffdf8;border:1px solid #e8dfce;border-radius:22px}
        .challenge-trophy {font-size:65px;margin-bottom:15px}
        .challenge-result-card h3 {font-size:1.8rem;color:var(--ch-green)}
        .challenge-final-score {font-size:2.4rem;color:#a78343;font-weight:900;margin:15px}
        .challenge-result-actions {display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:20px}
        @media(max-width:560px) {
            #arabicChallenge {padding:15px 10px 35px}
            .challenge-hero {padding:35px 15px}
            .challenge-grid {grid-template-columns:1fr}
            .challenge-answers {grid-template-columns:1fr}
            .challenge-question-card {padding:20px 14px}
        }
    `;
    document.head.appendChild(style);

    // إضافة القسم إلى التطبيق
    const main = document.querySelector("main") || document.querySelector(".main-content") || document.body;
    main.appendChild(root);

    // بطاقة اللعبة
    const gameContainer = root.querySelector("#challengeGames");
    games.forEach(game => {
        const card = document.createElement("article");
        card.className = "challenge-game-card";
        card.innerHTML = `
            <div class="challenge-game-icon">${game.icon}</div>
            <h4>${game.title}</h4>
            <p>${game.description}</p>
            <button type="button">اختر اللعبة ←</button>
        `;
        card.querySelector("button").addEventListener("click", () => showLevelChoice(game));
        gameContainer.appendChild(card);
    });

    const home = root.querySelector("#challengeHome");
    const play = root.querySelector("#challengePlay");
    const result = root.querySelector("#challengeResult");

    let currentGame = null;
    let currentLevel = 0;
    let questionIndex = 0;
    let score = 0;
    let correctCount = 0;
    let answered = false;
    let questionSet = [];

    function showOnly(view) {
        home.hidden = view !== home;
        play.hidden = view !== play;
        result.hidden = view !== result;
    }

    function showLevelChoice(game) {
        currentGame = game;
        const choice = prompt("اختاري المستوى:\n1 - مبتدئ\n2 - متوسط\n3 - متقدم");
        if (choice === null) return;
        const level = Number(choice) - 1;
        if (![0, 1, 2].includes(level)) {
            alert("اختاري 1 أو 2 أو 3.");
            return;
        }
        startGame(level);
    }

    function startGame(level) {
        currentLevel = level;
        questionIndex = 0;
        score = 0;
        correctCount = 0;
        answered = false;
        questionSet = [...currentGame.levels[level]]
            .sort(() => Math.random() - 0.5);

        root.querySelector("#challengeLevelLabel").textContent =
            ["مبتدئ", "متوسط", "متقدم"][level];

        showOnly(play);
        showQuestion();
    }

    function showQuestion() {
        const question = questionSet[questionIndex];
        answered = false;

        root.querySelector("#challengeGameIcon").textContent = currentGame.icon;
        root.querySelector("#challengeQuestion").textContent = question.q;
        root.querySelector("#challengeScore").textContent = score;
        root.querySelector("#challengeQuestionNumber").textContent =
            `السؤال ${questionIndex + 1} من ${questionSet.length}`;

        root.querySelector("#challengeProgress").style.width =
            `${(questionIndex / questionSet.length) * 100}%`;

        root.querySelector("#challengeFeedback").textContent = "";
        root.querySelector("#challengeFeedback").className = "challenge-feedback";

        const next = root.querySelector("#challengeNext");
        next.disabled = true;
        next.textContent = questionIndex === questionSet.length - 1
            ? "عرض النتيجة 🏆"
            : "السؤال التالي ←";

        const answers = root.querySelector("#challengeAnswers");
        answers.innerHTML = "";

        [...question.options].sort(() => Math.random() - .5).forEach(option => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "challenge-answer";
            button.textContent = option;
            button.addEventListener("click", () => chooseAnswer(button, option, question));
            answers.appendChild(button);
        });
    }

    function chooseAnswer(button, selected, question) {
        if (answered) return;
        answered = true;

        const buttons = [...root.querySelectorAll(".challenge-answer")];
        buttons.forEach(item => {
            item.disabled = true;
            if (item.textContent === question.a) item.classList.add("correct");
        });

        const feedback = root.querySelector("#challengeFeedback");

        if (selected === question.a) {
            score += 10;
            correctCount++;
            feedback.textContent = "إجابة صحيحة! أحسنتِ ⭐";
            feedback.classList.add("good");
        } else {
            button.classList.add("wrong");
            feedback.textContent = `ليست الإجابة الصحيحة. الإجابة: ${question.a}`;
            feedback.classList.add("bad");
        }

        root.querySelector("#challengeScore").textContent = score;
        root.querySelector("#challengeNext").disabled = false;
    }

    function finishGame() {
        showOnly(result);

        const bestKey = `wahjChallengeBest_${currentGame.id}`;
        let best = 0;

        try {
            best = Number(localStorage.getItem(bestKey) || 0);
            if (score > best) {
                localStorage.setItem(bestKey, String(score));
                best = score;
            }
        } catch (_) {}

        root.querySelector("#challengeResultTitle").textContent =
            correctCount === questionSet.length ? "ممتاز! أداء رائع" :
            correctCount >= 2 ? "أحسنتِ، واصلي التقدم" : "محاولة جميلة، أعيدي التحدي";

        root.querySelector("#challengeFinalScore").textContent =
            `${score} نقطة`;

        root.querySelector("#challengeResultMessage").textContent =
            `أجبتِ إجابة صحيحة عن ${correctCount} من ${questionSet.length} أسئلة. أفضل نتيجة لكِ: ${best} نقطة.`;
    }

    root.querySelector("#challengeNext").addEventListener("click", () => {
        if (!answered) return;

        if (questionIndex < questionSet.length - 1) {
            questionIndex++;
            showQuestion();
        } else {
            root.querySelector("#challengeProgress").style.width = "100%";
            finishGame();
        }
    });

    root.querySelector("#challengeBack").addEventListener("click", () => {
        showOnly(home);
    });

    root.querySelector("#challengeReplay").addEventListener("click", () => {
        startGame(currentLevel);
    });

    root.querySelector("#challengeHomeButton").addEventListener("click", () => {
        showOnly(home);
    });  
    console.log("تم تحميل قسم تحدّي العربية.");

})();