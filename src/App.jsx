// App.jsx - Coordinator for IMAGE STREAM
function App(props) {
    const { folderPath, dc, isFullTab, isInception, onToggleFullTab, ...rest } = props;
    const { useState, useEffect } = dc;

    const [modules, setModules] = useState(null);
    const [error, setError] = useState(null);

    useEffect(function () {
        async function loadModules() {
            try {
                // Load local static dependencies using absolute vault pathing
                const domUtilsPath = folderPath + "/src/utils/domUtils.jsx";
                const stylesPath = folderPath + "/src/styles/styles.jsx";
                const componentPath = folderPath + "/src/components/StreamComponent.jsx";

                const [domUtils, stylesModule, componentModule] = await Promise.all([
                    dc.require(domUtilsPath),
                    dc.require(stylesPath),
                    dc.require(componentPath)
                ]);

                // Load the universal LoadScript upgrade from its production path
                const loadScriptPath = dc.resolvePath("LOAD SCRIPT/src/LoadScriptUpgrade.js");
                const loadScriptModule = await dc.require(loadScriptPath);

                setModules({
                    STYLES: stylesModule.STYLES,
                    StreamComponent: componentModule.StreamComponent,
                    loadScript: loadScriptModule.loadScript
                });
            } catch (e) {
                console.error("App module loading failed:", e);
                setError(e);
            }
        }
        loadModules();
    }, [folderPath]);

    if (error) {
        return (
            <div style={{ color: "var(--text-error, #ef4444)", padding: "20px", fontFamily: "monospace" }}>
                <h3>Failed to load Image Stream component modules:</h3>
                <pre>{error.stack || error.message}</pre>
            </div>
        );
    }

    if (!modules) {
        return (
            <div style={{ padding: "20px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                Initializing Image Stream dependencies...
            </div>
        );
    }

    const { STYLES, StreamComponent, loadScript } = modules;

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--background-primary)' }}>
            <StreamComponent
                dc={dc}
                loadScript={loadScript}
                isFullTab={isFullTab}
                isInception={isInception}
                onToggleFullTab={onToggleFullTab}
                styles={STYLES}
                {...rest}
            />
        </div>
    );
}

return { App };
