import { useCallback, useEffect } from "react";
import { resolveMaterial } from "../../utils/sceneSettings.js";
import { createPBRMaterial, applyWorldTextureSize } from "../../constants/pbrMaterials.js";
import { applyMaterialEdgeBevel } from "../../rendering/materialEdgeBevel.js";

export default function useViewportMaterials({ refs, modelSettings, objectMaterialMapping, componentMaterials, customParams, setMaterialElements, materialRefresh }) {
    const { sceneRef, isReadyRef, texturesRef } = refs;
    const applyComponentMaterials = useCallback((mats, overrides) => {
        const scene = sceneRef.current;
        if (!scene || !isReadyRef.current) return;

        scene.traverse((child) => {
            if (child.isMesh && child.userData?.partKey && (!child.isStageElement || child.userData.partKey === 'ground') && !child.isSprite && !child.isLineSegments) {
                const partKey = child.userData?.partKey;
                if (partKey && mats[partKey]) {
                    const model = modelSettings[child.userData.modelName] || {};
                    const index = child.userData.elementKey?.split('::').slice(2).join('::');
                    const matId = resolveMaterial(objectMaterialMapping, partKey, child.userData.modelName, index || undefined);
                    const customOverride = { ...overrides[matId] };
                    const signature = JSON.stringify([matId, customOverride, customOverride.originalSurfaces?.map(s => overrides[s.presetId])]);
                    if (child.userData.materialSignature === signature) return;
                    const pbrMat = createPBRMaterial(matId, customOverride, overrides);
                    applyMaterialEdgeBevel(child, pbrMat);
                    applyWorldTextureSize(child, pbrMat);

                    if (partKey === 'tube' && texturesRef.current.tubeTex && !customOverride.diffuseImage && !customOverride.originalSurfaces && matId === 'yellow_tube_logo') {
                        pbrMat.map = texturesRef.current.tubeTex;
                        pbrMat.needsUpdate = true;
                    }

                    const previous = child.material;
                    child.material = pbrMat;
                    child.userData.materialSignature = signature;
                    (Array.isArray(previous) ? previous : [previous]).forEach(material => material?.dispose());
                }
            }
        });
    }, [modelSettings, objectMaterialMapping]);

    // Reapply materials whenever componentMaterials or customParams change
    useEffect(() => {
        if (isReadyRef.current) {
            applyComponentMaterials(componentMaterials, customParams);
            setMaterialElements(previous => previous.map(element => {
                const meshIndex = element.key.split('::').slice(2).join('::');
                const modelName = element.key.split('::').length >= 3 ? element.key.split('::')[1] : undefined;
                const material = resolveMaterial(objectMaterialMapping, element.partKey, modelName, meshIndex || undefined);
                return { ...element, material, params: customParams[material] };
            }));
        }
    }, [componentMaterials, customParams, applyComponentMaterials, materialRefresh]);
}
