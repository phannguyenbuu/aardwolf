import React, { useState } from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';
import { generateQuotationPDF } from '../utils/pdfGenerator.js';

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
        setIs3DLoading,
        setLoadingProgress
    } = useConfigurator();

    const [isDownloading, setIsDownloading] = useState(false);

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
        <div className="container">
            <div className="row content py-2">
                <div className="col-lg-6 col-md-12 col-12 content__left">
                    <a
                        className="back backcontent d-inline-flex align-items-center mb-3"
                        href="#back"
                        onClick={(e) => { e.preventDefault(); backToConfigurator(); }}
                    >
                        <img src="/assets/images/back.png" alt="back" className="mr-1" style={{ width: 8 }} />
                        <span>Back</span>
                    </a>

                    <div className="content__left--title">
                        <p className="m-0">ORDER SPECIFICATION</p>
                    </div>

                    <div className="content__left--content">
                        <div className="row content__left--content--item m-0">
                            <div className="col-lg-6 col-md-6 col-6 content__left--content--item-1">
                                Maximum lifting capacity
                            </div>
                            <div className="col-lg-6 col-md-6 col-6 content__left--content--item-2 d-flex align-items-center">
                                <span id="maxLiftingCapacity">
                                    {currentWorkload?.maxLiftingCapacity || '150kg'}
                                </span>
                            </div>
                        </div>

                        <div className="row content__left--content--item m-0">
                            <div className="col-lg-6 col-md-6 col-6 content__left--content--item-1">
                                Lift tube size
                            </div>
                            <div className="col-lg-6 col-md-6 col-6 content__left--content--item-2 d-flex align-items-center">
                                <img src="/assets/images/icon-1.png" alt="icon" className="mr-1" />
                                <span id="liftTubeSize">
                                    {currentWorkload?.liftTubeSize || '100-200'}
                                </span>
                            </div>
                        </div>

                        <div className="row content__left--content--item m-0">
                            <div className="col-lg-6 col-md-6 col-6 content__left--content--item-1">
                                Electrical vacuum pump
                            </div>
                            <div className="col-lg-6 col-md-6 col-6 content__left--content--item-2 d-flex align-items-center">
                                <span id="liftTubePower">
                                    {currentWorkload?.liftTubePower || '380-480V'}
                                </span>
                            </div>
                        </div>

                        <div className="row content__left--content--item m-0">
                            <div className="col-lg-12 col-md-12 col-12 content__left--content--item-3">
                                Vertical movement (Stroke)
                            </div>
                        </div>

                        <div className="row content__left--content--item m-0">
                            <div className="col-lg-6 col-md-6 col-6 content__left--content--item-1">
                                2.5m lift tube (standard)
                            </div>
                            <div className="col-lg-6 col-md-6 col-6 content__left--content--item-2 d-flex align-items-center">
                                <span id="liftTube17">
                                    {currentWorkload?.liftTube17 || '1.7m'}
                                </span>
                            </div>
                        </div>

                        <div className="row content__left--content--item m-0">
                            <div className="col-lg-6 col-md-6 col-6 content__left--content--item-1">
                                Installation height
                            </div>
                            <div className="col-lg-6 col-md-6 col-6 content__left--content--item-2 d-flex align-items-center">
                                <span id="liftTube29">
                                    {currentWorkload?.liftTube29 || '2.9m'}
                                </span>
                            </div>
                        </div>

                        <div className="row content__left--content--item m-0">
                            <div className="col-lg-6 col-md-6 col-6 content__left--content--item-1">
                                Safety factor
                            </div>
                            <div className="col-lg-6 col-md-6 col-6 content__left--content--item-2 d-flex align-items-center">
                                <span>2.5 minimum</span>
                            </div>
                        </div>
                    </div>

                    <div className="content__left--price text-center py-4">
                        <span>Price: </span>
                        <span id="totalPrice" className="ml-1">
                            {userName ? (totalPrice || 'Calculating...') : 'Login for price'}
                        </span>
                    </div>

                    <div className="content__left-price--action text-center">
                        <a
                            className="requote"
                            href="#requote"
                            onClick={(e) => { e.preventDefault(); requote(); }}
                        >
                            Requote
                        </a>
                        <a
                            className="back backcontent"
                            href="#back"
                            onClick={(e) => { e.preventDefault(); backToConfigurator(); }}
                        >
                            Back
                        </a>
                        <a
                            href="#download"
                            id="download"
                            onClick={(e) => { e.preventDefault(); handleDownloadPDF(); }}
                        >
                            {isDownloading ? 'Generating PDF...' : 'Download & Print quotation'}
                        </a>
                    </div>

                    <div className="content__left-price-des pt-4">
                        <p>
                            © Copyright 2015. Aardwolf Industries LLC. All Rights Reserved. Equipment Suppliers to the Stone, Glass and Construction Industries{' '}
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
