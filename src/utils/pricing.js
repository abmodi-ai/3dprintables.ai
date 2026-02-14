export const estimateToyWeight = (lengthMm, widthMm, heightMm = 50, densityFactor = 0.25) => {
    // 0.25 density factor accounts for hollow/infilled parts of a toy shape
    const PLA_DENSITY_G_MM3 = 0.00124; // 1.24g/cm3 converted to g/mm3
    const volumeMm3 = lengthMm * widthMm * heightMm;
    const estimatedWeightGrams = volumeMm3 * PLA_DENSITY_G_MM3 * densityFactor;
    return Math.max(10, Math.ceil(estimatedWeightGrams)); // Minimum 10g
};

export const calculateToyPrice = (weightGrams, printTimeHours = null, dimensions = null) => {
    // If dimensions are provided and weight isn't, estimate it
    let actualWeight = weightGrams;
    if (!actualWeight && dimensions) {
        // Assume height is roughly proportional to the average dimension
        const avgDim = (dimensions.length + dimensions.width) / 2;
        const estimatedHeight = avgDim * 0.4; // Average toy is 40% as tall as it is wide
        actualWeight = estimateToyWeight(dimensions.length, dimensions.width, estimatedHeight);
    }

    // Default weight if still zero
    actualWeight = actualWeight || 50;

    // Estimate print time if not provided (roughly 1.5 hours per 50g)
    const actualTime = printTimeHours || (actualWeight / 50) * 1.5;

    // Constants
    const MATERIAL_COST_PER_G = 0.035; // Adjusted for premium silk PLA
    const WASTE_FACTOR = 1.15;
    const MACHINE_HOURLY_RATE = 0.75; // Electricity + Maintenance + Amortization
    const FIXED_LABOR_COST = 5.50; // Prep, Cleanup, Packing
    const MARKUP = 2.5;
    const SHIPPING_COST = 8.50; // Global Flat Rate
    const FEE_DIVISOR = 0.88; // Platform + Card processing fees

    const plasticCost = (actualWeight * WASTE_FACTOR) * MATERIAL_COST_PER_G;
    const machineCost = actualTime * MACHINE_HOURLY_RATE;

    const productionCost = plasticCost + machineCost + FIXED_LABOR_COST;
    const retailPrice = productionCost * MARKUP;
    const priceWithShipping = retailPrice + SHIPPING_COST;
    const calculatedRawPrice = priceWithShipping / FEE_DIVISOR;
    const finalListingPrice = Math.ceil(calculatedRawPrice);

    return {
        finalPrice: finalListingPrice,
        weight: actualWeight,
        hours: actualTime.toFixed(1),
        breakdown: {
            plastic: plasticCost.toFixed(2),
            machine: machineCost.toFixed(2),
            labor: FIXED_LABOR_COST.toFixed(2),
            production: productionCost.toFixed(2),
            profit: (retailPrice - productionCost).toFixed(2),
            shipping: SHIPPING_COST.toFixed(2),
            fees: (finalListingPrice - priceWithShipping).toFixed(2)
        }
    };
};
