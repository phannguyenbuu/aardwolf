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
                `Cảnh báo: Tải trọng thực tế (${actualLoad.weight} kg) đang vượt quá định mức WLL (${capacityStatus.capacity} kg)!\n\nBạn có muốn tự động nâng mức WLL lên ${capacityStatus.suggestedCapacity} kg và tiếp tục không?`
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
                console.warn('Could not take snapshot:', err);
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
