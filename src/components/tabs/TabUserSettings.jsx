import React, { useEffect, useRef } from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext.jsx';
import { RULES, PRODUCT_CATALOG, kgToLbs, mmToInch, inchToMm } from '../../constants/data.js';
import { isJibDisabled, isWllAllowed } from '../../utils/configuratorHelpers.js';
import { LOAD_MATERIALS, LOAD_TYPES, STEP_ORDER, effectiveLoadType, materialEligibility, selectionEligibility } from '../../utils/selectionRules.js';
import { craneImages, handleImages, padImage } from '../../constants/selectionImages.js';
import SelectionCard from '../user-settings/SelectionCard.jsx';
import StepSection from '../user-settings/StepSection.jsx';
import UnitSelector from '../UnitSelector.jsx';

export default function TabUserSettings() {
    const {
        unit, craneType, setCraneType, jibLength, setJibLength,
        workLoadLimit, setWorkLoadLimit, environment, setEnvironment,
        surfaceType, setSurfaceType, actualLoad, updateActualLoad,
        handleId, setHandleId, suctionHeadId, setSuctionHeadId,
        chosenSteps, markStepChosen, configurationValidation, quote, requote,
    } = useConfigurator();
    const contentRef = useRef(null);
    const actionBarRef = useRef(null);
    const imperial = unit === 'Inch';
    const wll = RULES.wllLevels.find(item => item.id === workLoadLimit);
    const loadType = effectiveLoadType(environment, surfaceType);
    const picked = (step, matches) => chosenSteps.has(step) && matches;
    const unlocked = step => STEP_ORDER.slice(0, STEP_ORDER.indexOf(step)).every(key => chosenSteps.has(key));
    const choose = (step, apply) => { apply(); markStepChosen(step); };
    const materialReady = chosenSteps.has('environment') && chosenSteps.has('wll');
    const canQuote = configurationValidation.valid;

    useEffect(() => {
        const bar = actionBarRef.current;
        const column = contentRef.current?.closest('.content__left');
        if (!column || !bar) return;
        const align = () => {
            const rect = column.getBoundingClientRect();
            const style = getComputedStyle(column);
            const left = rect.left + parseFloat(style.paddingLeft);
            const right = window.innerWidth <= 768 ? rect.right - parseFloat(style.paddingRight) : Math.min(rect.right - parseFloat(style.paddingRight), window.innerWidth * .49);
            bar.style.setProperty('--action-left', `${left}px`);
            bar.style.setProperty('--action-width', `${Math.max(0, right - left)}px`);
        };
        align();
        const observer = new ResizeObserver(align);
        observer.observe(column);
        window.addEventListener('resize', align);
        return () => { observer.disconnect(); window.removeEventListener('resize', align); };
    }, [canQuote]);

    const eligibility = head => selectionEligibility(head, { surfaceType, environment: loadType, actualLoad, capacityKg: wll?.capacityKg });
    const hasLoadType = type => LOAD_MATERIALS.some(material => materialEligibility(RULES.suctionHeads, material.id, type, actualLoad, wll?.capacityKg));
    // Stable partition: preserve catalog order within available/disabled groups.
    const availableFirst = (items, enabled) => [...items].sort((a, b) => Number(enabled(b)) - Number(enabled(a)));
    const updateDimension = (field, value) => {
        const number = value === '' ? 0 : Number(value);
        if (!Number.isFinite(number)) return;
        const metric = imperial ? field === 'weight' ? number / 2.2046226218 : inchToMm(number) : number;
        updateActualLoad({ [field]: Math.max(0, metric) });
    };
    const weightLimit = imperial ? Math.floor(wll.capacityKg * 2.2046226218 * 10) / 10 : wll.capacityKg;
    const weightMinimum = imperial ? 2.2 : 1;

    return <div ref={contentRef} className="tab-pane-content tab-user-settings">
        <div className="user-setting-units"><UnitSelector /></div>
        <div className="content__left-list">
            <StepSection title="What crane type do you require?" open>
                <div className="selection-grid">
                    {RULES.cranes.map(crane => <SelectionCard key={crane.id} name="craneType" value={crane.id}
                        label={crane.name} image={craneImages[crane.id]} checked={craneType === crane.id}
                        onChange={() => choose('crane', () => setCraneType(crane.id))} />)}
                </div>
            </StepSection>
            <StepSection title="What jib length do you require?">
                <div className="selection-grid head-selection-grid">
                    {availableFirst(RULES.jibs, jib => unlocked('jib') && !isJibDisabled(craneType, jib.id)).map(jib => {
                        const disabled = !unlocked('jib') || isJibDisabled(craneType, jib.id);
                        return <SelectionCard key={jib.id} name="jibLength" value={jib.id}
                            label={imperial ? `${+(jib.lengthM * 1000 / 25.4).toFixed(1)} inch${jib.id === '2.5m' ? ' · Articulated' : ''}` : `${jib.lengthM * 1000} mm${jib.id === '2.5m' ? ' · Articulated' : ''}`}
                            image={`/assets/configurator/${jib.id === '2.5m' ? 'jib-articulated' : 'jib-straight'}.png`}
                            checked={picked('jib', jibLength === jib.id)} disabled={disabled}
                            reason={disabled ? 'Not available for this crane' : undefined}
                            onChange={() => choose('jib', () => setJibLength(jib.id))} />;
                    })}
                </div>
            </StepSection>
            <StepSection title="What work load limit (WLL) do you require?">
                <div className="content__left-list-answer wll-options-grid">
                    {availableFirst(RULES.wllLevels, level => unlocked('wll') && isWllAllowed(craneType, jibLength, level.id)).map(level => <div key={level.id} className="content__left-list-answer--item">
                        <input type="radio" id={`wll-${level.id}`} name="workLoadLimit" value={level.id}
                            checked={picked('wll', workLoadLimit === level.id)}
                            disabled={!unlocked('wll') || !isWllAllowed(craneType, jibLength, level.id)}
                            onChange={() => choose('wll', () => setWorkLoadLimit(level.id))} />
                        <label htmlFor={`wll-${level.id}`}>WLL {imperial ? kgToLbs(level.capacityKg) : level.capacityKg} {imperial ? 'lbs' : 'kg'}</label>
                    </div>)}
                </div>
            </StepSection>
            <StepSection title="What type of load are you lifting?">
                <div className="load-type-options">
                    {availableFirst(LOAD_TYPES, type => unlocked('environment') && hasLoadType(type.id)).map(type => <label key={type.id}>
                        <input type="radio" name="load-type" value={type.id}
                            checked={picked('environment', loadType === type.id)}
                            disabled={!unlocked('environment') || !hasLoadType(type.id)}
                            onChange={() => choose('environment', () => setEnvironment(type.id))} />{type.name}
                    </label>)}
                </div>
                <strong className="selection-subtitle">Material</strong>
                <div className="selection-grid" role="group" aria-label="Material">
                    {availableFirst(LOAD_MATERIALS, material => materialReady && materialEligibility(RULES.suctionHeads, material.id, loadType, actualLoad, wll?.capacityKg)).map(material => {
                        const available = materialEligibility(RULES.suctionHeads, material.id, loadType, actualLoad, wll?.capacityKg);
                        return <SelectionCard key={material.id} name="workpiece-surface" value={material.id} label={material.name}
                            image={`/assets/configurator/${material.image}`} checked={picked('surface', surfaceType === material.id)}
                            disabled={!materialReady || !available} reason={materialReady && !available ? 'No compatible tooling for this load and size' : undefined}
                            onChange={() => choose('surface', () => setSurfaceType(material.id))} />;
                    })}
                </div>
                <strong className="selection-subtitle">Dimension</strong>
                <div className="workpiece-dimensions-row">
                    {['weight', 'length', 'width'].map(field => {
                        const value = imperial ? field === 'weight' ? +(actualLoad[field] * 2.2046226218).toFixed(1) : +mmToInch(actualLoad[field]).toFixed(1) : actualLoad[field];
                        const suffix = field === 'weight' ? imperial ? 'lbs' : 'kg' : imperial ? 'inch' : 'mm';
                        return <label key={field}>{field[0].toUpperCase() + field.slice(1)} ({suffix})
                            <input type="number" aria-label={field[0].toUpperCase() + field.slice(1)} className="form-control form-control-sm"
                                disabled={!chosenSteps.has('wll')} min={field === 'weight' ? weightMinimum : 0} step="any"
                                max={field === 'weight' ? weightLimit : undefined} value={value || ''}
                                onChange={event => updateDimension(field, event.target.value)}
                                onBlur={() => { if (field === 'weight') updateActualLoad({ weight: Math.max(1, Math.min(actualLoad.weight || 1, wll.capacityKg)) }); }} />
                            {field === 'weight' && <small className="dimension-hint">{weightMinimum} {suffix} – {weightLimit} {suffix}</small>}
                        </label>;
                    })}
                </div>
                {actualLoad.weight > wll.capacityKg && <p role="alert">Weight must not exceed the selected WLL.</p>}
            </StepSection>
            <StepSection title="What type of head do you require?">
                <strong className="selection-subtitle">Handle Control You Want</strong>
                <div className="selection-grid head-selection-grid">
                    {availableFirst(PRODUCT_CATALOG.handles, handle => unlocked('handle') && wll.allowedHandles.includes(handle.key)).map(handle => {
                        const fits = wll.allowedHandles.includes(handle.key);
                        return <SelectionCard key={handle.key} name="handle-control" value={handle.key} label={handle.label}
                            image={handleImages[handle.key]} checked={picked('handle', handleId === handle.key)}
                            disabled={!unlocked('handle') || !fits} reason={!fits ? 'Not compatible with selected WLL' : undefined}
                            onChange={() => choose('handle', () => setHandleId(handle.key))} />;
                    })}
                </div>
                <strong className="selection-subtitle">Suction Head You Want</strong>
                <div className="selection-grid pad-selection-grid">
                    {availableFirst(RULES.suctionHeads, head => unlocked('suction') && eligibility(head).eligible).map(head => {
                        const result = eligibility(head);
                        return <SelectionCard key={head.id} name="suction-head" value={head.id} label={head.name}
                            image={padImage(head.id)} checked={picked('suction', suctionHeadId === head.id)}
                            disabled={!unlocked('suction') || !result.eligible} reason={result.reasons.join(' · ')}
                            onChange={() => choose('suction', () => setSuctionHeadId(head.id))} />;
                    })}
                </div>
            </StepSection>
        </div>
        <div ref={actionBarRef} className="content__action user-setting-actions">
            <div className="user-quote-buttons">{canQuote && <>
                <button type="button" className="content__action--requote" onClick={requote}>Requote</button>
                <button type="button" id="quoteButton" className="content__action--quote" onClick={quote}>Quote</button>
            </>}</div>
        </div>
    </div>;
}
