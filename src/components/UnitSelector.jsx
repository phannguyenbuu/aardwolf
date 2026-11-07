import React from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';

export default function UnitSelector() {
    const { unit, setUnit } = useConfigurator();

    return (
        <div className="column-unit-selector">
            <label htmlFor="unitSelect" className="content__left-unit--text">Unit:</label>
            <select aria-label="Unit"
                className="content__left-unit--option"
                id="unitSelect"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
            >
                <option value="mm">mm/kg</option>
                <option value="Inch">inch/lbs</option>
            </select>
        </div>
    );
}
