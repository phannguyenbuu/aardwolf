import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { WORKLOAD_DATA } from '../constants/data.js';
import {
    validateJibForCrane,
    get3DConfiguration,
    calculateTotalPrice
} from '../utils/configuratorHelpers.js';

const STORAGE_KEY = 'AarwolfVacumn';

const ConfiguratorContext = createContext(null);

export function ConfiguratorProvider({ children }) {
    const [unit, setUnitState] = useState('m');
    const [craneType, setCraneTypeState] = useState('floor-mounted-crane');
    const [jibLength, setJibLengthState] = useState('2.5m');
    const [workLoadLimit, setWorkLoadLimitState] = useState(null);
    const [loadType, setLoadTypeState] = useState(null);

    const [userName, setUserName] = useState(null);
    const [priceList, setPriceList] = useState(null);

    const [currentPage, setCurrentPage] = useState('configurator'); // 'configurator' or 'specification'
    const [show3DModal, setShow3DModal] = useState(false); // Mobile 3D view toggle
    const [is3DLoading, setIs3DLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);

    // Camera preset view target trigger
    const [cameraPresetTrigger, setCameraPresetTrigger] = useState(null);

    // 2D SVG content calculated for PDF
    const [pdfContent, setPdfContent] = useState(null);

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
                if (data.loadType) setLoadTypeState(data.loadType);
                if (data.userName) setUserName(data.userName);
                if (data.priceList) setPriceList(data.priceList);
                if (data.requote) {
                    // If requote flag was set, reset options to defaults
                    setWorkLoadLimitState(null);
                    setLoadTypeState(null);
                    setCraneTypeState('floor-mounted-crane');
                    setJibLengthState('2.5m');
                }
            }
        } catch (e) {
            console.error('Failed to load settings from localStorage:', e);
        }
    }, []);

    // Save to LocalStorage whenever key settings change
    const saveToLocalStorage = useCallback((overrides = {}) => {
        try {
            const currentObj = {
                fromBack: overrides.fromBack ?? false,
                pdfContent: overrides.pdfContent ?? pdfContent,
                outputFile: overrides.outputFile ?? null,
                loadType: overrides.loadType ?? loadType,
                craneType: overrides.craneType ?? craneType,
                jibLength: overrides.jibLength ?? jibLength,
                workLoadLimit: overrides.workLoadLimit ?? workLoadLimit,
                userName: overrides.userName ?? userName,
                selectedUnit: overrides.unit ?? unit,
                priceList: overrides.priceList ?? priceList,
                requote: overrides.requote ?? false
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentObj));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }, [pdfContent, loadType, craneType, jibLength, workLoadLimit, userName, unit, priceList]);

    // Handle Crane type change
    const setCraneType = useCallback((newType) => {
        setCraneTypeState(newType);
        setJibLengthState((prevJib) => validateJibForCrane(newType, prevJib));
    }, []);

    const setJibLength = useCallback((newJib) => {
        setJibLengthState(newJib);
    }, []);

    const setWorkLoadLimit = useCallback((newWll) => {
        setWorkLoadLimitState(newWll);
    }, []);

    const setLoadType = useCallback((newLoadType) => {
        setLoadTypeState(newLoadType);
    }, []);

    const setUnit = useCallback((newUnit) => {
        setUnitState(newUnit);
    }, []);

    // Requote action
    const requote = useCallback(() => {
        setWorkLoadLimitState(null);
        setLoadTypeState(null);
        setCraneTypeState('floor-mounted-crane');
        setJibLengthState('2.5m');
        setCurrentPage('configurator');
        saveToLocalStorage({
            workLoadLimit: null,
            loadType: null,
            craneType: 'floor-mounted-crane',
            jibLength: '2.5m',
            requote: false
        });
    }, [saveToLocalStorage]);

    // Quote button action
    const quote = useCallback(() => {
        if (!craneType || !jibLength || !workLoadLimit || !loadType) {
            alert("Please select all items before continuing.");
            return false;
        }
        saveToLocalStorage({ requote: false });
        setCurrentPage('specification');
        return true;
    }, [craneType, jibLength, workLoadLimit, loadType, saveToLocalStorage]);

    // Back button from specification
    const backToConfigurator = useCallback(() => {
        saveToLocalStorage({ fromBack: true });
        setCurrentPage('configurator');
    }, [saveToLocalStorage]);

    // Login API action
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
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            });

            const response = await res.json();
            if (response && response.user && response.user.name) {
                setPriceList(response.price);
                setUserName(response.user.name);
                saveToLocalStorage({
                    userName: response.user.name,
                    priceList: response.price,
                    fromBack: true
                });
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

    // Logout action
    const logout = useCallback(() => {
        setUserName(null);
        saveToLocalStorage({ userName: null });
    }, [saveToLocalStorage]);

    // Calculated 3D configuration
    const config3D = useMemo(() => {
        return get3DConfiguration(craneType, jibLength, workLoadLimit, loadType, unit);
    }, [craneType, jibLength, workLoadLimit, loadType, unit]);

    // Calculated price
    const totalPrice = useMemo(() => {
        if (!userName || !priceList) return null;
        return calculateTotalPrice(
            priceList,
            workLoadLimit,
            config3D.crane,
            config3D.headStack,
            config3D.suctionPack,
            unit
        );
    }, [userName, priceList, workLoadLimit, config3D, unit]);

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
        loadType,
        setLoadType,
        userName,
        priceList,
        totalPrice,
        currentWorkload,
        config3D,
        pdfContent,
        setPdfContent,
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
