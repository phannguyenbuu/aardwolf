import React from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';
import UnitSelector from '../components/UnitSelector.jsx';
import { isJibDisabled } from '../utils/configuratorHelpers.js';

export default function ConfiguratorPage() {
    const {
        unit,
        craneType,
        setCraneType,
        jibLength,
        setJibLength,
        workLoadLimit,
        setWorkLoadLimit,
        loadType,
        setLoadType,
        requote,
        quote
    } = useConfigurator();

    // Work Load Limit values by unit
    const wllLabels = {
        '45kg': unit === 'Inch' ? '99 lbs' : '45 kgs',
        '70kg': unit === 'Inch' ? '154 lbs' : '70 kgs',
        '80kg': unit === 'Inch' ? '176 lbs' : '80 kgs',
        '120kg': unit === 'Inch' ? '265 lbs' : '120 kgs',
        '150kg': unit === 'Inch' ? '331 lbs' : '150 kgs'
    };

    // Jib length labels
    const jibLabels = {
        '2.5m': unit === 'Inch' ? `8'2" (articulated jib crane)` : '2.5 m (articulated jib crane)',
        '3m': unit === 'Inch' ? `9'10"` : '3 m',
        '4m': unit === 'Inch' ? `13'1"` : '4 m',
        '5m': unit === 'Inch' ? `16'5"` : '5 m'
    };

    // Carton size labels for Load Type
    const cartonLabels = {
        small: unit === 'Inch' ? '12"x12"' : '300x300',
        medium: unit === 'Inch' ? '12" to 16"' : '300 to 400',
        large: unit === 'Inch' ? '16"' : '400'
    };

    const isLoadTypeDisabled = !workLoadLimit;

    return (
        <div className="container">
            <UnitSelector />

            <div className="row content py-2">
                <div className="col-lg-6 col-md-12 col-12 content__left">
                    <div className="content__left-list">
                        {/* Question 1: Crane Type */}
                        <div className="content__left-list--item">
                            <p>1. What crane type do you require?</p>
                            <div className="row content__left-list-answer">
                                <div className="col-lg-6 col-md-6 col-12 content__left-list-answer--item">
                                    <input
                                        type="radio"
                                        name="craneType"
                                        id="floor-mounted-crane"
                                        checked={craneType === 'floor-mounted-crane'}
                                        onChange={() => setCraneType('floor-mounted-crane')}
                                    />
                                    <label htmlFor="floor-mounted-crane">Floor-Mounted Crane</label>
                                </div>
                                <div className="col-lg-6 col-md-6 col-12 content__left-list-answer--item">
                                    <input
                                        type="radio"
                                        name="craneType"
                                        id="mobile-crane"
                                        checked={craneType === 'mobile-crane'}
                                        onChange={() => setCraneType('mobile-crane')}
                                    />
                                    <label htmlFor="mobile-crane">Mobile Crane</label>
                                </div>
                                <div className="col-lg-6 col-md-6 col-12 content__left-list-answer--item">
                                    <input
                                        type="radio"
                                        name="craneType"
                                        id="wall-mounted-crane"
                                        checked={craneType === 'wall-mounted-crane'}
                                        onChange={() => setCraneType('wall-mounted-crane')}
                                    />
                                    <label htmlFor="wall-mounted-crane">Wall-Mounted Crane</label>
                                </div>
                            </div>
                        </div>

                        {/* Question 2: Jib Length */}
                        <div className="content__left-list--item">
                            <p>2. What jib length do you require?</p>
                            <div className="row content__left-list-answer">
                                {['2.5m', '3m', '4m', '5m'].map((j) => {
                                    const disabled = isJibDisabled(craneType, j);
                                    return (
                                        <div key={j} className="col-lg-6 col-md-6 col-12 content__left-list-answer--item">
                                            <input
                                                type="radio"
                                                name="jibLength"
                                                id={j}
                                                checked={jibLength === j}
                                                disabled={disabled}
                                                onChange={() => setJibLength(j)}
                                            />
                                            <label htmlFor={j} className="jib-label">
                                                {jibLabels[j]}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Question 3: Work Load Limit */}
                        <div className="content__left-list--item">
                            <p>3. What work load limit do you require?</p>
                            <div className="row content__left-list-answer">
                                {['45kg', '70kg', '80kg', '120kg', '150kg'].map((wll) => (
                                    <div key={wll} className="col-lg-6 col-md-6 col-12 content__left-list-answer--item">
                                        <input
                                            type="radio"
                                            name="workLoadLimit"
                                            id={wll}
                                            checked={workLoadLimit === wll}
                                            onChange={() => setWorkLoadLimit(wll)}
                                        />
                                        <label htmlFor={wll}>
                                            WLL <span className={`workLoadLimit-${wll.replace('kg', '')}`}>{wllLabels[wll]}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Question 4: Load Type */}
                        <div className="content__left-list--item">
                            <p>4. What type of load are you lifting?</p>
                            <div className="row content__left-list-answer" id="loadTypeList">
                                <div className="col-lg-6 col-md-6 col-12 content__left-list-answer--item item-1">
                                    <input
                                        type="radio"
                                        name="loadType"
                                        id="300max"
                                        disabled={isLoadTypeDisabled}
                                        checked={loadType === '300max'}
                                        onChange={() => setLoadType('300max')}
                                    />
                                    <label htmlFor="300max">
                                        Small cartons ({cartonLabels.small} max)
                                    </label>
                                </div>
                                <div className="col-lg-6 col-md-6 col-12 content__left-list-answer--item item-3">
                                    <input
                                        type="radio"
                                        name="loadType"
                                        id="300-400medium"
                                        disabled={isLoadTypeDisabled}
                                        checked={loadType === '300-400medium'}
                                        onChange={() => setLoadType('300-400medium')}
                                    />
                                    <label htmlFor="300-400medium">
                                        Medium cartons ({cartonLabels.medium})
                                    </label>
                                </div>
                                <div className="col-lg-6 col-md-6 col-12 content__left-list-answer--item item-5">
                                    <input
                                        type="radio"
                                        name="loadType"
                                        id="400large"
                                        disabled={isLoadTypeDisabled}
                                        checked={loadType === '400large'}
                                        onChange={() => setLoadType('400large')}
                                    />
                                    <label htmlFor="400large">
                                        Large cartons (above {cartonLabels.large})
                                    </label>
                                </div>
                                <div className="col-lg-6 col-md-6 col-12 content__left-list-answer--item item-4">
                                    <input
                                        type="radio"
                                        name="loadType"
                                        id="highstack"
                                        disabled={isLoadTypeDisabled}
                                        checked={loadType === 'highstack'}
                                        onChange={() => setLoadType('highstack')}
                                    />
                                    <label htmlFor="highstack">High stack</label>
                                </div>
                                <div className="col-lg-6 col-md-6 col-12 content__left-list-answer--item item-2">
                                    <input
                                        type="radio"
                                        name="loadType"
                                        id="bags"
                                        disabled={isLoadTypeDisabled}
                                        checked={loadType === 'bags'}
                                        onChange={() => setLoadType('bags')}
                                    />
                                    <label htmlFor="bags">Bags</label>
                                </div>
                                <div className="col-lg-6 col-md-6 col-12 content__left-list-answer--item item-6">
                                    <input
                                        type="radio"
                                        name="loadType"
                                        id="sheetmaterial"
                                        disabled={isLoadTypeDisabled}
                                        checked={loadType === 'sheetmaterial'}
                                        onChange={() => setLoadType('sheetmaterial')}
                                    />
                                    <label htmlFor="sheetmaterial">Sheet material</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content__action">
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
