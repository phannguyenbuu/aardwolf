import { PRODUCT_CATALOG, RULES } from '../constants/data.js';

export function buildQuotationBom({ workLoadLimit, config3D, environment, priceList }) {
    const wll = RULES.wllLevels.find(item => item.id === workLoadLimit);
    if (!wll) return { lines: [], complete: false, total: null, missing: ['WLL'] };
    const filter = environment === 'dusty' ? 'zfp300' : 'zfp120';
    const line = (code, description, price, source) => ({ code, description, quantity: 1, unitPrice: Number.isFinite(Number(price)) && price !== null && price !== undefined ? Number(price) : null, source });
    const lines = [
        line(config3D.crane?.key || 'crane', 'Crane', priceList?.crane?.[config3D.crane?.key], 'Account pricing API'),
        line(wll.code, `Tube diameter ${wll.diameterMm} mm`, wll.tubePriceKey ? PRODUCT_CATALOG.tubePrices[wll.tubePriceKey] : null, PRODUCT_CATALOG.priceSources.tube),
        line(wll.pump || `${wll.motorKw}kw`, `Vacuum pump ${wll.pump || ''} — ${wll.motorKw} kW motor`.trim(), wll.motorKw == null ? null : PRODUCT_CATALOG.motorPrices[String(wll.motorKw)] ?? priceList?.motor?.[`${wll.motorKw}kw`], PRODUCT_CATALOG.priceSources.motor),
        line(config3D.headStack?.key || 'handle', 'Handle control', config3D.headStack?.price, PRODUCT_CATALOG.priceSources.handles),
        line(config3D.suctionPack?.key || 'pad', 'Suction assembly', config3D.suctionPack?.price, PRODUCT_CATALOG.priceSources.pads),
        line(filter, 'Filter — inclusion in crane price requires confirmation', priceList?.filter?.[filter], 'Account pricing API; BOM inclusion pending'),
        line('power_1', 'Electrical equipment — inclusion requires confirmation', priceList?.power?.power_1, 'Account pricing API; BOM inclusion pending')
    ].map(item => ({ ...item, subtotal: item.unitPrice === null ? null : item.unitPrice * item.quantity }));
    const missing = lines.filter(item => item.unitPrice === null).map(item => item.description);
    // The source mixes wholesale and selling prices; this remains an estimate until commercial approval.
    return { currency: 'USD', lines, missing, complete: missing.length === 0, total: missing.length ? null : Math.round(lines.reduce((sum, item) => sum + item.subtotal, 0) * 100) / 100, commercialStatus: 'Indicative estimate — price basis and accessory inclusion require confirmation' };
}
