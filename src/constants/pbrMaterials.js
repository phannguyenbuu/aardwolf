/**
 * Photorealistic PBR Material Library for Three.js & WebGL Suites
 * Extracted and calibrated from:
 * - Realtime Path Tracing (Cornell Box)
 * - Three.js Glass Absorption (Beer-Lambert spectral decay)
 * - WebGL Dispersion Caustics (Cauchy IOR & Dispersion)
 * - WebGL2 Screen Space Reflections & SSPT (Cook-Torrance GGX & Fresnel Schlick)
 * - C2 WebGPU Renderer (Anisotropic specular highlights)
 */
import * as THREE from 'three';

export const PBR_MATERIAL_CATEGORIES = {
    METALS: 'Kim loại (Metals)',
    GLASS: 'Kính & Trong suốt (Glass & Optics)',
    PLASTICS: 'Nhựa & Lớp phủ (Polymers & Enamels)',
    RUBBERS: 'Cao su & Giác hút (Rubbers & Suction)'
};

export const PBR_MATERIALS = [
    // ==========================================
    // METALS (KIM LOẠI)
    // ==========================================
    {
        id: 'gold_24k',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Vàng 24K Hoàng Gia (24K Royal Gold)',
        previewColor: '#FFD700',
        badge: 'Precious',
        params: {
            color: 0xffd700,
            metalness: 1.0,
            roughness: 0.12,
            clearcoat: 0.35,
            clearcoatRoughness: 0.1,
            reflectivity: 0.95
        }
    },
    {
        id: 'gold_rose',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Vàng Hồng Quý Phái (Rose Gold)',
        previewColor: '#B76E79',
        badge: 'Precious',
        params: {
            color: 0xb76e79,
            metalness: 1.0,
            roughness: 0.16,
            clearcoat: 0.25,
            clearcoatRoughness: 0.12
        }
    },
    {
        id: 'aluminum_brushed',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Nhôm Phay Xước (Brushed Aluminum)',
        previewColor: '#D1D5DB',
        badge: 'Industrial',
        params: {
            color: 0xd1d5db,
            metalness: 0.92,
            roughness: 0.32,
            clearcoat: 0.15,
            clearcoatRoughness: 0.2
        }
    },
    {
        id: 'aluminum_polished',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Nhôm Đánh Bóng (Polished Aluminum)',
        previewColor: '#E5E7EB',
        badge: 'Specular',
        params: {
            color: 0xe5e7eb,
            metalness: 0.98,
            roughness: 0.08,
            clearcoat: 0.5,
            clearcoatRoughness: 0.08
        }
    },
    {
        id: 'copper',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Đồng Đỏ Nguyên Chất (Pure Red Copper)',
        previewColor: '#C87A5B',
        badge: 'Pure Metal',
        params: {
            color: 0xc87a5b,
            metalness: 1.0,
            roughness: 0.18,
            clearcoat: 0.2,
            clearcoatRoughness: 0.15
        }
    },
    {
        id: 'brass',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Đồng Thau Công Nghiệp (Industrial Brass)',
        previewColor: '#D4AF37',
        badge: 'Alloy',
        params: {
            color: 0xd4af37,
            metalness: 0.96,
            roughness: 0.22,
            clearcoat: 0.25,
            clearcoatRoughness: 0.15
        }
    },
    {
        id: 'steel_brushed',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Thép Không Gỉ Xước (Brushed Stainless Steel)',
        previewColor: '#8A9EA7',
        badge: 'Structural',
        params: {
            color: 0x8a9ea7,
            metalness: 0.88,
            roughness: 0.35,
            clearcoat: 0.3,
            clearcoatRoughness: 0.25
        }
    },
    {
        id: 'chrome_mirror',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Mạ Crom Bóng Gương (Mirror Polished Chrome)',
        previewColor: '#F8FAFC',
        badge: 'Ultra Mirror',
        params: {
            color: 0xf8fafc,
            metalness: 1.0,
            roughness: 0.02,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            reflectivity: 1.0
        }
    },
    {
        id: 'titanium_dark',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Titan Gunmetal Xám (Dark Titanium)',
        previewColor: '#475569',
        badge: 'Aerospace',
        params: {
            color: 0x475569,
            metalness: 0.95,
            roughness: 0.32,
            clearcoat: 0.2,
            clearcoatRoughness: 0.2
        }
    },
    {
        id: 'cast_iron',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Gang Đúc Nhám (Rough Cast Iron)',
        previewColor: '#27272A',
        badge: 'Heavy Cast',
        params: {
            color: 0x27272a,
            metalness: 0.82,
            roughness: 0.65,
            clearcoat: 0.05
        }
    },

    // ==========================================
    // GLASS & OPTICS (KÍNH & QUANG HỌC)
    // ==========================================
    {
        id: 'glass_clear',
        category: PBR_MATERIAL_CATEGORIES.GLASS,
        name: 'Kính Trắng Siêu Trong (Ultra-Clear Float Glass)',
        previewColor: '#E2E8F0',
        badge: 'Float Glass',
        params: {
            color: 0xffffff,
            transmission: 0.98,
            opacity: 1.0,
            transparent: true,
            ior: 1.52,
            roughness: 0.02,
            thickness: 1.5,
            specularIntensity: 1.0
        }
    },
    {
        id: 'glass_amber',
        category: PBR_MATERIAL_CATEGORIES.GLASS,
        name: 'Kính Hấp Thụ Hổ Phách (Amber Absorption Glass)',
        previewColor: '#CD5615',
        badge: 'Absorption',
        params: {
            color: 0xcd5615,
            transmission: 0.92,
            opacity: 1.0,
            transparent: true,
            ior: 1.54,
            roughness: 0.04,
            attenuationColor: new THREE.Color(0xcd5615),
            attenuationDistance: 0.45,
            thickness: 2.0
        }
    },
    {
        id: 'glass_tinted_blue',
        category: PBR_MATERIAL_CATEGORIES.GLASS,
        name: 'Kính Lọc Xanh Biển (Cyan/Blue Tinted Glass)',
        previewColor: '#38BDF8',
        badge: 'Solar Tint',
        params: {
            color: 0xe0f2fe,
            transmission: 0.95,
            opacity: 1.0,
            transparent: true,
            ior: 1.52,
            roughness: 0.03,
            attenuationColor: new THREE.Color(0x0284c7),
            attenuationDistance: 0.75,
            thickness: 1.8
        }
    },
    {
        id: 'glass_emerald',
        category: PBR_MATERIAL_CATEGORIES.GLASS,
        name: 'Kính Xanh Lục Bảo (Emerald Architectural Glass)',
        previewColor: '#10B981',
        badge: 'Tinted',
        params: {
            color: 0xecfdf5,
            transmission: 0.94,
            opacity: 1.0,
            transparent: true,
            ior: 1.53,
            roughness: 0.03,
            attenuationColor: new THREE.Color(0x059669),
            attenuationDistance: 0.6,
            thickness: 1.8
        }
    },
    {
        id: 'glass_frosted',
        category: PBR_MATERIAL_CATEGORIES.GLASS,
        name: 'Kính Mờ Phun Cát (Frosted Sandblasted Glass)',
        previewColor: '#CBD5E1',
        badge: 'Diffused',
        params: {
            color: 0xf8fafc,
            transmission: 0.88,
            opacity: 1.0,
            transparent: true,
            ior: 1.48,
            roughness: 0.44,
            thickness: 1.0
        }
    },
    {
        id: 'glass_dispersion',
        category: PBR_MATERIAL_CATEGORIES.GLASS,
        name: 'Kính Lăng Kính Tán Sắc (Dispersion Prism Glass)',
        previewColor: '#A855F7',
        badge: 'Dispersion',
        params: {
            color: 0xffffff,
            transmission: 0.98,
            opacity: 1.0,
            transparent: true,
            ior: 1.62,
            roughness: 0.02,
            thickness: 2.5,
            specularIntensity: 1.2
        }
    },

    // ==========================================
    // POLYMERS & PLASTICS (NHỰA & LỚP PHỦ)
    // ==========================================
    {
        id: 'plastic_yellow_aardwolf',
        category: PBR_MATERIAL_CATEGORIES.PLASTICS,
        name: 'Vàng An Toàn Aardwolf (Aardwolf Safety Yellow)',
        previewColor: '#F59E0B',
        badge: 'OEM Coating',
        params: {
            color: 0xf59e0b,
            metalness: 0.05,
            roughness: 0.18,
            clearcoat: 0.85,
            clearcoatRoughness: 0.1,
            reflectivity: 0.7
        }
    },
    {
        id: 'plastic_crimson_gloss',
        category: PBR_MATERIAL_CATEGORIES.PLASTICS,
        name: 'Nhựa Đỏ Bóng Cao Cấp (Glossy Crimson Enamel)',
        previewColor: '#DC2626',
        badge: 'High Gloss',
        params: {
            color: 0xdc2626,
            metalness: 0.02,
            roughness: 0.08,
            clearcoat: 0.98,
            clearcoatRoughness: 0.06
        }
    },
    {
        id: 'plastic_piano_black',
        category: PBR_MATERIAL_CATEGORIES.PLASTICS,
        name: 'Nhựa Đen Bóng Piano (Glossy Jet Piano Black)',
        previewColor: '#111827',
        badge: 'Piano Finish',
        params: {
            color: 0x111827,
            metalness: 0.05,
            roughness: 0.05,
            clearcoat: 1.0,
            clearcoatRoughness: 0.03
        }
    },
    {
        id: 'plastic_white_enamel',
        category: PBR_MATERIAL_CATEGORIES.PLASTICS,
        name: 'Nhựa Men Trắng Sứ (Glossy Ceramic White)',
        previewColor: '#F9FAFB',
        badge: 'Ceramic Enamel',
        params: {
            color: 0xf9fafb,
            metalness: 0.02,
            roughness: 0.1,
            clearcoat: 0.9,
            clearcoatRoughness: 0.08
        }
    },
    {
        id: 'plastic_matte_abs',
        category: PBR_MATERIAL_CATEGORIES.PLASTICS,
        name: 'Nhựa Kỹ Thuật ABS Nhám (Matte Heavy ABS)',
        previewColor: '#374151',
        badge: 'Matte ABS',
        params: {
            color: 0x374151,
            metalness: 0.0,
            roughness: 0.65,
            clearcoat: 0.0
        }
    },
    {
        id: 'polymer_polycarbonate',
        category: PBR_MATERIAL_CATEGORIES.PLASTICS,
        name: 'Nhựa Bán Trong Polycarbonate (Translucent PC)',
        previewColor: '#94A3B8',
        badge: 'Translucent',
        params: {
            color: 0xf1f5f9,
            transmission: 0.78,
            transparent: true,
            opacity: 0.95,
            ior: 1.58,
            roughness: 0.32,
            thickness: 1.2
        }
    },

    // ==========================================
    // RUBBERS & SUCTION (CAO SU & GIÁC HÚT)
    // ==========================================
    {
        id: 'rubber_suction_pad',
        category: PBR_MATERIAL_CATEGORIES.RUBBERS,
        name: 'Cao Su Giác Hút NBR Đen (Vacuum Suction Pad)',
        previewColor: '#18181B',
        badge: 'Heavy Grip',
        params: {
            color: 0x18181b,
            metalness: 0.0,
            roughness: 0.88,
            clearcoat: 0.0
        }
    },
    {
        id: 'rubber_silicone_orange',
        category: PBR_MATERIAL_CATEGORIES.RUBBERS,
        name: 'Cao Su Silicone Cam Chịu Nhiệt (Orange Silicone)',
        previewColor: '#EA580C',
        badge: 'High Heat',
        params: {
            color: 0xea580c,
            metalness: 0.0,
            roughness: 0.72,
            clearcoat: 0.1
        }
    },
    {
        id: 'rubber_corrugated_tube',
        category: PBR_MATERIAL_CATEGORIES.RUBBERS,
        name: 'Cao Su Gân Ống Bellows (Corrugated Bellows)',
        previewColor: '#27272A',
        badge: 'Flexible Bellow',
        params: {
            color: 0x27272a,
            metalness: 0.03,
            roughness: 0.82,
            clearcoat: 0.05
        }
    }
];

