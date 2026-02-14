import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
    constructor(apiKey) {
        if (!apiKey) throw new Error("API key is required");
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Using the cutting-edge Gemini 3 models available for this laboratory
        // v1beta is required for preview models like Nano Banana
        this.model = this.genAI.getGenerativeModel({ model: "gemini-3-pro-preview" }, { apiVersion: "v1beta" });
        this.imageModel = this.genAI.getGenerativeModel({ model: "nano-banana-pro-preview" }, { apiVersion: "v1beta" });
    }

    async generateProductDesign(input, uploadedImageBase64) {
        const prompt = `You are a professional FDM (Fused Deposition Modeling) 3D printed toy designer at PrintPalooza. 
      
      MULTILINGUAL PROTOCOL:
      - Detect the language used in the input: "${input}".
      - Respond naturally in that SAME language.
      - If the user writes in Spanish, design in Spanish. If in Japanese, design in Japanese.
      
      CRITICAL DESIGN GUIDELINES:
      - The toy MUST look like it was 3D printed on a high-quality printer.
      - Mention specific 3D printing details: layer height (0.2mm), concentric top fills, and silk PLA filament textures.
      - Describe the mechanics: "print-in-place hinges", "snap-fit joints", or "infill patterns".
      
      TASK:
      1. Design a unique, creative 3D printable toy based on their request.
      2. Explain the engineering features in the user's language.
      3. At the VERY end of your response, provide the product data in this EXACT JSON format (Keep JSON keys in English):

      JSON_START{
        "name": "Creative Toy Name (In user's language)",
        "price": 29.99,
        "description": "2-sentence description highlighting the print quality and mechanics (In user's language).",
        "category": "Toy Category (In user's language)",
        "image_prompt": "A professional macro photograph of a 3D PRINTED [TOY NAME], made of vibrant silk PLA plastic, VISIBLE 3D PRINT LAYER LINES, FDM 3D printed texture, high quality 3D print, technical studio lighting, bokeh workshop background"
      }JSON_END`;

        let result;
        if (uploadedImageBase64) {
            // Remove header if present (data:image/jpeg;base64,)
            const base64Data = uploadedImageBase64.split(',')[1] || uploadedImageBase64;
            result = await this.model.generateContent([
                prompt,
                { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
            ]);
        } else {
            result = await this.model.generateContent(prompt);
        }

        const responseText = await result.response.text();
        const jsonMatch = responseText.match(/JSON_START(.*?)JSON_END/s);
        let product = null;
        let cleanText = responseText.replace(/JSON_START.*?JSON_END/s, '').trim();

        if (jsonMatch) {
            try {
                product = JSON.parse(jsonMatch[1]);

                // Native Image Generation using Nano Banana Pro
                const rawPrompt = product.image_prompt || product.name || "3D printed toy";
                let finalPrompt = `3D printed ${rawPrompt} with visible layer lines FDM texture silk PLA filament macro photography`;

                if (uploadedImageBase64) {
                    finalPrompt = `RETENTION_MODE: The attached image is the STRICT STRUCTURAL REFERENCE.
                    1. RETAIN the exact background, angle, lighting, and object pose from the attached reference image.
                    2. ONLY change the material/filament color.
                    PROMPT: ${finalPrompt}`;
                }

                try {
                    console.log('🎨 Generating native vision preview with Nano Banana Pro...', finalPrompt);

                    let imagePromptParts = [finalPrompt];
                    if (uploadedImageBase64) {
                        const base64Data = uploadedImageBase64.split(',')[1] || uploadedImageBase64;
                        imagePromptParts.push({ inlineData: { data: base64Data, mimeType: "image/jpeg" } });
                    }

                    const imageResult = await this.imageModel.generateContent(imagePromptParts);
                    const imageResponse = await imageResult.response;

                    console.log('📡 Image Model Response status:', imageResponse.candidates?.[0]?.finishReason);

                    const parts = imageResponse.candidates?.[0]?.content?.parts;
                    if (parts && parts.some(p => p.inlineData)) {
                        const imagePart = parts.find(p => p.inlineData);
                        const { mimeType, data } = imagePart.inlineData;
                        product.image = `data:${mimeType};base64,${data}`;
                        console.log('✅ Native image generated successfully');
                    } else {
                        throw new Error('No image data in Nano Banana response');
                    }
                } catch (imgErr) {
                    console.error('⚠️ Native Image Generation Failed:', imgErr);
                    // Optimized fallback to a different Pollinations pattern
                    const seed = Math.floor(Math.random() * 1000000);
                    product.image = `https://pollinations.ai/p/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;
                    console.log('🔄 Fallback to Pollinations Alternative');
                }

                // Post-processing
                product.id = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                if (typeof product.price === 'string') {
                    product.price = parseFloat(product.price.replace(/[^\d.]/g, ''));
                } else if (typeof product.price === 'number') {
                    product.price = parseFloat(product.price.toFixed(2));
                }
                if (isNaN(product.price)) product.price = 29.99;

            } catch (e) {
                console.error("Failed to parse AI JSON or Native Image", e);
            }
        }

        return {
            text: cleanText,
            product: product
        };
    }
}
