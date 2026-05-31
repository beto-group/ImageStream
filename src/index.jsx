/**
 * IMAGE STREAM - Index View Factory
 * Integrates FullTab DOM reparenting and reload command listener.
 */
console.log("IMAGE STREAM: index.jsx module evaluation");

async function View({ folderPath, isInception, dc, ...props }) {
    const STYLE_ID = "impeccable-status-imagestream";
    console.log("IMAGE STREAM: View factory executing with folderPath:", folderPath);

    function findNearestAncestorWithClass(element, className) {
        if (!element) return null;
        let current = element.parentNode;
        while (current) {
            if (current.classList && current.classList.contains(className)) {
                return current;
            }
            current = current.parentNode;
        }
        return null;
    }

    function findDirectChildByClass(parent, className) {
        if (!parent) return null;
        for (let i = 0; i < parent.children.length; i++) {
            const child = parent.children[i];
            if (child.classList && child.classList.contains(className)) {
                return child;
            }
        }
        return null;
    }

    const Agent = {
        timer: null,
        start: function (fPath, onReload) {
            const cmdFile = fPath + "/data/mcp_commands.json";
            Agent.timer = setInterval(async function () {
                try {
                    const adapter = dc.app.vault.adapter;
                    if (!(await adapter.exists(cmdFile))) return;
                    const content = await adapter.read(cmdFile);
                    const cmd = JSON.parse(content);
                    if (cmd && cmd.executed === false && cmd.action === "reload") {
                        cmd.executed = true;
                        cmd.executedAt = new Date().toISOString();
                        await adapter.write(cmdFile, JSON.stringify(cmd, null, 2));
                        onReload();
                    }
                } catch (e) {
                    // Fail silently
                }
            }, 1000);
            return function () { clearInterval(Agent.timer); };
        }
    };

    function SafeRoot() {
        const [appComponent, setAppComponent] = dc.useState(null);
        const [error, setError] = dc.useState(null);
        const [key, setKey] = dc.useState(0);
        const [isFullTab, setIsFullTab] = dc.useState(!isInception);

        const containerRef = dc.useRef(null);
        const stateRefs = dc.useRef({}).current;

        console.log("IMAGE STREAM: SafeRoot component rendering, appComponent:", !!appComponent, "error:", error ? error.message : "none");

        const toggleFullTab = function () {
            if (isInception) return;
            setIsFullTab(function (prev) { return !prev; });
        };

        // --- DOM Reparenting Full-tab lifecycle ---
        dc.useEffect(function () {
            console.log("IMAGE STREAM: SafeRoot DOM reparenting useEffect trigger, isFullTab:", isFullTab);
            if (!isFullTab || isInception) return;

            const container = containerRef.current;
            if (!container) return;

            const targetPaneContent = findNearestAncestorWithClass(container, "workspace-leaf-content");
            if (!targetPaneContent) {
                console.warn("IMAGE STREAM: Could not find target workspace-leaf-content");
                setIsFullTab(false);
                return;
            }

            const contentWrapper = findDirectChildByClass(targetPaneContent, "view-content") || targetPaneContent;
            const currentParent = container.parentNode;
            if (!currentParent) return;

            // Create placeholder
            stateRefs.originalParent = currentParent;
            const placeholder = document.createElement("div");
            placeholder.className = "screen-mode-placeholder";
            placeholder.style.display = "none";

            if (container.nextSibling) {
                currentParent.insertBefore(placeholder, container.nextSibling);
            } else {
                currentParent.appendChild(placeholder);
            }
            stateRefs.placeholder = placeholder;

            // Position logic
            stateRefs.parentPositionInfo = {
                element: contentWrapper,
                originalInlinePosition: contentWrapper.style.position,
            };

            if (window.getComputedStyle(contentWrapper).position === 'static') {
                contentWrapper.style.position = "relative";
            }

            contentWrapper.appendChild(container);

            // Edge-to-edge styling
            requestAnimationFrame(function () {
                Object.assign(contentWrapper.style, {
                    padding: "0",
                    margin: "0",
                    height: "100%",
                    width: "100%",
                    display: "block",
                    overflow: "hidden",
                    minHeight: "0"
                });
            });

            Object.assign(container.style, {
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                zIndex: "9998",
                overflow: "hidden",
                backgroundColor: "var(--background-primary)",
            });

            return function () {
                console.log("Datacore: Cleaning up Full Tab Mode (ImageStream)");
                if (stateRefs.placeholder?.parentNode) {
                    stateRefs.placeholder.parentNode.replaceChild(container, stateRefs.placeholder);
                } else if (stateRefs.originalParent) {
                    stateRefs.originalParent.appendChild(container);
                }

                if (stateRefs.parentPositionInfo?.element) {
                    const { element, originalInlinePosition } = stateRefs.parentPositionInfo;
                    element.style.position = originalInlinePosition || '';
                }
                container.removeAttribute("style");
            };
        }, [isFullTab, isInception]);

        // --- Immersive FullTab: Status Bar & Footer Suppression ---
        dc.useEffect(function () {
            if (!isFullTab || isInception) {
                const el = document.getElementById(STYLE_ID);
                if (el) el.remove();
                return;
            }

            let styleEl = document.getElementById(STYLE_ID);
            if (!styleEl) {
                styleEl = document.createElement("style");
                styleEl.id = STYLE_ID;
                styleEl.innerHTML = `
                    /* IMAGE STREAM: Hide global status bar and view footers for immersive full-tab layout */
                    body > .app-container .status-bar,
                    .view-footer,
                    .workspace-leaf-content-footer {
                        display: none !important;
                    }
                    .workspace-leaf-content {
                        padding: 0 !important;
                        margin: 0 !important;
                        border-radius: 0 !important;
                    }
                `;
                document.head.appendChild(styleEl);
            }

            return function () {
                const el = document.getElementById(STYLE_ID);
                if (el) el.remove();
            };
        }, [isFullTab, isInception]);

        // --- Agent Watch Daemon ---
        dc.useEffect(function () {
            return Agent.start(folderPath, function () {
                if (dc.app.workspace.activeLeaf?.rebuildView) {
                    dc.app.workspace.activeLeaf.rebuildView();
                } else {
                    setKey(function (k) { return k + 1; });
                }
            });
        }, []);

        // --- Module Loader ---
        dc.useEffect(function () {
            async function load() {
                console.log("IMAGE STREAM: SafeRoot module loader triggered, requesting App.jsx");
                try {
                    const appModule = await dc.require(folderPath + "/src/App.jsx");
                    console.log("IMAGE STREAM: App.jsx loaded successfully");
                    setAppComponent(function () { return appModule.App; });
                } catch (e) {
                    console.error("IMAGE STREAM: App.jsx load failed:", e);
                    setError(e);
                }
            }
            load();
        }, [key]);

        if (error) {
            return (
                <div style={{ color: "var(--text-error, #ef4444)", padding: "40px", background: "var(--background-primary)", height: "100%" }}>
                    <h2>Critical Load Error</h2>
                    <pre style={{ fontSize: "12px", color: "var(--text-muted)" }}>{error.stack || error.message}</pre>
                </div>
            );
        }

        if (!appComponent) {
            return (
                <div style={{ padding: "40px", background: "var(--background-primary)", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    Initializing Image Stream Workspace...
                </div>
            );
        }

        const MainApp = appComponent;
        return (
            <div ref={containerRef} id="datacore-component-root" style={{ width: "100%", height: isFullTab && !isInception ? "100%" : "600px", overflow: "hidden" }}>
                <MainApp
                    folderPath={folderPath}
                    dc={dc}
                    isFullTab={isFullTab && !isInception}
                    isInception={isInception}
                    onToggleFullTab={toggleFullTab}
                    {...props}
                />
            </div>
        );
    }

    return <SafeRoot />;
}

return { View };