/**
 * Instantiate a live Three.js MeshPhysicalMaterial from library ID
 * @param {string} materialId
 * @param {object} [customOverrides] Optional physical overrides (roughness, metalness, clearcoat, transmission, ior)
 * @returns {THREE.MeshPhysicalMaterial}
 */
export function createPBRMaterial(materialId, customOverrides = null) {
    const matDef = PBR_MATERIALS.find(m => m.id === materialId) || PBR_MATERIALS[0];
    const params = { ...matDef.params, ...(customOverrides || {}) };
    
    // Ensure Color instance
    if (typeof params.color === 'number' || typeof params.color === 'string') {
        params.color = new THREE.Color(params.color);
    }
    if (params.attenuationColor && !(params.attenuationColor instanceof THREE.Color)) {
        params.attenuationColor = new THREE.Color(params.attenuationColor);
    }

    const mat = new THREE.MeshPhysicalMaterial(params);
    mat.userData = { 
        materialId: matDef.id, 
        materialName: matDef.name,
        customParams: customOverrides || {}
    };
    return mat;
}

export const PART_LABELS = {
    crane: 'Crane Arm (Khung Cần Cẩu)',
    pump: 'Vacuum Pump (Thân Bơm)',
    tube: 'Vacuum Tube (Ống Nâng)',
    head: 'Handle Unit (Tay Điều Khiển)',
    suction: 'Suction Cups (Giác Hút)',
    workpiece: 'Workpiece (Tấm Phôi Hút)'
};

