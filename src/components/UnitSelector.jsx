import React from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';

export default function UnitSelector() {
    const { unit, setUnit } = useConfigurator();

    return (
        <div className="py-4">
            <span className="content__left-unit--text pr-2">Unit:</span>
            <select
                className="content__left-unit--option"
                id="unitSelect"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
            >
                <option value="m">m</option>
                <option value="Inch">Inch</option>
            </select>
        </div>
    );
}
