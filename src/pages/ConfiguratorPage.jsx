import React from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';
import UnitSelector from '../components/UnitSelector.jsx';
import { RULES, kgToLbs, lbsToKg, mmToInch, inchToMm } from '../constants/data.js';
import { isJibDisabled, getCraneConfig } from '../utils/configuratorHelpers.js';

export default function ConfiguratorPage() {
    const {
        unit,
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
        requote,
        quote
    } = useConfigurator();

    const craneConfig = getCraneConfig(craneType);

    // Jib labels
    const jibLabels = {
        '2.5m': unit === 'Inch' ? `8'2" (articulated jib crane)` : '2.5 m (articulated jib crane)',
        '3m': unit === 'Inch' ? `9'10"` : '3 m',
        '4m': unit === 'Inch' ? `13'1"` : '4 m',
        '5m': unit === 'Inch' ? `16'5"` : '5 m'
    };

    // Dimension unit labels
    const lengthUnit = unit === 'Inch' ? 'in' : 'mm';
    const weightUnit = unit === 'Inch' ? 'lbs' : 'kg';

    // Handle dimension changes with unit conversion
    const handleWeightChange = (val) => {
        const num = parseFloat(val) || 0;
        const weightKg = unit === 'Inch' ? parseFloat(lbsToKg(num)) : num;
        updateActualLoad({ weight: Math.max(0, weightKg) });
    };

    const handleLengthChange = (val) => {
        const num = parseFloat(val) || 0;
        const lengthMm = unit === 'Inch' ? inchToMm(num) : num;
        updateActualLoad({ length: Math.max(0, lengthMm) });
    };

    const handleWidthChange = (val) => {
        const num = parseFloat(val) || 0;
        const widthMm = unit === 'Inch' ? inchToMm(num) : num;
        updateActualLoad({ width: Math.max(0, widthMm) });
    };

    const handleHeightChange = (val) => {
        const num = parseFloat(val) || 0;
        const heightMm = unit === 'Inch' ? inchToMm(num) : num;
        updateActualLoad({ height: Math.max(0, heightMm) });
    };

    const displayWeight = unit === 'Inch' ? kgToLbs(actualLoad.weight) : actualLoad.weight;
    const displayLength = unit === 'Inch' ? Math.round(mmToInch(actualLoad.length)) : actualLoad.length;
    const displayWidth = unit === 'Inch' ? Math.round(mmToInch(actualLoad.width)) : actualLoad.width;
    const displayHeight = unit === 'Inch' ? Math.round(mmToInch(actualLoad.height)) : actualLoad.height;

    return (
        <div className="container pb-5">
            <UnitSelector />

            <div className="row content py-2">
                <div className="col-lg-6 col-md-12 col-12 content__left">
                    <div className="content__left-list">

                        {/* STEP 1: CRANE TYPE */}
                        <div className="content__left-list--item mb-4">
                            <p className="step-title">
                                <span className="step-badge">1</span> What crane type do you require?
                            </p>
                            <div className="row content__left-list-answer">
                                {RULES.cranes.map((c) => (
                                    <div key={c.id} className="col-lg-12 col-12 content__left-list-answer--item mb-1">
                                        <input
                                            type="radio"
                                            name="craneType"
                                            id={c.id}
                                            checked={craneType === c.id}
                                            onChange={() => setCraneType(c.id)}
                                        />
                                        <label htmlFor={c.id} className="d-flex flex-column ml-2">
                                            <span className="font-weight-bold">{c.name}</span>
                                            <small className="text-muted">{c.description}</small>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* STEP 2: JIB LENGTH */}
                        <div className="content__left-list--item mb-4">
                            <p className="step-title">
                                <span className="step-badge">2</span> What jib length do you require?
                            </p>
                            <div className="row content__left-list-answer">
                                {RULES.jibs.map((j) => {
                                    const disabled = isJibDisabled(craneType, j.id);
                                    return (
                                        <div
                                            key={j.id}
                                            className="col-lg-6 col-md-6 col-12 content__left-list-answer--item position-relative"
                                            title={disabled ? (craneConfig.disabledJibsTooltip || 'Option unavailable') : ''}
                                        >
                                            <input
                                                type="radio"
                                                name="jibLength"
                                                id={j.id}
                                                checked={jibLength === j.id}
                                                disabled={disabled}
                                                onChange={() => setJibLength(j.id)}
                                            />
                                            <label htmlFor={j.id} className="jib-label ml-1">
                                                {jibLabels[j.id]}
                                            </label>
                                            {disabled && (
                                                <span className="badge badge-secondary ml-1" style={{ fontSize: 10 }}>Locked</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* STEP 3: WORK LOAD LIMIT (9 LEVELS) */}
                        <div className="content__left-list--item mb-4">
                            <p className="step-title">
                                <span className="step-badge">3</span> What work load limit (WLL) do you require?
                            </p>
                            <div className="row content__left-list-answer">
                                {RULES.wllLevels.map((wll) => {
                                    const wllText = unit === 'Inch'
                                        ? `${kgToLbs(wll.capacityKg)} lbs`
                                        : `${wll.capacityKg} kgs`;
                                    return (
                                        <div key={wll.id} className="col-lg-4 col-md-4 col-6 content__left-list-answer--item py-1">
                                            <input
                                                type="radio"
                                                name="workLoadLimit"
                                                id={wll.id}
                                                checked={workLoadLimit === wll.id}
                                                onChange={() => setWorkLoadLimit(wll.id)}
                                            />
                                            <label htmlFor={wll.id} className="ml-1 font-weight-bold">
                                                WLL {wllText}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* STEP 4: ENVIRONMENT & WORKPIECE SURFACE */}
                        <div className="content__left-list--item mb-4">
                            <p className="step-title">
                                <span className="step-badge">4</span> Operating environment & workpiece surface
                            </p>
                            
                            {/* Environment */}
                            <div className="mb-2">
                                <span className="font-weight-bold" style={{ fontSize: 13 }}>Working Environment:</span>
                                <div className="d-flex flex-wrap mt-1">
                                    {RULES.environments.map(env => (
                                        <div key={env.id} className="mr-3 d-flex align-items-center">
                                            <input
                                                type="radio"
                                                name="environment"
                                                id={env.id}
                                                checked={environment === env.id}
                                                onChange={() => setEnvironment(env.id)}
                                            />
                                            <label htmlFor={env.id} className="ml-1 mb-0" style={{ cursor: 'pointer', fontSize: 13 }}>
                                                {env.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Surface Types */}
                            <div className="row content__left-list-answer mt-2">
                                {RULES.surfaceTypes.map(surf => (
                                    <div key={surf.id} className="col-lg-6 col-12 content__left-list-answer--item py-1">
                                        <input
                                            type="radio"
                                            name="surfaceType"
                                            id={surf.id}
                                            checked={surfaceType === surf.id}
                                            onChange={() => setSurfaceType(surf.id)}
                                        />
                                        <label htmlFor={surf.id} className="ml-1 font-weight-bold" style={{ fontSize: 13 }}>
                                            {surf.name}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {/* Custom notes */}
                            <div className="mt-2">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Additional workpiece notes (e.g., surface porosity, temperature, special shape...)"
                                    value={customNotes}
                                    onChange={(e) => setCustomNotes(e.target.value)}
                                    style={{ fontSize: 13, background: '#fff' }}
                                />
                            </div>
                        </div>

                        {/* STEP 5: ACTUAL LOAD WEIGHT & DIMENSIONS */}
                        <div className="content__left-list--item mb-4">
                            <p className="step-title">
                                <span className="step-badge">5</span> Actual workpiece dimensions & weight
                            </p>
                            <div className="bg-white p-3 rounded" style={{ border: '1px solid #e0e0e0' }}>
                                <div className="row">
                                    <div className="col-6 col-md-3 mb-2">
                                        <label className="font-weight-bold" style={{ fontSize: 12 }}>Load Weight ({weightUnit}):</label>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm font-weight-bold text-danger"
                                            value={displayWeight}
                                            onChange={(e) => handleWeightChange(e.target.value)}
                                            min="1"
                                            step="1"
                                        />
                                    </div>
                                    <div className="col-6 col-md-3 mb-2">
                                        <label className="font-weight-bold" style={{ fontSize: 12 }}>Length ({lengthUnit}):</label>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm font-weight-bold"
                                            value={displayLength}
                                            onChange={(e) => handleLengthChange(e.target.value)}
                                            min="50"
                                            step="10"
                                        />
                                    </div>
                                    <div className="col-6 col-md-3 mb-2">
                                        <label className="font-weight-bold" style={{ fontSize: 12 }}>Width ({lengthUnit}):</label>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm font-weight-bold"
                                            value={displayWidth}
                                            onChange={(e) => handleWidthChange(e.target.value)}
                                            min="50"
                                            step="10"
                                        />
                                    </div>
                                    <div className="col-6 col-md-3 mb-2">
                                        <label className="font-weight-bold" style={{ fontSize: 12 }}>Height ({lengthUnit}):</label>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm font-weight-bold"
                                            value={displayHeight}
                                            onChange={(e) => handleHeightChange(e.target.value)}
                                            min="20"
                                            step="10"
                                        />
                                    </div>
                                </div>

                                {/* Capacity Verification Banner */}
                                {capacityStatus.status === 'OVERLOAD' && (
                                    <div className="alert alert-danger mt-2 mb-0 p-2 d-flex align-items-center justify-content-between flex-wrap" style={{ fontSize: 13 }}>
                                        <span>⚠️ <strong>Overload:</strong> {capacityStatus.message}</span>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-danger ml-auto mt-1 font-weight-bold"
                                            onClick={applySuggestedWll}
                                        >
                                            Switch to WLL {capacityStatus.suggestedCapacity} kg
                                        </button>
                                    </div>
                                )}

                                {capacityStatus.status === 'UNDERLOAD' && (
                                    <div className="alert alert-warning mt-2 mb-0 p-2 d-flex align-items-center justify-content-between flex-wrap" style={{ fontSize: 13 }}>
                                        <span>💡 <strong>Optimization:</strong> {capacityStatus.message}</span>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-warning ml-auto mt-1 font-weight-bold"
                                            onClick={applySuggestedWll}
                                        >
                                            Lower WLL to {capacityStatus.suggestedCapacity} kg
                                        </button>
                                    </div>
                                )}

                                {capacityStatus.status === 'OPTIMAL' && (
                                    <div className="alert alert-success mt-2 mb-0 p-2" style={{ fontSize: 13 }}>
                                        ✅ <strong>Safety Verified:</strong> {capacityStatus.message}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SMART SUCTION HEAD LIBRARY */}
                        <div className="content__left-list--item mb-4">
                            <p className="step-title d-flex justify-content-between align-items-center">
                                <span><span className="step-badge">★</span> Smart Suction Head Library</span>
                                <small className="text-muted">Auto-recommended by material & dimensions</small>
                            </p>

                            <div className="row">
                                {RULES.suctionHeads.map((head) => {
                                    const isSelected = suctionHeadId === head.id;
                                    const isRecommended = RULES.surfaceTypes.find(s => s.id === surfaceType)?.recommendedHead === head.id;

                                    return (
                                        <div key={head.id} className="col-lg-6 col-12 mb-2">
                                            <div
                                                className={`p-2 rounded cursor-pointer position-relative d-flex align-items-center ${
                                                    isSelected ? 'border-primary shadow-sm bg-light' : 'bg-white'
                                                }`}
                                                style={{
                                                    border: isSelected ? '2px solid #CC2200' : '1px solid #ddd',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => setSuctionHeadId(head.id)}
                                            >
                                                <img
                                                    src={head.icon}
                                                    alt={head.name}
                                                    style={{ width: 34, height: 34, objectFit: 'contain' }}
                                                    className="mr-2"
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div className="d-flex align-items-center">
                                                        <span className="font-weight-bold" style={{ fontSize: 13, color: isSelected ? '#CC2200' : '#333' }}>
                                                            {head.name}
                                                        </span>
                                                        {isRecommended && (
                                                            <span className="badge badge-success ml-2" style={{ fontSize: 9 }}>Recommended</span>
                                                        )}
                                                    </div>
                                                    <small className="text-muted d-block">
                                                        Max Capacity: {unit === 'Inch' ? `${kgToLbs(head.maxKg)} lbs` : `${head.maxKg} kg`}
                                                    </small>
                                                </div>
                                                <input
                                                    type="radio"
                                                    name="suctionHead"
                                                    checked={isSelected}
                                                    onChange={() => setSuctionHeadId(head.id)}
                                                    className="ml-2"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ACTION BUTTONS (Sticky bottom on mobile) */}
            <div className="content__action sticky-mobile-action">
                <a href="#requote" className="content__action--requote" onClick={(e) => { e.preventDefault(); requote(); }}>
                    Requote
                </a>
                <a href="#quote" id="quoteButton" className="content__action--quote" onClick={(e) => { e.preventDefault(); quote(); }}>
                    Quote
                </a>
            </div>
        </div>
    );
}
