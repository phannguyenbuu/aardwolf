import React, { useState } from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';
import { generateQuotationPDF } from '../utils/pdfGenerator.js';
import { RULES, kgToLbs } from '../constants/data.js';

export default function SpecificationPage() {
    const {
        currentWorkload,
        totalPrice,
        userName,
        requote,
        backToConfigurator,
        config3D,
        pdfContent,
        unit,
        craneType,
        jibLength,
        workLoadLimit,
        environment,
        surfaceType,
        actualLoad,
        suctionHeadId,
        customNotes,
        canvasSnapshot,
        setIs3DLoading,
        setLoadingProgress
    } = useConfigurator();

    const [isDownloading, setIsDownloading] = useState(false);

    const craneObj = RULES.cranes.find(c => c.id === craneType);
    const surfaceObj = RULES.surfaceTypes.find(s => s.id === surfaceType);
    const headObj = RULES.suctionHeads.find(h => h.id === suctionHeadId);

    const handleDownloadPDF = async () => {
        if (!currentWorkload || isDownloading) return;
        setIsDownloading(true);
        setIs3DLoading(true);

        try {
            await generateQuotationPDF({
                sceneData: config3D.crane,
                pdfContent: pdfContent,
                currentWorkload,
                userName,
                totalPrice,
                outputFileName: config3D.outputFile,
                selectedUnit: unit,
                zoomft: config3D.zoomft,
                actualLoad,
                surfaceType: surfaceObj?.name,
                environment: environment === 'dusty' ? 'Dusty / Industrial' : 'Standard / Clean',
                canvasSnapshot,
                onProgress: (p) => setLoadingProgress(p)
            });
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsDownloading(false);
            setIs3DLoading(false);
        }
    };

    return (
        <div className="container pb-5">
            <div className="row content py-2">
                <div className="col-lg-6 col-md-12 col-12 content__left">
                    <a
                        className="back backcontent d-inline-flex align-items-center mb-3"
                        href="#back"
                        onClick={(e) => { e.preventDefault(); backToConfigurator(); }}
                    >
                        <img src="/assets/images/back.png" alt="back" className="mr-1" style={{ width: 8 }} />
                        <span>Back to Configurator</span>
                    </a>

                    <div className="content__left--title d-flex justify-content-between align-items-center">
                        <p className="m-0 font-weight-bold">ORDER SPECIFICATION (5-STEP SUMMARY)</p>
                        <span className="badge badge-primary">{unit.toUpperCase()} UNIT</span>
                    </div>

                    {/* Summary cards of configured 5 steps */}
                    <div className="card mb-3 shadow-sm border-0 bg-white">
                        <div className="card-body p-3">
                            <h6 className="font-weight-bold text-danger mb-2">Configured Equipment Summary:</h6>
                            <ul className="list-unstyled mb-0" style={{ fontSize: 13, lineHeight: '1.8' }}>
                                <li><strong>1. Crane Type:</strong> {craneObj?.name} (Reach: {jibLength})</li>
                                <li><strong>2. Rated WLL:</strong> {currentWorkload?.maxLiftingCapacity}</li>
                                <li><strong>3. Environment:</strong> {environment === 'dusty' ? 'Heavy Industrial / Dusty (Requires ZFP300 Filter)' : 'Standard / Clean'}</li>
                                <li><strong>4. Workpiece Surface:</strong> {surfaceObj?.name} {customNotes && `(${customNotes})`}</li>
                                <li><strong>5. Actual Dimensions:</strong> {actualLoad.length} × {actualLoad.width} × {actualLoad.height} mm (Actual Load: {actualLoad.weight} kg / {kgToLbs(actualLoad.weight)} lbs)</li>
                                <li><strong>6. Recommended Suction Head:</strong> {headObj?.name} (Max Rated: {headObj?.maxKg} kg)</li>
                            </ul>
                        </div>
                    </div>

                    {/* Technical details table */}
                    <div className="content__left--content mb-3">
                        <div className="row content__left--content--item m-0">
                            <div className="col-6 content__left--content--item-1">
                                Maximum lifting capacity (WLL)
                            </div>
                            <div className="col-6 content__left--content--item-2 d-flex align-items-center">
                                <span className="font-weight-bold text-danger">{currentWorkload?.maxLiftingCapacity}</span>
                            </div>
                        </div>

                        <div className="row content__left--content--item m-0">
                            <div className="col-6 content__left--content--item-1">
                                Lift tube size (Diameter)
                            </div>
                            <div className="col-6 content__left--content--item-2 d-flex align-items-center">
                                <img src="/assets/images/icon-1.png" alt="icon" className="mr-1" />
                                <span>{currentWorkload?.liftTubeSize}</span>
                            </div>
                        </div>

                        <div className="row content__left--content--item m-0">
                            <div className="col-6 content__left--content--item-1">
                                Electrical vacuum pump (Motor)
                            </div>
                            <div className="col-6 content__left--content--item-2 d-flex align-items-center">
                                <span>{currentWorkload?.liftTubePower}</span>
                            </div>
                        </div>

                        <div className="row content__left--content--item m-0">
                            <div className="col-12 content__left--content--item-3 bg-light">
                                Vertical movement (Stroke)
                            </div>
                        </div>

                        <div className="row content__left--content--item m-0">
                            <div className="col-6 content__left--content--item-1">
                                Standard stroke (2.5m lift tube)
                            </div>
                            <div className="col-6 content__left--content--item-2 d-flex align-items-center">
                                <span>{currentWorkload?.liftTube17 || '1.7m'}</span>
                            </div>
                        </div>

                        <div className="row content__left--content--item m-0">
                            <div className="col-6 content__left--content--item-1">
                                Installation height
                            </div>
                            <div className="col-6 content__left--content--item-2 d-flex align-items-center">
                                <span>{currentWorkload?.liftTube29 || '2.9m'}</span>
                            </div>
                        </div>

                        <div className="row content__left--content--item m-0">
                            <div className="col-6 content__left--content--item-1">
                                Safety factor
                            </div>
                            <div className="col-6 content__left--content--item-2 d-flex align-items-center">
                                <span className="font-weight-bold">2.5 minimum (CE Standard)</span>
                            </div>
                        </div>
                    </div>

                    {/* 3D Snapshot thumbnail preview if available */}
                    {canvasSnapshot && (
                        <div className="card mb-3 p-2 bg-white text-center">
                            <small className="text-muted d-block mb-1">3D visual configuration snapshot:</small>
                            <img
                                src={canvasSnapshot}
                                alt="3D Snapshot"
                                style={{ maxHeight: 140, objectFit: 'contain', borderRadius: 4 }}
                            />
                        </div>
                    )}

                    <div className="content__left--price text-center py-3 bg-white rounded shadow-sm mb-3">
                        <span className="h5 mb-0 mr-2">Estimated Quotation Price:</span>
                        <span id="totalPrice" className="h4 text-danger font-weight-bold mb-0">
                            {userName ? (totalPrice || 'Calculating...') : 'Login for price'}
                        </span>
                    </div>

                    <div className="content__left-price--action text-center">
                        <a
                            className="requote mr-2"
                            href="#requote"
                            onClick={(e) => { e.preventDefault(); requote(); }}
                        >
                            Requote
                        </a>
                        <a
                            className="back backcontent mr-2"
                            href="#back"
                            onClick={(e) => { e.preventDefault(); backToConfigurator(); }}
                        >
                            Back
                        </a>
                        <a
                            href="#download"
                            id="download"
                            className="btn btn-danger font-weight-bold"
                            onClick={(e) => { e.preventDefault(); handleDownloadPDF(); }}
                        >
                            {isDownloading ? 'Generating PDF...' : '📄 Download & Print Quotation PDF'}
                        </a>
                    </div>

                    <div className="content__left-price-des pt-4">
                        <p className="text-muted" style={{ fontSize: 12 }}>
                            © Copyright 2015-2026. Aardwolf Industries LLC. All Rights Reserved. Equipment Suppliers to the Stone, Glass and Construction Industries{' '}
                            <a
                                target="_blank"
                                rel="noreferrer"
                                href="https://www.aardwolf.com.au/"
                                style={{ color: '#CC2200', textDecoration: 'underline' }}
                            >
                                www.aardwolf.com.au
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
