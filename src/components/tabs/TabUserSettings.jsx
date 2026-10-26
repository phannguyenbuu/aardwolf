import React from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext.jsx';
import { RULES, kgToLbs, lbsToKg, mmToInch, inchToMm } from '../../constants/data.js';
import { isJibDisabled, getCraneConfig } from '../../utils/configuratorHelpers.js';

export default function TabUserSettings() {
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
        <div className="tab-pane-content tab-user-settings">
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
                                        value={j.id}
                                        checked={jibLength === j.id}
                                        disabled={disabled}
                                        onChange={() => setJibLength(j.id)}
                                    />
                                    <label
                                        htmlFor={j.id}
                                        style={disabled ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                                    >
                                        {jibLabels[j.id]}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* STEP 3: WORK LOAD LIMIT (WLL) */}
                <div className="content__left-list--item mb-4">
                    <p className="step-title">
                        <span className="step-badge">3</span> What work load limit (WLL) do you require?
                    </p>
                    <div className="row content__left-list-answer">
                        {(RULES.wllLevels || []).map((w) => {
                            const label = unit === 'Inch' ? `WLL ${kgToLbs(w.capacityKg)} lbs` : `WLL ${w.capacityKg} kgs`;
                            return (
                                <div key={w.id} className="col-lg-6 col-md-6 col-12 content__left-list-answer--item">
                                    <input
                                        type="radio"
                                        name="workLoadLimit"
                                        id={w.id}
                                        value={w.id}
                                        checked={workLoadLimit === w.id}
                                        onChange={() => setWorkLoadLimit(w.id)}
                                    />
                                    <label htmlFor={w.id}>{label}</label>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* STEP 4: OPERATING ENVIRONMENT & WORKPIECE SURFACE */}
                <div className="content__left-list--item mb-4">
                    <p className="step-title">
                        <span className="step-badge">4</span> Operating environment & workpiece surface
                    </p>

                    <p className="font-weight-bold mb-2" style={{ fontSize: 13, color: '#444' }}>
                        Working Environment:
                    </p>
                    <div className="row content__left-list-answer mb-3">
                        <div className="col-lg-6 col-12 content__left-list-answer--item">
                            <input
                                type="radio"
                                name="envType"
                                id="env_clean"
                                checked={environment === 'clean'}
                                onChange={() => setEnvironment('clean')}
                            />
                            <label htmlFor="env_clean">Standard / Clean environment</label>
                        </div>
                        <div className="col-lg-6 col-12 content__left-list-answer--item">
                            <input
                                type="radio"
                                name="envType"
                                id="env_dusty"
                                checked={environment === 'dusty'}
                                onChange={() => setEnvironment('dusty')}
                            />
                            <label htmlFor="env_dusty">Dusty / Heavy industrial environment</label>
                        </div>
                    </div>

                    <p className="font-weight-bold mb-2" style={{ fontSize: 13, color: '#444' }}>
                        Workpiece Material & Surface:
                    </p>
                    <div className="row content__left-list-answer mb-3">
                        {RULES.surfaceTypes.map((s) => (
                            <div key={s.id} className="col-lg-6 col-12 content__left-list-answer--item mb-1">
                                <input
                                    type="radio"
                                    name="surfaceType"
                                    id={s.id}
                                    checked={surfaceType === s.id}
                                    onChange={() => setSurfaceType(s.id)}
                                />
                                <label htmlFor={s.id}>{s.name}</label>
                            </div>
                        ))}
                    </div>

                    <div className="form-group mb-0">
                        <label htmlFor="customNotes" style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>
                            Special material characteristics or custom requirements (optional):
                        </label>
                        <input
                            type="text"
                            id="customNotes"
                            className="form-control form-control-sm"
                            placeholder="e.g. Porous stone, wet surface, high temperature..."
                            value={customNotes}
                            onChange={(e) => setCustomNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* STEP 5: ACTUAL LOAD & WORKPIECE DIMENSIONS */}
                <div className="content__left-list--item mb-4">
                    <p className="step-title">
                        <span className="step-badge">5</span> Actual load & workpiece dimensions
                    </p>
                    <div className="row">
                        <div className="col-lg-6 col-12 mb-2">
                            <label style={{ fontSize: 12, fontWeight: 600 }}>Weight ({weightUnit}):</label>
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                value={displayWeight}
                                min="0"
                                max="1000"
                                onChange={(e) => handleWeightChange(e.target.value)}
                            />
                        </div>
                        <div className="col-lg-6 col-12 mb-2">
                            <label style={{ fontSize: 12, fontWeight: 600 }}>Length ({lengthUnit}):</label>
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                value={displayLength}
                                min="50"
                                max="5000"
                                onChange={(e) => handleLengthChange(e.target.value)}
                            />
                        </div>
                        <div className="col-lg-6 col-12 mb-2">
                            <label style={{ fontSize: 12, fontWeight: 600 }}>Width ({lengthUnit}):</label>
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                value={displayWidth}
                                min="50"
                                max="3000"
                                onChange={(e) => handleWidthChange(e.target.value)}
                            />
                        </div>
                        <div className="col-lg-6 col-12 mb-2">
                            <label style={{ fontSize: 12, fontWeight: 600 }}>Height / Thickness ({lengthUnit}):</label>
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                value={displayHeight}
                                min="10"
                                max="2000"
                                onChange={(e) => handleHeightChange(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Capacity Overload / Safety Warning */}
                    <div className="mt-2">
                        {capacityStatus.status === 'OVERLOAD' && (
                            <div className="alert alert-danger mt-2 mb-0 p-2" style={{ fontSize: 13 }}>
                                ⚠️ <strong>Capacity Warning:</strong> {capacityStatus.message}
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger ml-auto mt-1 font-weight-bold"
                                    onClick={applySuggestedWll}
                                >
                                    Auto-Upgrade to {capacityStatus.suggestedCapacity} kg
                                </button>
                            </div>
                        )}

                        {capacityStatus.status === 'OVER_SPECIFIED' && (
                            <div className="alert alert-warning mt-2 mb-0 p-2" style={{ fontSize: 13 }}>
                                💡 <strong>Cost Optimization Tip:</strong> {capacityStatus.message}
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

            {/* ACTION BUTTONS */}
            <div className="content__action sticky-mobile-action mt-3">
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
