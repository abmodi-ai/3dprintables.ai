import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
    constructor(apiKey) {
        if (!apiKey) throw new Error("API key is required");
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Using Gemini 3 preview models (v1beta required for preview access)
        this.model = this.genAI.getGenerativeModel({ model: "gemini-3-pro-preview" }, { apiVersion: "v1beta" });
        this.imageModel = this.genAI.getGenerativeModel({ model: "nano-banana-pro-preview" }, { apiVersion: "v1beta" });
    }

    async generateProductDesign(input, uploadedImageBase64, conversationHistory = []) {
        // Determine if user uploaded an image (with or without text)
        const hasImage = !!uploadedImageBase64;
        const hasUserText = input && input.trim().length > 0
            && !input.trim().match(/^\(Filament Color:.*\)$/)
            && !input.trim().match(/^Convert this into a 3D printed PLA object/);

        // Check if this is a follow-up to a clarification question
        const isFollowUp = conversationHistory.length > 0;

        // Build conversation context from previous messages (for follow-up replies)
        const conversationContext = isFollowUp ? `
      CONVERSATION CONTEXT — THIS IS A FOLLOW-UP:
      The user previously uploaded an image and you asked for clarification.
      Here is the conversation so far:
      ${conversationHistory.map(m => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`).join('\n      ')}

      The user has now replied: "${input}"
      DO NOT ask for clarification again. The user has already told you what they want.
      PROCEED DIRECTLY with generating the design based on their answer.
      Use the reference image (attached) along with their clarification to create the product.` : '';

        const imageInstructions = hasImage && !isFollowUp ? `
      IMAGE ANALYSIS — CLARIFY BEFORE GENERATING:
      - The user has uploaded a reference image. Study it carefully.
      - Your FIRST job is to decide: Is it CLEAR what single object the user wants 3D printed?

      ASK FOR CLARIFICATION if ANY of these are true:
        • The image contains MULTIPLE distinct objects (e.g. a person holding 2+ items, a table with several things)
        • The image is ambiguous — it's not obvious which item should be 3D printed
        • The image shows a person and it's unclear if they want the items the person is holding, or something else
        • The user did NOT provide text specifying which object they want

      When asking for clarification:
        • Be friendly and brief (2-3 sentences max)
        • List the objects you can see that could be 3D printed (e.g. "I can see a spiral fidget toy, a dragon figurine, and a geometric fan shape")
        • Also mention that you can create a 3D printed portrait/bust/relief of the person if that's what they want
        • Ask which one they'd like you to create as a 3D print
        • Do NOT include the JSON_START/JSON_END block — just ask the question
        • Do NOT generate a product — wait for the user's answer

      PROCEED WITH DESIGN only if:
        • The image clearly shows ONE single object to 3D print, OR
        • The user's text message specifically tells you which object to print
        ${hasUserText ? `• The user said: "${input}" — if this clearly identifies which object, proceed with the design.` : '• The user uploaded this image without specifying which object. If multiple objects are visible, you MUST ask for clarification.'}

      When proceeding with design:
        • IGNORE any people, hands, backgrounds, or surroundings — focus ONLY on the object to be printed
        • Design a 3D printed PLA version of that specific object
        • CRITICAL for image_prompt: Describe ONLY the 3D printed object on a clean studio background. Do NOT describe people, hands, rooms, or the original photo.

      EXCEPTION — FACE/PORTRAIT REQUESTS:
        • If the user specifically asks for a face, portrait, bust, relief, lithophane, or likeness of a person in the image, then set "requires_likeness": true in the JSON.
        • For likeness requests, describe the 3D printed style in image_prompt but do NOT try to describe the person's facial features — the reference photo will be used directly.` : '';

        const followUpImageInstructions = hasImage && isFollowUp ? `
      IMAGE REFERENCE:
      - The attached image was uploaded earlier by the user.
      - Based on the conversation above, the user has told you EXACTLY what they want from this image.
      - DO NOT ask any more questions. Proceed directly with the design.
      - IGNORE any people, hands, backgrounds — focus ONLY on the object the user specified.
      - CRITICAL for image_prompt: Describe ONLY the 3D printed object on a clean studio background.

      EXCEPTION — FACE/PORTRAIT REQUESTS:
        • If the user asked for a face, portrait, bust, relief, lithophane, or likeness of a person in the image, then set "requires_likeness": true in the JSON.
        • For likeness requests, the reference photo will be sent to the image model to preserve facial accuracy. Describe the 3D print style in image_prompt but do NOT describe the person's face in detail.` : '';

        const prompt = `You are a friendly product designer at 3DPrintables.ai, a custom 3D printing service run by Arav, a 9-year-old maker.

      MULTILINGUAL PROTOCOL:
      - Detect the language used in the input: "${input}".
      - Respond naturally in that SAME language.
      ${conversationContext}
      ${imageInstructions}
      ${followUpImageInstructions}

      RESPONSE STYLE — SHORT & CUSTOMER-FOCUSED:
      - Keep your response SHORT (3-5 sentences MAX before the JSON block).
      - Write like a friendly product listing, NOT a technical manual.
      - Focus ONLY on what matters to a buyer:
        • What it looks like (size, shape, visual appeal)
        • What makes it special or unique
        • Who it's great for (gift idea, desk decor, collectors, kids, etc.)
        • The color/finish they chose
      - Do NOT mention technical 3D printing details like layer height, infill patterns, nozzle paths, concentric fills, gyroid infill, or engineering specs.
      - Do NOT use headers, bullet point lists, or long formatting. Just a short, warm, engaging paragraph.

      TASK:
      ${isFollowUp ? `The user has already clarified what they want. PROCEED DIRECTLY with the design — do NOT ask again.` : `1. If you need clarification (see IMAGE ANALYSIS rules above), ask the user and STOP — do not include JSON_START/JSON_END.`}
      ${isFollowUp ? '1' : '2'}. Come up with a creative, catchy product name for a 3D PRINTED PLA version of the design.
      ${isFollowUp ? '2' : '3'}. Write a short, enthusiastic product description (3-5 sentences).
      ${isFollowUp ? '3' : '4'}. At the VERY end, provide the product data in this EXACT JSON format (Keep JSON keys in English):

      JSON_START{
        "name": "Creative Product Name (In user's language)",
        "price": 29.99,
        "description": "1-2 sentence product tagline highlighting what makes it awesome (In user's language).",
        "category": "Product Category (In user's language)",
        "requires_likeness": false,
        "image_prompt": "A professional macro photograph of a 3D PRINTED PLA version of [SPECIFIC OBJECT], made of vibrant silk PLA plastic, VISIBLE 3D PRINT LAYER LINES, FDM 3D printed texture, high quality 3D print, technical studio lighting, bokeh workshop background"
      }JSON_END

      IMPORTANT about "requires_likeness":
      - Set to true ONLY when the user wants a 3D printed portrait, face, bust, relief, lithophane, or likeness of a SPECIFIC person shown in their uploaded photo.
      - When true, the uploaded photo will be sent as a reference to the image model so it can preserve the person's actual facial features.
      - When false (default for objects, toys, figurines, etc.), only the text prompt is used for image generation.`;

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

                // Determine if this is a likeness/portrait request that needs the reference image
                const requiresLikeness = product.requires_likeness === true && hasImage && uploadedImageBase64;

                // Native Image Generation using Nano Banana Pro
                const rawPrompt = product.image_prompt || product.name || "3D printed toy";

                try {
                    console.log('Generating image preview...');

                    let imagePromptParts;

                    if (requiresLikeness) {
                        // LIKENESS MODE: Send reference image + transformation prompt
                        // The image model uses the photo to preserve facial features while
                        // rendering the output as a 3D printed PLA object
                        const base64Data = uploadedImageBase64.split(',')[1] || uploadedImageBase64;
                        const likenessPrompt = `Transform this person's face into a 3D printed PLA portrait relief/bust. ${rawPrompt}. The output must look like a real 3D PRINTED object made of solid PLA plastic filament with VISIBLE FDM layer lines, printed texture, and a single solid color. Studio lighting, clean workshop background with bokeh. Maintain the exact facial features and likeness of the person in the reference photo.`;

                        console.log('Using LIKENESS mode — sending reference image to preserve facial features');
                        imagePromptParts = [
                            likenessPrompt,
                            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
                        ];
                    } else {
                        // STANDARD MODE: Text-only prompt for fresh generation
                        // IMPORTANT: Never send the user's uploaded photo to the image model for regular objects.
                        // The text model already analyzed the photo and described the object in image_prompt.
                        // Sending the original photo causes the model to edit-in-place instead.
                        const finalPrompt = `3D printed ${rawPrompt} with visible layer lines FDM texture silk PLA filament macro photography`;
                        console.log('Using STANDARD mode — text-only image generation');
                        imagePromptParts = [finalPrompt];
                    }

                    const imageResult = await this.imageModel.generateContent(imagePromptParts);
                    const imageResponse = await imageResult.response;

                    // Check response for image data
                    const parts = imageResponse.candidates?.[0]?.content?.parts;
                    if (parts && parts.some(p => p.inlineData)) {
                        const imagePart = parts.find(p => p.inlineData);
                        const { mimeType, data } = imagePart.inlineData;
                        product.image = `data:${mimeType};base64,${data}`;
                        // Image generated successfully
                    } else {
                        throw new Error('No image data in response');
                    }
                } catch (imgErr) {
                    console.error('Image generation error:', imgErr.message);
                    // Fallback to Pollinations image service
                    const finalPrompt = `3D printed ${rawPrompt} with visible layer lines FDM texture silk PLA filament macro photography`;
                    const seed = Math.floor(Math.random() * 1000000);
                    product.image = `https://pollinations.ai/p/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;
                }

                // Clean up — remove requires_likeness from the product object (internal flag only)
                delete product.requires_likeness;

                // Post-processing
                product.id = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                if (typeof product.price === 'string') {
                    product.price = parseFloat(product.price.replace(/[^\d.]/g, ''));
                } else if (typeof product.price === 'number') {
                    product.price = parseFloat(product.price.toFixed(2));
                }
                if (isNaN(product.price)) product.price = 29.99;

            } catch (e) {
                console.error("Failed to process design response:", e.message);
            }
        }

        return {
            text: cleanText,
            product: product
        };
    }
}