export const PART_ICONS = {
    crane: '🏗️',
    pump: '⚡',
    tube: '🌀',
    head: '🕹️',
    suction: '🧲',
    workpiece: '📦'
};

export const PBR_PRESETS = [
    {
        name: '⭐ 24K Luxury Gold',
        mats: {
            crane: 'gold_24k',
            pump: 'gold_24k',
            tube: 'rubber_corrugated_tube',
            head: 'gold_rose',
            suction: 'rubber_suction_pad',
            workpiece: 'aluminum_polished'
        }
    },
    {
        name: '🪞 Mirror Chrome',
        mats: {
            crane: 'chrome_mirror',
            pump: 'chrome_mirror',
            tube: 'polymer_polycarbonate',
            head: 'chrome_mirror',
            suction: 'rubber_suction_pad',
            workpiece: 'steel_brushed'
        }
    },
    {
        name: '🔬 Dispersion & Glass Optics',
        mats: {
            crane: 'aluminum_brushed',
            pump: 'titanium_dark',
            tube: 'glass_amber',
            head: 'aluminum_polished',
            suction: 'rubber_silicone_orange',
            workpiece: 'glass_dispersion'
        }
    },
    {
        name: '🏭 Aardwolf Standard Industrial',
        mats: {
            crane: 'steel_brushed',
            pump: 'plastic_yellow_aardwolf',
            tube: 'rubber_corrugated_tube',
            head: 'titanium_dark',
            suction: 'rubber_suction_pad',
            workpiece: 'aluminum_brushed'
        }
    },
    {
        name: '✨ Titanium & Clear Glass',
        mats: {
            crane: 'titanium_dark',
            pump: 'plastic_piano_black',
            tube: 'glass_clear',
            head: 'aluminum_brushed',
            suction: 'rubber_suction_pad',
            workpiece: 'glass_tinted_blue'
        }
    }
];
