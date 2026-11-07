import { useEffect } from "react";

export default function useViewportLighting({ refs, studioTheme, sceneLights, cornellLeftColor, cornellRightColor, cornellBleedIntensity, adminMode }) {
    const {
        sceneRef,
        blueprintGridRef,
        cornellGroupRef,
        shadowFloorRef,
        keyLightRef,
        ambientLightRef,
        fillLightRef,
        rimLightRef,
        cornellCeilingLightRef,
        rendererRef,
        composerRef,
        cornellEmitterMatRef,
        cornellLeftWallMatRef,
        cornellRightWallMatRef,
        cornellGreenBounceRef,
        cornellRedBounceRef,
    } = refs;
    useEffect(() => {
        if (!sceneRef.current) return;
        if (rendererRef.current) rendererRef.current.shadowMap.enabled = adminMode;
        for (const pass of composerRef.current?.passes || []) {
            if (pass.constructor.name === 'SSAOPass') pass.enabled = adminMode;
        }
        const overlay = sceneRef.current.getObjectByName('ground_shadow_overlay');
        if (overlay) overlay.visible = adminMode;

        const isCornell = studioTheme === 'cornell';
        if (blueprintGridRef.current) blueprintGridRef.current.visible = studioTheme === 'blueprint';

        // Toggle Cornell Room vs Studio Floor to prevent Z-Fighting
        if (cornellGroupRef.current) {
            cornellGroupRef.current.visible = isCornell;
        }
        if (shadowFloorRef.current) {
            shadowFloorRef.current.visible = !isCornell;
        }

        // Apply Custom Scene Lights
        if (sceneLights) {
            // 1. Key Light (Main Directional Light)
            if (keyLightRef.current) {
                keyLightRef.current.visible = sceneLights.keyLight.enabled;
                keyLightRef.current.intensity = sceneLights.keyLight.intensity;
                keyLightRef.current.color.set(sceneLights.keyLight.color);
                keyLightRef.current.castShadow = studioTheme === 'studio' ? false : sceneLights.keyLight.castShadow;
                keyLightRef.current.position.set(
                    sceneLights.keyLight.posX,
                    sceneLights.keyLight.posY,
                    sceneLights.keyLight.posZ
                );
            }

            // 2. Ambient Light
            if (ambientLightRef.current) {
                ambientLightRef.current.intensity = sceneLights.ambientLight.intensity;
                ambientLightRef.current.color.set(sceneLights.ambientLight.color);
            }

            // 3. Fill Light
            if (fillLightRef.current) {
                fillLightRef.current.visible = sceneLights.fillLight.enabled;
                fillLightRef.current.intensity = sceneLights.fillLight.intensity;
                fillLightRef.current.color.set(sceneLights.fillLight.color);
            }

            // 4. Rim Light
            if (rimLightRef.current) {
                rimLightRef.current.visible = sceneLights.rimLight.enabled;
                rimLightRef.current.intensity = sceneLights.rimLight.intensity;
                rimLightRef.current.color.set(sceneLights.rimLight.color);
            }

            // 5. Downlight Emitter (Cornell Box SpotLight)
            if (cornellCeilingLightRef.current) {
                cornellCeilingLightRef.current.visible = isCornell && sceneLights.downlight.enabled;
                cornellCeilingLightRef.current.intensity = sceneLights.downlight.intensity;
                cornellCeilingLightRef.current.castShadow = sceneLights.downlight.castShadow;
                cornellCeilingLightRef.current.color.set(sceneLights.downlight.color || '#fff6dc');
                if (sceneLights.downlight.angle) {
                    cornellCeilingLightRef.current.angle = sceneLights.downlight.angle;
                }
                if (sceneLights.downlight.penumbra !== undefined) {
                    cornellCeilingLightRef.current.penumbra = sceneLights.downlight.penumbra;
                }
            }

            // 6. Camera Tone Mapping Exposure
            if (rendererRef.current && sceneLights.exposure) {
                rendererRef.current.toneMappingExposure = sceneLights.exposure;
            }
        }

        // Cornell Box Wall Materials & Emitter Visibility
        if (cornellEmitterMatRef.current) {
            cornellEmitterMatRef.current.visible = isCornell && (sceneLights?.downlight?.enabled ?? true);
        }
        if (cornellLeftWallMatRef.current) {
            cornellLeftWallMatRef.current.color.set(cornellLeftColor);
        }
        if (cornellRightWallMatRef.current) {
            cornellRightWallMatRef.current.color.set(cornellRightColor);
        }
        if (cornellGreenBounceRef.current) {
            cornellGreenBounceRef.current.visible = isCornell;
            cornellGreenBounceRef.current.color.set(cornellLeftColor);
            cornellGreenBounceRef.current.intensity = cornellBleedIntensity;
        }
        if (cornellRedBounceRef.current) {
            cornellRedBounceRef.current.visible = isCornell;
            cornellRedBounceRef.current.color.set(cornellRightColor);
            cornellRedBounceRef.current.intensity = cornellBleedIntensity;
        }
    }, [studioTheme, sceneLights, cornellLeftColor, cornellRightColor, cornellBleedIntensity, adminMode]);
}
