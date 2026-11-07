import React, { useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ConfiguratorContext } from './configuratorContextInstance.js';
import { WORKLOAD_DATA, RULES, kgToLbs, lbsToKg } from '../constants/data.js';
import { getSettings, putSettings } from '../utils/settingsApi.js';
import { assemblyKey, objectKeys, mappingKey, resolveMaterial, defaultMaterialDefinitions, migrateSceneSettings } from '../utils/sceneSettings.js';
import {
    validateJibForCrane,
    isWllAllowed,
    get3DConfiguration,
    calculateTotalPrice,
    checkCapacityStatus,
    extractPoint3
} from '../utils/configuratorHelpers.js';
import { validateConfiguration } from '../utils/configurationValidation.js';
import { buildQuotationBom } from '../utils/quotationBom.js';
import { clearFollowingSteps, selectionEligibility } from '../utils/selectionRules.js';
import { defaultGrips, gripModelNames, resolveGrips } from '../utils/gripPoints.js';

const STORAGE_KEY = 'AarwolfVacumn';
// Steps that must be picked in the current session before a quote.
const REQUIRED_STEPS = { jib: 'jib length', wll: 'work load limit', environment: 'load type', surface: 'workpiece material', handle: 'handle control', suction: 'suction head' };

export function ConfiguratorProvider({ children }) {
    const captureCameraRef = useRef(null);
    const settingsRevisionRef = useRef(null);
    const legacySceneSettingsRef = useRef(null);
    const [cameraRestore, setCameraRestore] = useState(null);
    const [savedViews, setSavedViews] = useState({});
    const [modelSettings, setModelSettings] = useState({});
    const updateModelGrips = useCallback((name, grips) => setModelSettings(previous => ({ ...previous, [name]: { ...previous[name], grips } })), []);
    const [settingsStatus, setSettingsStatus] = useState('');
    const [savedFingerprint, setSavedFingerprint] = useState(null);
    const baselinePendingRef = useRef(true);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);
    const cameraBaselineRef = useRef(null);
    const currentCameraRef = useRef(null);
    const [cameraDirty, setCameraDirty] = useState(false);
    const trackCamera = useCallback(pose => {
        const signature = JSON.stringify([pose.position.map(n => +n.toFixed(3)), pose.target.map(n => +n.toFixed(3)), +pose.fov.toFixed(3)]);
        currentCameraRef.current = signature;
        if (cameraBaselineRef.current === null) cameraBaselineRef.current = signature;
        setCameraDirty(signature !== cameraBaselineRef.current);
    }, []);
    // Unit system: 'm' (metric: mm, m, kg) or 'Inch' (imperial: in, ft-in, lbs)
    const [unit, setUnitState] = useState('mm');
    // Step 1: Crane Type
    const [craneType, setCraneTypeState] = useState('floor-mounted-crane');
    // Step 2: Jib Length
    const [jibLength, setJibLengthState] = useState('2.5m');
    // Step 3: Work Load Limit (WLL) - 9 levels
    const [workLoadLimit, setWorkLoadLimitState] = useState('40kg');
    const [handleId, setHandleIdState] = useState('CF2');
    const [suctionModelVariant, setSuctionModelVariant] = useState('specific');
    // Step 4: Material Environment & Surface Type
    const [environment, setEnvironmentState] = useState('nonporous'); // Load permeability, independent from the workplace filter.
    const [surfaceType, setSurfaceTypeState] = useState('carton_smooth');
    const [customNotes, setCustomNotesState] = useState('');
    // Step 5: Actual Load & Dimensions
    const [actualLoad, setActualLoadState] = useState({
        weight: 35, // in kg
        length: 400, // in mm
        width: 300,  // in mm
        height: 250  // in mm
    });
    // Selected or Recommended Suction Head
    const [suctionHeadId, setSuctionHeadIdState] = useState('bellow_cups_1x_250');
    // Steps the user has picked this session. Only the crane type starts chosen, so other answers stay unticked after a reload.
    const [chosenSteps, setChosenSteps] = useState(() => new Set(['crane']));
    const markStepChosen = useCallback(step => setChosenSteps(previous => previous.has(step) ? previous : new Set(previous).add(step)), []);
    // User authentication
    const [userName, setUserName] = useState(null);
    const [priceList, setPriceList] = useState(null);
    // Page navigation: 'configurator' or 'specification'
    const [currentPage, setCurrentPage] = useState('configurator');
    // Mobile 3D view modal toggle
    const [show3DModal, setShow3DModal] = useState(false);
    // 3D Loading state & Progress
    // Starts true so the viewport shows its spinner from the first paint until the selected models load.
    const [is3DLoading, setIs3DLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    // Camera preset view trigger
    const [cameraPresetTrigger, setCameraPresetTrigger] = useState(null);
    // Viewport render mode: 'interactive' or 'studio-render'
    const [viewportMode, setViewportMode] = useState(() => new URLSearchParams(window.location.search).get('render') === 'interactive' ? 'interactive' : 'studio-render');
    const [studioTheme, setStudioTheme] = useState('studio'); // Default viewport environment.
    // Left Column active tab: 'user-setting' | 'component-materials' | 'environment' | 'studio-hd' | 'material-lib'
    const [activeLeftTab, setActiveLeftTab] = useState('user-setting');
    const [adminMode, setAdminMode] = useState(() => new URLSearchParams(window.location.search).get('admin') === '1' && localStorage.getItem('aardwolf-ui-mode') === 'admin');
    const toggleAdminMode = useCallback(() => setAdminMode(previous => {
        const next = !previous;
        localStorage.setItem('aardwolf-ui-mode', next ? 'admin' : 'user');
        return next;
    }), []);
    useEffect(() => { if (!adminMode) setActiveLeftTab('user-setting'); }, [adminMode]);
    // Calculated 3D configuration
    const config3D = useMemo(() => {
        return get3DConfiguration(craneType, jibLength, workLoadLimit, suctionHeadId, unit, handleId, suctionModelVariant);
    }, [craneType, jibLength, workLoadLimit, suctionHeadId, unit, handleId, suctionModelVariant]);
    useEffect(() => {
        if (!isWllAllowed(craneType, jibLength, workLoadLimit)) {
            const allowed = RULES.wllLevels.filter(item => isWllAllowed(craneType, jibLength, item.id));
            setWorkLoadLimitState(allowed.find(item => item.capacityKg >= actualLoad.weight)?.id || allowed.at(-1)?.id || '30kg');
        }
        if (config3D.selectedHandleId !== handleId) setHandleIdState(config3D.selectedHandleId);
    }, [workLoadLimit, config3D.selectedHandleId, handleId, craneType, jibLength]);
    // Component Materials & PBR state
    const [selectedPart, setSelectedPart] = useState('crane');
    const [selectedElement, setSelectedElement] = useState('');
    const [materialElements, setMaterialElements] = useState([]);
    const [materialClipboard, setMaterialClipboard] = useState(null);
    const [objectMaterialMapping, setObjectMaterialMapping] = useState({});
    const [materialDefinitions, setMaterialDefinitions] = useState(defaultMaterialDefinitions);
    const keys = useMemo(() => objectKeys(config3D), [config3D]);
    const componentMaterials = useMemo(() => ({ ...objectMaterialMapping, ...Object.fromEntries(Object.entries(keys).map(([part, key]) => [part, resolveMaterial(objectMaterialMapping, part, key)])) }), [objectMaterialMapping, keys]);
    const customParams = materialDefinitions;
    const assignMaterial = useCallback((targets, id) => {
        setObjectMaterialMapping(prev => ({ ...prev, ...Object.fromEntries(targets.map(target => [mappingKey(target, keys), id])) }));
    }, [keys]);
    const clearMaterial = useCallback(target => {
        setObjectMaterialMapping(prev => { const next = { ...prev }; delete next[mappingKey(target, keys)]; return next; });
    }, [keys]);
    const updateMaterialParam = useCallback((id, param, value) => {
        setMaterialDefinitions(prev => ({ ...prev, [id]: { ...prev[id], [param]: value } }));
    }, []);
    const customizeMaterial = useCallback((targets, sourceId, param, value) => {
        const id = `custom:${mappingKey(targets[0], keys)}:${sourceId.replace(/^custom:/, '')}`;
        setMaterialDefinitions(prev => ({ ...prev, [id]: { ...(prev[id] || prev[sourceId]), [param]: value } }));
        assignMaterial(targets, id);
    }, [keys, assignMaterial]);
    const updateComponentMaterial = useCallback((part, id) => {
        const targets = [part, ...materialElements.filter(element => element.partKey === part).map(element => element.key)];
        assignMaterial(targets, id);
    }, [assignMaterial, materialElements]);
    const applyMaterialPreset = useCallback(preset => {
        setObjectMaterialMapping(prev => {
            const next = { ...prev };
            for (const [part, id] of Object.entries(preset)) {
                next[keys[part]] = id;
                for (const key of Object.keys(next)) if (key.startsWith(keys[part] + '::')) delete next[key];
            }
            return next;
        });
    }, [keys]);
    // 3D Object Positioning & 3ds Max Transform Gizmo State
    const DEFAULT_PART_OFFSETS = useMemo(() => ({
        ground: { x: 0, y: 0, z: 0 },
        crane: { x: 0, y: 0, z: 0 },
        pump: { x: 0, y: 0, z: 0 },
        tube: { x: 0, y: 0, z: 0 },
        head: { x: 0, y: 0, z: 0 },
        suction: { x: 0, y: 0, z: 0 },
        workpiece: { x: 0, y: 0, z: 0 }
    }), []);
    const [assemblyPositions, setAssemblyPositions] = useState({});
    const activeAssemblyKey = assemblyKey({ unit, craneType, jibLength, workLoadLimit, suctionHeadId, handleId, suctionModelVariant, environment, surfaceType, actualLoad });
    const activeAssemblyKeyRef = useRef(activeAssemblyKey);
    activeAssemblyKeyRef.current = activeAssemblyKey;
    const partOffsets = assemblyPositions[activeAssemblyKey] || DEFAULT_PART_OFFSETS;
    const setPartOffsets = useCallback(update => setAssemblyPositions(prev => {
        const key = activeAssemblyKeyRef.current;
        return { ...prev, [key]: typeof update === 'function' ? update(prev[key] || DEFAULT_PART_OFFSETS) : update };
    }), []);
    const editHistoryRef = useRef({ past: [], present: null, future: [] });
    const editTransactionRef = useRef(false);
    const [editTransactionRevision, setEditTransactionRevision] = useState(0);
    const latestEditRef = useRef(null);
    latestEditRef.current = { assemblyPositions, objectMaterialMapping, materialDefinitions };
    const [, refreshHistory] = useState(0);
    const beginMoveEdit = useCallback(() => {
        if (editTransactionRef.current) return;
        const history = editHistoryRef.current;
        const before = latestEditRef.current;
        if (JSON.stringify(before) !== JSON.stringify(history.present)) {
            if (history.present) history.past = [...history.past, history.present].slice(-100);
            history.present = before;
            history.future = [];
        }
        editTransactionRef.current = true;
    }, []);
    const endMoveEdit = useCallback(() => {
        if (!editTransactionRef.current) return;
        editTransactionRef.current = false;
        // The effect sees the final React state even when pointer-up batches the last movement.
        setEditTransactionRevision(value => value + 1);
    }, []);
    useEffect(() => {
        if (editTransactionRef.current) return;
        const next = { assemblyPositions, objectMaterialMapping, materialDefinitions };
        const history = editHistoryRef.current;
        if (JSON.stringify(next) === JSON.stringify(history.present)) return;
        if (history.present) history.past = [...history.past, history.present].slice(-100);
        history.present = next;
        history.future = [];
        refreshHistory(n => n + 1);
    }, [assemblyPositions, objectMaterialMapping, materialDefinitions, editTransactionRevision]);
    const restoreEdit = useCallback((snapshot) => {
        setAssemblyPositions(snapshot.assemblyPositions);
        setObjectMaterialMapping(snapshot.objectMaterialMapping);
        setMaterialDefinitions(snapshot.materialDefinitions);
        refreshHistory(n => n + 1);
    }, []);
    const undoEdit = useCallback(() => {
        if (editTransactionRef.current) return;
        const history = editHistoryRef.current;
        if (!history.past.length) return;
        history.future.unshift(history.present);
        history.present = history.past.pop();
        restoreEdit(history.present);
    }, [restoreEdit]);
    const redoEdit = useCallback(() => {
        if (editTransactionRef.current) return;
        const history = editHistoryRef.current;
        if (!history.future.length) return;
        history.past.push(history.present);
        history.present = history.future.shift();
        restoreEdit(history.present);
    }, [restoreEdit]);
    const [gizmoEnabled, setGizmoEnabled] = useState(true);
    const [gizmoMode, setGizmoMode] = useState('translate'); // 'translate' | 'rotate'
    const [gizmoSize, setGizmoSize] = useState(0.85);
    const updatePartOffset = useCallback((partKey, axis, val) => {
        setPartOffsets(prev => ({
            ...prev,
            [partKey]: {
                x: 0, y: 0, z: 0,
                ...prev[partKey],
                [axis]: Number(val) || 0
            }
        }));
    }, [setPartOffsets]);
    const stepPartOffset = useCallback((partKey, axis, delta) => {
        setPartOffsets(prev => ({
            ...prev,
            [partKey]: {
                ...prev[partKey],
                [axis]: Math.round((prev[partKey]?.[axis] || 0) + delta)
            }
        }));
    }, [setPartOffsets]);
    const setPartOffsetFull = useCallback((partKey, newOffset) => {
        setPartOffsets(prev => ({
            ...prev,
            [partKey]: {
                ...prev[partKey],
                x: Math.round(newOffset.x || 0),
                y: Math.round(newOffset.y || 0),
                z: Math.round(newOffset.z || 0)
            }
        }));
    }, [setPartOffsets]);
    const updatePartRotation = useCallback((partKey, rotation) => {
        const snapped = Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, Math.round((Number(rotation[axis]) || 0) / 90) * 90]));
        setPartOffsets(prev => ({ ...prev, [partKey]: { x: 0, y: 0, z: 0, ...prev[partKey], rotation: snapped } }));
    }, [setPartOffsets]);
    const resetPartOffset = useCallback((partKey) => {
        setPartOffsets(prev => ({
            ...prev,
            [partKey]: { x: 0, y: 0, z: 0 }
        }));
    }, [setPartOffsets]);
    const resetAllPartOffsets = useCallback(() => {
        setPartOffsets(DEFAULT_PART_OFFSETS);
    }, [setPartOffsets]);
    // Detailed Scene Lighting Configuration
    const DEFAULT_LIGHTING = {
        keyLight: {
            enabled: true,
            intensity: 2.2,
            color: '#fffbf2',
            castShadow: true,
            posX: 3200,
            posY: 5600,
            posZ: 3800
        },
        downlight: {
            enabled: true,
            intensity: 4.8,
            colorTemp: 'warm', // 'warm', 'neutral', 'cool'
            color: '#fff6dc',
            castShadow: false, // Default false to prevent dual shadow fight & flickering!
            angle: 0.95,
            penumbra: 0.85
        },
        ambientLight: {
            intensity: 0.75,
            color: '#ffffff'
        },
        fillLight: {
            enabled: true,
            intensity: 1.2,
            color: '#e8f0fc'
        },
        rimLight: {
            enabled: true,
            intensity: 1.4,
            color: '#fffaea'
        },
        environment: { intensity: 1, rotation: 0 },
        shadow: { darkness: 1, blur: 12 },
        exposure: 1.15
    };
    const [sceneLights, setSceneLights] = useState(DEFAULT_LIGHTING);
    const updateSceneLight = useCallback((lightName, field, value) => {
        setSceneLights(prev => ({
            ...prev,
            [lightName]: {
                ...prev[lightName],
                [field]: value
            }
        }));
    }, []);
    const setExposure = useCallback((val) => {
        setSceneLights(prev => ({
            ...prev,
            exposure: val
        }));
    }, []);
    const resetLighting = useCallback(() => {
        setSceneLights(DEFAULT_LIGHTING);
    }, []);
    // Aliases for backward compatibility
    const downlightEnabled = sceneLights.downlight.enabled;
    const setDownlightEnabled = useCallback((val) => updateSceneLight('downlight', 'enabled', val), [updateSceneLight]);
    const downlightIntensity = sceneLights.downlight.intensity;
    const setDownlightIntensity = useCallback((val) => updateSceneLight('downlight', 'intensity', val), [updateSceneLight]);
    const downlightColorTemp = sceneLights.downlight.colorTemp;
    const setDownlightColorTemp = useCallback((val) => updateSceneLight('downlight', 'colorTemp', val), [updateSceneLight]);
    const [cornellLeftColor, setCornellLeftColor] = useState('#1caa28');
    const [cornellRightColor, setCornellRightColor] = useState('#e6261f');
    const [cornellBleedIntensity, setCornellBleedIntensity] = useState(1.4);
    // Wavelet Filter & Path Tracer settings (Matching Domenicobrz reference)
    const [waveletParams, setWaveletParams] = useState({
        c_phi: 105,
        n_phi: 0.01,
        p_phi: 1.0,
        c_phiMultiplier: 0.34,
        stepMultiplier: 1.5,
        iterations: 10,
        atrous5x5: true,
        spp: 3,
        mirrorIndex: 1,
        maxFramesHistory: 10,
        fibaHistoryMod: 0.54,
        qualityPreset: 'highQuality'
    });
    const updateWaveletParam = useCallback((key, val) => {
        setWaveletParams(prev => ({ ...prev, [key]: val }));
    }, []);
    const applyQualityPreset = useCallback((presetName) => {
        const presets = {
            lowQuality: { spp: 1, iterations: 4, c_phi: 80, stepMultiplier: 1.2, qualityPreset: 'lowQuality' },
            mediumQuality: { spp: 2, iterations: 6, c_phi: 95, stepMultiplier: 1.35, qualityPreset: 'mediumQuality' },
            highQuality: { spp: 3, iterations: 10, c_phi: 105, stepMultiplier: 1.5, qualityPreset: 'highQuality' },
            veryHighQuality: { spp: 6, iterations: 14, c_phi: 120, stepMultiplier: 1.7, qualityPreset: 'veryHighQuality' }
        };
        if (presets[presetName]) {
            setWaveletParams(prev => ({ ...prev, ...presets[presetName] }));
        }
    }, []);
    // Studio HD Render controls
    const [showSpecsHUD, setShowSpecsHUD] = useState(true);
    const [isTurntableActive, setIsTurntableActive] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportRenderTrigger, setExportRenderTrigger] = useState(0);
    const triggerExportRender = useCallback(() => {
        setExportRenderTrigger(Date.now());
    }, []);
    const [cameraTelemetry, setCameraTelemetry] = useState({
        posX: 1130,
        posY: 1200,
        posZ: 7500,
        targetX: 1130,
        targetY: 1200,
        targetZ: 0,
        distance: 7500,
        fov: 45,
        azimuth: 0,
        elevation: 0,
        preset: 'Cornell Reference'
    });
    // Canvas snapshot for PDF report
    const [canvasSnapshot, setCanvasSnapshot] = useState(null);
    const takeSnapshotRef = useRef(null);
    // Default values may remain for preview, but cannot count as explicit answers.
    useEffect(() => {
        const head = RULES.suctionHeads.find(item => item.id === suctionHeadId);
        const capacityKg = RULES.wllLevels.find(item => item.id === workLoadLimit)?.capacityKg;
        const validPad = head && selectionEligibility(head, { surfaceType, environment, actualLoad, capacityKg }).eligible;
        setChosenSteps(previous => {
            if (!previous.has('suction') || validPad) return previous;
            const next = new Set(previous); next.delete('suction'); return next;
        });
    }, [suctionHeadId, surfaceType, environment, actualLoad, workLoadLimit]);
    // Load initial state from LocalStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.selectedUnit) setUnitState(data.selectedUnit === 'Inch' ? 'Inch' : 'mm');
                if (data.craneType) setCraneTypeState(data.craneType);
                if (data.jibLength) setJibLengthState(data.jibLength);
                if (data.workLoadLimit) setWorkLoadLimitState(data.workLoadLimit);
                if (data.environment) setEnvironmentState(data.environment);
                if (data.surfaceType) setSurfaceTypeState(data.surfaceType);
                if (data.customNotes) setCustomNotesState(data.customNotes);
                if (data.actualLoad) setActualLoadState(data.actualLoad);
                if (data.handleId) setHandleIdState(data.handleId);
                if (data.suctionHeadId) setSuctionHeadIdState(data.suctionHeadId);
                if (data.userName) setUserName(data.userName);
                if (data.priceList) setPriceList(data.priceList);
            }
        } catch (e) {
            console.error('Failed to load settings from localStorage:', e);
        }
    }, []);
    // Save to LocalStorage
    const saveToLocalStorage = useCallback((overrides = {}) => {
        try {
            const currentObj = {
                craneType: overrides.craneType ?? craneType,
                jibLength: overrides.jibLength ?? jibLength,
                workLoadLimit: overrides.workLoadLimit ?? workLoadLimit,
                environment: overrides.environment ?? environment,
                surfaceType: overrides.surfaceType ?? surfaceType,
                customNotes: overrides.customNotes ?? customNotes,
                actualLoad: overrides.actualLoad ?? actualLoad,
                suctionHeadId: overrides.suctionHeadId ?? suctionHeadId,
                handleId,
                selectedUnit: overrides.unit ?? unit,
                userName: overrides.userName ?? userName,
                priceList: overrides.priceList ?? priceList
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentObj));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }, [craneType, jibLength, workLoadLimit, environment, surfaceType, customNotes, actualLoad, suctionHeadId, unit, userName, priceList]);
    // Editing upstream answers requires explicit confirmation of downstream steps.
    const revokeFollowing = useCallback(step => setChosenSteps(previous => clearFollowingSteps(previous, step)), []);
    const setCraneType = useCallback(value => {
        setCraneTypeState(value);
        setJibLengthState(previous => validateJibForCrane(value, previous));
        revokeFollowing('crane');
    }, [revokeFollowing]);
    const setJibLength = useCallback(value => { setJibLengthState(value); revokeFollowing('jib'); }, [revokeFollowing]);
    const setWorkLoadLimit = useCallback(value => {
        setWorkLoadLimitState(value);
        const max = RULES.wllLevels.find(item => item.id === value)?.capacityKg;
        if (max) setActualLoadState(previous => ({ ...previous, weight: Math.min(previous.weight, max) }));
        revokeFollowing('wll');
    }, [revokeFollowing]);
    const setEnvironment = useCallback(value => { setEnvironmentState(value); revokeFollowing('environment'); }, [revokeFollowing]);
    const setSurfaceType = useCallback(value => {
        setSurfaceTypeState(value);
        const presets = {
            carton_smooth: { color: '#c69b68', roughness: .95, metalness: 0 },
            sheet_metal: { color: '#bec8d2', roughness: .3, metalness: .8 },
            slab: { color: '#d4cfbf', roughness: .8, metalness: 0 },
            stone: { color: '#8b9695', roughness: .75, metalness: 0 },
            concrete: { color: '#a9adae', roughness: .98, metalness: 0 },
        };
        const id = value === 'porous_rough' ? 'workpiece_wood' : `workpiece:${value}`;
        if (presets[value]) setMaterialDefinitions(previous => ({ ...previous, [id]: presets[value] }));
        setObjectMaterialMapping(previous => ({ ...previous, '@workpiece': id, 'workpiece::box': id }));
        revokeFollowing('surface');
    }, [revokeFollowing]);
    const setHandleId = useCallback(value => { setHandleIdState(value); revokeFollowing('handle'); }, [revokeFollowing]);
    const setCustomNotes = useCallback(value => setCustomNotesState(value), []);
    const setSuctionHeadId = useCallback(value => setSuctionHeadIdState(value), []);
    const setUnit = useCallback(value => setUnitState(value === 'Inch' ? 'Inch' : 'mm'), []);
    const updateActualLoad = useCallback(updates => {
        setActualLoadState(previous => ({ ...previous, ...updates }));
    }, []);
    // Capacity status (Overload / Underload / Optimal)
    const capacityStatus = useMemo(() => {
        return checkCapacityStatus(workLoadLimit, actualLoad.weight, craneType, jibLength);
    }, [workLoadLimit, actualLoad.weight, craneType, jibLength]);
    // 1-Click switch to suggested WLL
    const applySuggestedWll = useCallback(() => {
        if (capacityStatus.suggestedWll) {
            setWorkLoadLimitState(capacityStatus.suggestedWll);
        }
    }, [capacityStatus]);
    const ruleValidation = validateConfiguration({ craneType, jibLength, workLoadLimit, surfaceType, environment, actualLoad, suctionHeadId, handleId, config3D });
    const missingSteps = Object.entries(REQUIRED_STEPS).filter(([step]) => !chosenSteps.has(step)).map(([, label]) => `Select the ${label}.`);
    const configurationValidation = missingSteps.length ? { valid: false, errors: [...missingSteps, ...ruleValidation.errors] } : ruleValidation;
    const requote = useCallback(() => {
        saveToLocalStorage();
        setSettingsStatus('Price recalculated for the current configuration');
    }, [saveToLocalStorage]);
    // Quote action: validate and proceed to specification page
    const quote = useCallback(async () => {
        if (!configurationValidation.valid) {
            setSettingsStatus(configurationValidation.errors.join(' '));
            return false;
        }
        // Take snapshot from 3D canvas if available
        if (takeSnapshotRef.current) {
            try {
                const dataUrl = await takeSnapshotRef.current();
                setCanvasSnapshot(dataUrl);
            } catch (err) {
                console.warn('Could not capture 3D snapshot:', err);
            }
        }
        saveToLocalStorage();
        setCurrentPage('specification');
        return true;
    }, [configurationValidation, saveToLocalStorage]);
    const backToConfigurator = useCallback(() => {
        saveToLocalStorage();
        setCurrentPage('configurator');
    }, [saveToLocalStorage]);
    // Login API
    const login = useCallback(async (username, password) => {
        if (!username || !password) {
            alert('Please enter both username and password.');
            return false;
        }
        try {
            const formData = new URLSearchParams();
            formData.append('txtUserName', username);
            formData.append('txtPassword', password);
            formData.append('_submit_login', '1');
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });
            const response = await res.json();
            if (response && response.user && response.user.name) {
                setPriceList(response.price);
                setUserName(response.user.name);
                saveToLocalStorage({ userName: response.user.name, priceList: response.price });
                return true;
            } else {
                alert('Login failed! Invalid username or password.');
                return false;
            }
        } catch (error) {
            console.error('Login Failed:', error);
            alert('Login failed! Please try again later.');
            return false;
        }
    }, [saveToLocalStorage]);
    const logout = useCallback(() => {
        setUserName(null);
        saveToLocalStorage({ userName: null });
    }, [saveToLocalStorage]);
    // Calculated Total Price
    const totalPrice = useMemo(() => {
        if (!userName || !priceList) return null;
        return calculateTotalPrice(
            priceList,
            workLoadLimit,
            config3D.crane,
            config3D.headStack,
            config3D.suctionPack,
            environment,
            unit
        );
    }, [userName, priceList, workLoadLimit, config3D, environment, unit]);
    const quotationBom = useMemo(() => buildQuotationBom({ workLoadLimit, config3D, environment, priceList }), [workLoadLimit, config3D, environment, priceList]);
    // Current Workload item for specifications
    const currentWorkload = useMemo(() => {
        if (!workLoadLimit || !WORKLOAD_DATA[workLoadLimit]) return null;
        return WORKLOAD_DATA[workLoadLimit][unit === 'Inch' ? 'Inch' : 'm'];
    }, [workLoadLimit, unit]);
    // Base kinematic assembly coordinates in Three.js space (X, Y up, Z depth)
    const basePositions = useMemo(() => {
        let p1 = { x: -87, y: 0, z: 0 };
        let p2 = { x: 2612, y: 0, z: 2119 };
        if (config3D?.crane?.name) {
            const [parsedP1, parsedP2] = extractPoint3(config3D.crane.name);
            if (parsedP1) p1 = parsedP1;
            if (parsedP2) p2 = parsedP2;
        }
        const isMobile = craneType?.toLowerCase().includes('mobile');
        const h = Math.max(20, actualLoad?.height || 250);
        const positions = {
            crane: { x: 0, y: 0, z: 0 },
            ground: { x: 0, y: 0, z: 0 },
            pump: { x: p1.x, y: p1.z + (isMobile ? 310 : 0), z: p1.y },
            tube: { x: p2.x + 25.5, y: p2.z, z: p2.y },
            head: { x: p2.x + 25.5, y: p2.z - (config3D.tube?.heightMm || 1949.383), z: p2.y },
            suction: { x: p2.x + 25.5, y: p2.z - (config3D.tube?.heightMm || 1949.383) - (config3D.headStack?.boundsMm ? config3D.headStack.boundsMm.max[2] - config3D.headStack.boundsMm.min[2] : config3D.headStack?.heightMm || 0), z: p2.y },
            workpiece: { x: p2.x, y: Math.round(h / 2), z: p2.y }
        };
        const names = gripModelNames(config3D);
        const grips = Object.fromEntries(Object.keys(names).map(part => [part, resolveGrips(part, config3D, modelSettings[names[part]]?.grips)]));
        const delta = (part, point) => Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, grips[part][point][axis] - defaultGrips(part, config3D)[point][axis]]));
        const add = (position, value, factor = 1) => { for (const axis of ['x', 'y', 'z']) position[axis] += value[axis] * factor; };
        add(positions.pump, delta('crane', 'p1')); add(positions.pump, delta('pump', 'p1'), -1);
        add(positions.tube, delta('crane', 'p2')); add(positions.tube, delta('tube', 'p1'), -1);
        for (const part of ['head', 'suction']) {
            add(positions[part], delta('crane', 'p2')); add(positions[part], delta('tube', 'p1'), -1); add(positions[part], delta('tube', 'p2'));
            add(positions[part], delta('head', 'p1'), -1);
        }
        add(positions.suction, delta('head', 'p2')); add(positions.suction, delta('suction', 'p1'), -1);
        return positions;
    }, [config3D, craneType, actualLoad?.height, modelSettings]);
    const applySavedSettings = useCallback((document) => {
        baselinePendingRef.current = true;
        cameraBaselineRef.current = null;
        legacySceneSettingsRef.current = document.legacySceneSettings || (document.version >= 2 ? null : { global: document.global, models: document.models });
        settingsRevisionRef.current = document.updatedAt || null;
        const g = document.global;
        const sceneSettings = migrateSceneSettings(document);
        setModelSettings(sceneSettings.models);
        setMaterialDefinitions(sceneSettings.materials);
        setObjectMaterialMapping(sceneSettings.mapping);
        setAssemblyPositions(sceneSettings.positions);
        if (!g) return;
        if (g.unit) setUnitState(g.unit === 'Inch' ? 'Inch' : 'mm');
        if (g.craneType) setCraneTypeState(g.craneType);
        if (g.jibLength) setJibLengthState(g.jibLength);
        if (g.workLoadLimit) setWorkLoadLimitState(g.workLoadLimit);
        if (g.environment) setEnvironmentState(g.environment);
        if (g.surfaceType) setSurfaceTypeState(g.surfaceType);
        if (g.actualLoad) setActualLoadState(g.actualLoad);
        if (g.suctionHeadId) setSuctionHeadIdState(g.suctionHeadId);
        if (g.handleId) setHandleIdState(g.handleId);
        if (g.suctionModelVariant) setSuctionModelVariant(g.suctionModelVariant);
        if (typeof g.customNotes === 'string') setCustomNotesState(g.customNotes);
        if (g.sceneLights) setSceneLights(g.sceneLights.depthPresetApplied ? g.sceneLights : { ...g.sceneLights,
            depthPresetApplied: true,
            environment: { ...g.sceneLights.environment, intensity: 0.85 },
            ambientLight: { ...g.sceneLights.ambientLight, intensity: 0.3 },
            keyLight: { ...g.sceneLights.keyLight, intensity: 1.6, posX: -3400, posY: 5600, posZ: 3800 },
            fillLight: { ...g.sceneLights.fillLight, intensity: 0.45 },
            rimLight: { ...g.sceneLights.rimLight, intensity: 0.8 },
            exposure: 0.9
        });
        if (g.studioTheme) setStudioTheme(g.studioTheme);
        if (g.viewportMode) setViewportMode(g.viewportMode === 'hdr-ssr' ? 'studio-render' : g.viewportMode);
        if (g.waveletParams) setWaveletParams(g.waveletParams);
        if (g.cornellLeftColor) setCornellLeftColor(g.cornellLeftColor);
        if (g.cornellRightColor) setCornellRightColor(g.cornellRightColor);
        if (Number.isFinite(g.cornellBleedIntensity)) setCornellBleedIntensity(g.cornellBleedIntensity);
        if (typeof g.showSpecsHUD === 'boolean') setShowSpecsHUD(g.showSpecsHUD);
        if (g.savedViews) setSavedViews(g.savedViews);
        if (g.camera) setCameraRestore({ ...g.camera, request: Date.now() });
    }, []);
    const persistentState = { modelSettings, materialDefinitions, objectMaterialMapping, assemblyPositions, unit, craneType, jibLength, workLoadLimit, environment, surfaceType, actualLoad, suctionHeadId, handleId, suctionModelVariant, customNotes, savedViews, sceneLights, studioTheme, viewportMode, waveletParams, cornellLeftColor, cornellRightColor, cornellBleedIntensity, showSpecsHUD };
    const fingerprint = JSON.stringify(persistentState);
    useEffect(() => {
        if (baselinePendingRef.current) {
            baselinePendingRef.current = false;
            setSavedFingerprint(fingerprint);
        }
    }, [fingerprint]);
    const settingsDirty = (savedFingerprint !== null && savedFingerprint !== fingerprint) || cameraDirty;
    useEffect(() => {
        let active = true;
        getSettings().then(document => { if (active) applySavedSettings(document); })
            .catch(() => { if (active) setSettingsStatus('Settings service unavailable'); });
        return () => { active = false; };
    }, [applySavedSettings]);
    useEffect(() => {
        let active = true;
        const refreshSharedMaterials = async () => {
            try {
                const document = await getSettings();
                if (!active || document.version !== 2 || !document.updatedAt || document.updatedAt === settingsRevisionRef.current) return;
                settingsRevisionRef.current = document.updatedAt;
                const refreshed = migrateSceneSettings(document);
                setMaterialDefinitions(refreshed.materials);
                setObjectMaterialMapping(refreshed.mapping);
            } catch { /* Keep unsaved edits when the service is unavailable. */ }
        };
        const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('aardwolf-materials');
        if (channel) channel.onmessage = refreshSharedMaterials;
        window.addEventListener('focus', refreshSharedMaterials);
        return () => { active = false; channel?.close(); window.removeEventListener('focus', refreshSharedMaterials); };
    }, []);
    const saveAllSettings = async () => {
        if (settingsSaving) return;
        const camera = captureCameraRef.current?.();
        if (!camera) { setSettingsStatus('Wait for the 3D viewer to load'); return; }
        setSettingsStatus('Saving...');
        setSettingsSaving(true);
        setSettingsSaved(false);
        // Use the exact pose captured by Save, even between telemetry updates.
        const savingCamera = JSON.stringify([camera.position.map(n => +n.toFixed(3)), camera.target.map(n => +n.toFixed(3)), +camera.fov.toFixed(3)]);
        currentCameraRef.current = savingCamera;
        try {
            const allViews = { ...camera.views, ...savedViews };
            const saved = await putSettings({ version: 2, legacySceneSettings: legacySceneSettingsRef.current, models: modelSettings, materials: materialDefinitions, materialMapping: objectMaterialMapping, assemblies: assemblyPositions, global: {
                unit, craneType, jibLength, workLoadLimit, environment, surfaceType, actualLoad,
                suctionHeadId, handleId, suctionModelVariant, customNotes, camera, savedViews: allViews,
                sceneLights, studioTheme, viewportMode, waveletParams,
                cornellLeftColor, cornellRightColor, cornellBleedIntensity, showSpecsHUD
            } });
            settingsRevisionRef.current = saved.updatedAt;
            if (typeof BroadcastChannel !== 'undefined') { const channel = new BroadcastChannel('aardwolf-materials'); channel.postMessage('saved'); channel.close(); }
            setSavedViews(allViews);
            setSavedFingerprint(JSON.stringify({ ...persistentState, savedViews: allViews }));
            cameraBaselineRef.current = savingCamera;
            setCameraDirty(currentCameraRef.current !== savingCamera);
            setSettingsSaved(true);
            setSettingsStatus('All settings and default camera saved');
        } catch (error) { setSettingsStatus(error.message); }
        finally { setSettingsSaving(false); }
    };
    const saveCameraView = (name) => {
        const camera = captureCameraRef.current?.();
        if (name.trim() && camera) setSavedViews(prev => ({ ...prev, [name.trim()]: camera }));
    };
    const value = {
        chosenSteps, markStepChosen,
        captureCameraRef, cameraRestore, setCameraRestore, savedViews, saveCameraView,
        modelSettings, updateModelGrips, saveAllSettings, settingsStatus, settingsDirty, settingsSaving, settingsSaved, trackCamera, customizeMaterial,
        undoEdit,
        beginMoveEdit, endMoveEdit,
        redoEdit,
        canUndo: editHistoryRef.current.past.length > 0,
        canRedo: editHistoryRef.current.future.length > 0,
        unit,
        setUnit,
        craneType,
        setCraneType,
        jibLength,
        setJibLength,
        workLoadLimit,
        handleId, setHandleId,
        suctionModelVariant, setSuctionModelVariant,
        setWorkLoadLimit,
        environment,
        setEnvironment,
        surfaceType,
        setSurfaceType,
        customNotes,
        setCustomNotes,
        actualLoad,
        updateActualLoad,
        suctionHeadId,
        setSuctionHeadId,
        capacityStatus,
        applySuggestedWll,
        userName,
        priceList,
        totalPrice,
        currentWorkload,
        config3D,
        canvasSnapshot,
        setCanvasSnapshot,
        takeSnapshotRef,
        currentPage,
        setCurrentPage,
        show3DModal,
        setShow3DModal,
        is3DLoading,
        setIs3DLoading,
        loadingProgress,
        setLoadingProgress,
        cameraPresetTrigger,
        setCameraPresetTrigger,
        viewportMode,
        setViewportMode,
        studioTheme,
        setStudioTheme,
        activeLeftTab,
        adminMode, toggleAdminMode,
        setActiveLeftTab,
        selectedPart,
        setSelectedPart,
        selectedElement, setSelectedElement,
        materialElements, setMaterialElements,
        materialClipboard, setMaterialClipboard,
        componentMaterials,
        assignMaterial, clearMaterial, updateMaterialParam, materialDefinitions, objectMaterialMapping,
        customParams,
        updateComponentMaterial,
        applyMaterialPreset,
        downlightEnabled,
        setDownlightEnabled,
        downlightIntensity,
        setDownlightIntensity,
        downlightColorTemp,
        setDownlightColorTemp,
        cornellLeftColor,
        setCornellLeftColor,
        cornellRightColor,
        setCornellRightColor,
        cornellBleedIntensity,
        setCornellBleedIntensity,
        sceneLights,
        updateSceneLight,
        setExposure,
        resetLighting,
        waveletParams,
        setWaveletParams,
        updateWaveletParam,
        applyQualityPreset,
        showSpecsHUD,
        setShowSpecsHUD,
        isTurntableActive,
        setIsTurntableActive,
        isExporting,
        setIsExporting,
        exportRenderTrigger,
        triggerExportRender,
        cameraTelemetry,
        setCameraTelemetry,
        basePositions,
        partOffsets,
        setPartOffsets,
        updatePartOffset,
        stepPartOffset,
        setPartOffsetFull,
        updatePartRotation,
        resetPartOffset,
        resetAllPartOffsets,
        gizmoEnabled,
        setGizmoEnabled,
        gizmoMode,
        setGizmoMode,
        gizmoSize,
        setGizmoSize,
        login,
        logout,
        configurationValidation,
        quotationBom,
        requote,
        quote,
        backToConfigurator
    };
    return (
        <ConfiguratorContext.Provider value={value}>
            {children}
        </ConfiguratorContext.Provider>
    );
}
export function useConfigurator() {
    const context = useContext(ConfiguratorContext);
    if (!context) {
        throw new Error('useConfigurator must be used within a ConfiguratorProvider');
    }
    return context;
}
