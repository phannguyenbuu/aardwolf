import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { WORKLOAD_DATA, RULES, kgToLbs, lbsToKg } from '../constants/data.js';
import {
    validateJibForCrane,
    get3DConfiguration,
    calculateTotalPrice,
    getRecommendedSuctionHead,
    checkCapacityStatus
} from '../utils/configuratorHelpers.js';

const STORAGE_KEY = 'AarwolfVacumn';

const ConfiguratorContext = createContext(null);

export function ConfiguratorProvider({ children }) {
    // Unit system: 'm' (metric: mm, m, kg) or 'Inch' (imperial: in, ft-in, lbs)
    const [unit, setUnitState] = useState('m');

    // Step 1: Crane Type
    const [craneType, setCraneTypeState] = useState('floor-mounted-crane');

    // Step 2: Jib Length
    const [jibLength, setJibLengthState] = useState('2.5m');

    // Step 3: Work Load Limit (WLL) - 9 levels
    const [workLoadLimit, setWorkLoadLimitState] = useState('45kg');

    // Step 4: Material Environment & Surface Type
    const [environment, setEnvironmentState] = useState('clean'); // 'clean' or 'dusty'
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
    const [suctionHeadId, setSuctionHeadIdState] = useState('round_single');

    // User authentication
    const [userName, setUserName] = useState(null);
    const [priceList, setPriceList] = useState(null);

    // Page navigation: 'configurator' or 'specification'
    const [currentPage, setCurrentPage] = useState('configurator');

    // Mobile 3D view modal toggle
    const [show3DModal, setShow3DModal] = useState(false);

    // 3D Loading state & Progress
    const [is3DLoading, setIs3DLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);

    // Camera preset view trigger
    const [cameraPresetTrigger, setCameraPresetTrigger] = useState(null);

    // Viewport render mode: 'interactive' or 'studio-render'
    const [viewportMode, setViewportMode] = useState('studio-render'); // Default to stunning studio render mode
    const [studioTheme, setStudioTheme] = useState('cornell'); // 'cornell', 'studio', 'workshop', 'blueprint'

    // Left Column active tab: 'user-setting' | 'component-materials' | 'environment' | 'studio-hd' | 'material-lib'
    const [activeLeftTab, setActiveLeftTab] = useState('user-setting');

    // Component Materials & PBR state
    const [selectedPart, setSelectedPart] = useState('crane');
    const [componentMaterials, setComponentMaterials] = useState({
        crane: 'steel_brushed',
        pump: 'plastic_yellow_aardwolf',
        tube: 'rubber_corrugated_tube',
        head: 'titanium_dark',
        suction: 'rubber_suction_pad',
        workpiece: 'aluminum_brushed'
    });

    const [customParams, setCustomParams] = useState({
        crane: { roughness: 0.32, metalness: 0.9, clearcoat: 0.3, color: '#dde2e8' },
        pump: { roughness: 0.25, metalness: 0.1, clearcoat: 0.6, color: '#f5b400' },
        tube: { roughness: 0.26, metalness: 0.05, clearcoat: 0.5, color: '#27272a' },
        head: { roughness: 0.35, metalness: 0.7, clearcoat: 0.3, color: '#20242a' },
        suction: { roughness: 0.88, metalness: 0.02, clearcoat: 0.0, color: '#181a1c' },
        workpiece: { roughness: 0.72, metalness: 0.05, clearcoat: 0.0, color: '#c0c8d2' }
    });

    const updateComponentMaterial = useCallback((partKey, matId) => {
        setComponentMaterials(prev => ({ ...prev, [partKey]: matId }));
    }, []);

    const updateCustomParam = useCallback((partKey, paramKey, value) => {
        setCustomParams(prev => ({
            ...prev,
            [partKey]: {
                ...prev[partKey],
                [paramKey]: value
            }
        }));
    }, []);

    const applyMaterialPreset = useCallback((presetMats) => {
        setComponentMaterials(presetMats);
    }, []);

    // Environment & Lighting states
    const [downlightEnabled, setDownlightEnabled] = useState(true);
    const [downlightIntensity, setDownlightIntensity] = useState(4.8);
    const [downlightColorTemp, setDownlightColorTemp] = useState('warm'); // 'warm' | 'neutral' | 'cool'
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

    // 2D SVG position content calculated for PDF
    const [pdfContent, setPdfContent] = useState(null);

    // Auto-update recommended suction head when surface or dimensions change
    useEffect(() => {
        const rec = getRecommendedSuctionHead(
            surfaceType,
            actualLoad.weight,
            actualLoad.length,
            actualLoad.width
        );
        if (rec) {
            setSuctionHeadIdState(rec.id);
        }
    }, [surfaceType, actualLoad.weight, actualLoad.length, actualLoad.width]);

    // Load initial state from LocalStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.selectedUnit) setUnitState(data.selectedUnit);
                if (data.craneType) setCraneTypeState(data.craneType);
                if (data.jibLength) setJibLengthState(data.jibLength);
                if (data.workLoadLimit) setWorkLoadLimitState(data.workLoadLimit);
                if (data.environment) setEnvironmentState(data.environment);
                if (data.surfaceType) setSurfaceTypeState(data.surfaceType);
                if (data.customNotes) setCustomNotesState(data.customNotes);
                if (data.actualLoad) setActualLoadState(data.actualLoad);
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
                selectedUnit: overrides.unit ?? unit,
                userName: overrides.userName ?? userName,
                priceList: overrides.priceList ?? priceList
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentObj));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }, [craneType, jibLength, workLoadLimit, environment, surfaceType, customNotes, actualLoad, suctionHeadId, unit, userName, priceList]);

    // Setters
    const setCraneType = useCallback((newType) => {
        setCraneTypeState(newType);
        setJibLengthState((prevJib) => validateJibForCrane(newType, prevJib));
    }, []);

    const setJibLength = useCallback((newJib) => setJibLengthState(newJib), []);
    const setWorkLoadLimit = useCallback((newWll) => setWorkLoadLimitState(newWll), []);
    const setEnvironment = useCallback((newEnv) => setEnvironmentState(newEnv), []);
    const setSurfaceType = useCallback((newSurf) => setSurfaceTypeState(newSurf), []);
    const setCustomNotes = useCallback((notes) => setCustomNotesState(notes), []);
    const setSuctionHeadId = useCallback((id) => setSuctionHeadIdState(id), []);
    const setUnit = useCallback((newUnit) => setUnitState(newUnit), []);

    const updateActualLoad = useCallback((updates) => {
        setActualLoadState((prev) => ({ ...prev, ...updates }));
    }, []);

    // Capacity status (Overload / Underload / Optimal)
    const capacityStatus = useMemo(() => {
        return checkCapacityStatus(workLoadLimit, actualLoad.weight);
    }, [workLoadLimit, actualLoad.weight]);

    // 1-Click switch to suggested WLL
    const applySuggestedWll = useCallback(() => {
        if (capacityStatus.suggestedWll) {
            setWorkLoadLimitState(capacityStatus.suggestedWll);
        }
    }, [capacityStatus]);

    // Requote action: reset to defaults
    const requote = useCallback(() => {
        setCraneTypeState('floor-mounted-crane');
        setJibLengthState('2.5m');
        setWorkLoadLimitState('45kg');
        setEnvironmentState('clean');
        setSurfaceTypeState('carton_smooth');
        setCustomNotes('');
        setActualLoadState({ weight: 35, length: 400, width: 300, height: 250 });
        setSuctionHeadIdState('round_single');
        setCurrentPage('configurator');
        saveToLocalStorage({
            craneType: 'floor-mounted-crane',
            jibLength: '2.5m',
            workLoadLimit: '45kg',
            environment: 'clean',
            surfaceType: 'carton_smooth'
        });
    }, [saveToLocalStorage]);

    // Quote action: validate and proceed to specification page
    const quote = useCallback(async () => {
        if (capacityStatus.status === 'OVERLOAD') {
            const confirmed = window.confirm(
                `Warning: Actual load (${actualLoad.weight} kg) exceeds current rated WLL (${capacityStatus.capacity} kg)!\n\nWould you like to automatically upgrade the WLL rating to ${capacityStatus.suggestedCapacity} kg and continue?`
            );
            if (confirmed) {
                applySuggestedWll();
            } else {
                return false;
            }
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
    }, [capacityStatus, actualLoad.weight, applySuggestedWll, saveToLocalStorage]);

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

            const res = await fetch('https://www.aardwolf.com.au/api/get_price.php', {
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

    // Calculated 3D configuration
    const config3D = useMemo(() => {
        return get3DConfiguration(craneType, jibLength, workLoadLimit, suctionHeadId, unit);
    }, [craneType, jibLength, workLoadLimit, suctionHeadId, unit]);

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

    // Current Workload item for specifications
    const currentWorkload = useMemo(() => {
        if (!workLoadLimit || !WORKLOAD_DATA[workLoadLimit]) return null;
        return WORKLOAD_DATA[workLoadLimit][unit];
    }, [workLoadLimit, unit]);

    const value = {
        unit,
        setUnit,
        craneType,
        setCraneType,
        jibLength,
        setJibLength,
        workLoadLimit,
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
        pdfContent,
        setPdfContent,
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
        setActiveLeftTab,
        selectedPart,
        setSelectedPart,
        componentMaterials,
        setComponentMaterials,
        customParams,
        setCustomParams,
        updateComponentMaterial,
        updateCustomParam,
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
        login,
        logout,
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
