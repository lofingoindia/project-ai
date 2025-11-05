import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to generate custom prompts for each story
function generateCustomPrompt(bookName, childName) {
  const bookNameLower = (bookName || '').toLowerCase();
  
  console.log(`🔍 Checking book name: "${bookName}" (lowercase: "${bookNameLower}")`);
  
  // Boys Smile Story
   if (bookNameLower.includes('dinos') || bookNameLower.includes('dinosaur') || bookNameLower.includes('dino')) {
    console.log('✅ Matched: The Dinos Need You');
    return `Create a hyper-realistic, cinematic storybook-style illustration in 4:5 aspect ratio featuring a young boy as the central character, surrounded by four friendly cartoon-styled dinosaurs under a magical, moonlit sky. The boy, ${childName}, must appear exactly the same in every image, with no changes to facial features, body type, hairstyle, or clothing. He wears a long-sleeved royal blue sweatshirt with ribbed cuffs, dark navy blue pants with a soft matte texture, and simple dark sneakers. The clothing must remain identical across all variations — same fabric, folds, stitching details, and exact color tone — to preserve full character consistency.

The boy stands confidently at the center of the scene, smiling warmly, with soft moonlight illuminating his face and subtle catchlights in his eyes. His posture should suggest courage and connection to the viewer, with realistic skin shading, visible texture on his clothes, and believable body proportions appropriate for a young child.

Surrounding him are four distinct, stylized dinosaur companions with consistent design across all uses:

Blue Sauropod (like Brachiosaurus): long neck, gentle smile, big expressive eyes, soft blue skin with subtle texture, round toes, and slightly wrinkled skin near joints.

Green T-Rex: large head, big open smile with rounded teeth, small cartoon arms, vibrant green skin with slightly glossy finish and smooth surface.

Orange Triceratops: three soft horns, round friendly face, richly textured orange scales, white belly, and patterned spots.

Small Green Raptor: playfully crouched pose, large round eyes, tiny claws, and a slightly spiked tail — bright green with lime-colored highlights.

The setting is a fantastical prehistoric nighttime landscape, lit by a glowing crescent moon with stars scattered across the deep blue and violet sky. Include soft glowing clouds with a backlight effect from the moon, tall stylized trees in silhouette along the horizon, and scattered glowing vegetation — bioluminescent plants or rocks to add magical charm.

Apply high-end material realism to every element:

Leathery skin on dinosaurs with bump mapping

Soft cotton and knit textures on clothing

Slight damp shine on rocks or puddles for light reflection

Subtle dust particles or mist for cinematic atmosphere

Lighting should be dramatic and soft, with moonlight creating cool rim lights on all characters, soft shadows on the terrain, and occasional color reflections from glowing plants.

At the top of the image, include the storybook title:

${childName}, The Dinos Need YOU


Use a bold, Fredoka One Regular font style:

${childName} should appear in vibrant lime-green, larger and prominent

The Dinos Need YOU in a slightly lighter cream-green

Text must be integrated into the sky scene using a subtle glow, soft inner shadow, or slight emboss, so it feels like part of the image, not an overlay.

No logos, branding, or footer text. The entire image should look like a high-end storybook page or animated film key frame, blending realism and charm. All characters and details must be identical in future images for perfect story continuity — pose and background can vary, but boy’s outfit, dinosaurs’ style, and mood must remain consistent, keep the image in 4:5 ratio.`;
  }
  
  // Girl Counts with Forest Friends
  else if (bookNameLower.includes('girl') || bookNameLower.includes('counts') || bookNameLower.includes('forest') || bookNameLower.includes('friends')) {
    console.log('✅ Matched: Girl Counts with Forest Friends');
    return `Create an ultra-realistic, cinematic-quality storybook illustration for a children’s book cover titled ${childName} Counts With the Forest Friends. The main character is a young girl who looks exactly like the girl in the reference image — preserve her facial features, eye shape, hair color, hairstyle (pigtails), and joyful expression with maximum fidelity. The girl stands confidently on a forest path in a sun-drenched woodland clearing, wearing a white dress with gentle ruffles and golden floral embroidery, realistically textured with natural folds and soft cotton sheen.

Around her are several forest animal friends, positioned naturally and interacting with her:

A soft, white rabbit mid-hop with detailed fur texture and lively eyes

A ladybug gently perched on her hand, with visible wing segments and micro-reflection

A honeybee in mid-air, realistically suspended with wing blur and soft backlighting

Optional: birds fluttering above and butterflies trailing through sunbeams

The forest environment is dense and alive — include lush foliage with deep greens, sunbeams filtering through tall trees, and wildflowers like daisies and buttercups surrounding the path. The lighting should be warm and natural, with high dynamic range: sun rays casting soft glow on the girl's face, delicate shadows beneath her feet, and subtle backlighting on the edges of the foliage and animals. Include layered depth: the foreground is crisp, midground vibrant, and background softly blurred to create atmospheric perspective.

Textures must be rendered in photorealism: skin pores, natural hair strands, soft dress fabric, fine dust or pollen particles floating in the light, and organic forest ground with pebbles, leaves, and flowers in ultra-detail. The girl’s eyes should reflect natural light and convey warmth, joy, and connection with nature — true to the expression in the reference image.

At the top of the image, include the storybook title ${childName} Counts With the Forest Friends in a custom, Use Chalkboard  font, written in light green, softly glowing or embossed, as if part of the natural scene. The font should feel magical, slightly curved, and integrated into the sky or foliage above — not just floating text. Do not include any branding, logos, or additional graphics at the bottom.

The final image should look like a high-end illustrated storybook cover, blending photorealistic rendering with a warm, magical, storybook mood. Every visual element — facial likeness, animal realism, environmental lighting, and typography — must be cohesive, believable, and emotionally engaging, and image ratio need to be always 4:5 ratio..`;
  }
  
  // Boy The Dinos Need You
  else if (bookNameLower.includes('boys') || bookNameLower.includes('smile')) {
    console.log('✅ Matched: Boys Smile Story');
    return `Create a hyper-realistic, visually captivating recreation of the reference image featuring a joyful young child standing in a sunlit field of blooming daisies during golden hour. The child should not be holding any flowers — keep the hands natural and relaxed. Accurately replicate all surface textures, including the soft texture of the skin, the fine strands of hair, the smooth, patterned fabric of the child's outfit, and the natural detail in the surrounding wildflowers. The lighting must mirror the original image exactly — warm, golden, and dreamy — with soft shadows and delicate highlights that add depth and realism. Preserve the shallow depth of field with the child in crisp focus and the background rendered in a soft, creamy bokeh. Match the entire color palette, ensuring warm tones, subtle gradients, and natural transitions between light and shadow. At the top of the image, prominently feature the text ${childName} smiles in a uniquely designed, Use artistic  Comic Sans MS font — soft, rounded, elegant, and playful — rendered in a warm cream color that harmonizes beautifully with the overall sun-drenched and whimsical atmosphere. This text should feel naturally integrated into the composition, not just overlaid. Do not include any logos or watermarks at the bottom. Every visual element must be cohesive, refined, and indistinguishable from the original in style, mood, lighting, detail fidelity, and artistic expression,and image ratio need to be always 4:5 ratio.`;
  }

  // Boys Jungle Story — LOCKED TO REFERENCE (pose, animation, framing)
if (bookNameLower.includes('wild') || bookNameLower.includes('boy who spoke to the wild')) {
  console.log('✅ Matched: The Boy Who Spoke to the Wild (Locked to reference image)');
  return `Create a hyper-realistic, cinematic storybook-style illustration in 4:5 aspect ratio featuring a young boy as the central character in a lush, magical rainforest with playful monkeys. 
The scene MUST MATCH THE PROVIDED REFERENCE IMAGE ONE-TO-ONE for: camera angle, composition/framing, character positions, count and silhouettes, vine arcs, depth layering, background elements, lighting direction, volumetric beams, color palette, and the boy’s exact body POSE and MOTION. 
DO NOT change the boy’s pose, limb angles, stride, or gesture. DO NOT change the monkeys’ poses, swing paths, or placements. 
ONLY REPLACE the boy’s FACE to match the uploaded child, and update the title text with ${childName}. Nothing else changes.

Character continuity:
- The boy, ${childName}, must remain identical across all future images EXCEPT for face identity: same hairstyle, body type, proportions, and the SAME JUNGLE OUTFIT made of layered green leaves with a thin vine rope belt; barefoot with natural dirt detail. Keep the same leaf layering, shape, edge fray, fiber texture, and green hue as the reference. 
- Preserve the SAME expression (joyful, adventurous) and the SAME running motion captured in the reference (identical limb angles, torso tilt, and gait timing). Add no new props or accessories.

Monkeys:
- Keep the SAME number of monkeys, SAME placements (foreground/midground/background), SAME swing directions and arc timing, and SAME cartoon-realistic style (rounded faces, expressive eyes, smooth brown-black fur with subtle specular highlights). 
- Do not add, remove, or reposition monkeys beyond the reference. Match silhouettes and spacing.

Environment (LOCKED to reference):
- Dense tropical foliage with layered greens; same arrangement of leaves and vines.
- Colorful tropical flowers (orchid purple, crimson red, sky blue) in the SAME locations and sizes as the reference.
- Forest floor path, moss, and tiny puddles in the SAME layout and perspective.
- Volumetric sunbeams and atmosphere: replicate the SAME light shafts, intensity, bloom, haze, and dust/pollen particle density/placement.

Lighting & rendering (LOCKED to reference):
- Warm golden light filtering from above; same rim lights, shadow softness, depth-of-field falloff, and contrast.
- High-end material realism: visible leaf veins with slight translucency; soft sheen on monkey fur; damp soil with subtle reflections; believable skin shading on the boy.

Title text (integrated, same placement as reference):
${childName}, The Boy Who Spoke to the Wild

Typography:
- Font: Fredoka One Regular
- ${childName} in vibrant jungle green with a soft outer glow
- “The Boy Who Spoke to the Wild” in light cream-gold
- Text must be integrated into the canopy with subtle inner shadow / mist glow so it feels embedded, not overlaid. Keep EXACT position, size, and alignment as in the reference.

STRICT CONSTRAINTS — DO NOT:
- Do not change pose, gesture, clothing, background layout, animal count or positions, camera lens/framing, lighting direction, color palette, or mood.
- Do not add logos, watermarks, or footers.
- Keep the image in 4:5 ratio.

Goal:
- Generate an image that is composition-locked to the reference; ONLY the boy’s face identity changes to match the uploaded child image and the title updates with ${childName}. All other details remain identical for perfect continuity.`;
}



  
  // Default prompt for other stories
  else {
    console.log('⚠️ No specific match found, using default prompt');
    return `Create a hyper-realistic, cinematic storybook-style illustration for a children's book cover titled “${childName} and Fluffy’s Adventure,” in a 4:5 vertical aspect ratio. The scene centers on a joyful young boy named ${childName}, who must remain visually identical across all future illustrations. ${childName} has tousled, light golden blonde hair, fair skin with natural warmth, and expressive eyes lit with excitement. He wears a cozy, long-sleeved royal blue sweatshirt with ribbed cuffs and collar, paired with dark navy cotton pants and soft black sneakers. Every element of his clothing must remain exactly the same in all images — same color tones, fabric texture, fold placement, and stitching detail. He is seated mid-swing on a classic wooden swing suspended by two thick, rope-textured cords, both of which show realistic fiber detail, light fraying, and depth. His hands grip the ropes as he leans slightly back, smiling wide with flushed cheeks and eyes full of wonder.

In his lap sits Fluffy, a soft tan teddy bear designed with lifelike plush fur, round stitched ears, slightly sagging limbs, and shiny button eyes. Fluffy must always appear with the same size, posture, and texture, reflecting wear and softness like a beloved companion. The background is a warm, enchanted autumn forest, glowing with golden sunlight filtering through tall trees with amber and ochre leaves. Light must stream dynamically through the canopy, casting soft beams, golden rim lighting, and dappled highlights across the swing ropes, ${childName}  hair, and Fluffy’s fur. Fallen leaves should appear scattered across the forest floor, with some gently floating in the air, exhibiting natural mid-fall curl and mild motion blur. Tiny particles such as dust motes or pollen should subtly catch in the sunbeams to add atmospheric realism.

All textures must be meticulously rendered. The swing should display natural wood grain, slightly worn edges, and warm color variation. ${childName}  skin should show gentle subsurface scattering on ears and fingertips, while the clothing reveals natural fabric tension, seam lines, and soft creases affected by motion. Shadows must fall consistently across all elements, with soft, cool-toned ambient shadows beneath the swing and around nearby leaves. Tree bark should have deep grooves and ambient occlusion at the base, while the background should gently blur for depth of field, giving the entire image a cinematic, professional illustration feel.

At the top of the composition, integrate the storybook title ${childName}  and Fluffy’s Adventure” using a playful, custom children’s book font. The word “${childName}” should be bold, large, and vibrant yellow, while “and Fluffy’s Adventure” appears in a smaller, curved style beneath it, in soft cream or orange tones. The typography must blend naturally into the scene with gentle inner shadows, subtle warm glows, or environmental color spill — never appearing flat or overlaid. Optional butterflies may flutter around the text for a magical framing effect.

The final illustration must feel like a key frame from a high-end animated feature — blending realism, warmth, wonder, and visual clarity — with absolute consistency in character design, lighting direction, clothing, props, and environmental style. No logos, watermarks, or branding should be included.`;
  }
}

serve(async (req) => {
  console.log("🚀 Edge Function started");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    console.log("📦 Received data:", JSON.stringify(data, null, 2));
    
    const { 
      bookId, 
      bookName,
      childImageUrl, 
      childName, 
      userId
    } = data;

    // Validate required inputs
    if (!bookId || !childName || !userId || !childImageUrl) {
      console.log("❌ Missing required parameters");
      return new Response(
        JSON.stringify({ error: "Missing required parameters: bookId, childName, userId, childImageUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Parameters validated");
    console.log("📚 Book ID:", bookId);
    console.log("📖 Book Name:", bookName);

    // Generate custom prompt based on book name (not ID)
    const prompt = generateCustomPrompt(bookName || bookId, childName);
    
    console.log("🤖 Generated custom prompt:", prompt);
    console.log("👶 Child URL:", childImageUrl);

    // Call your new Python API with the correct format
    const pythonApiUrl = "http://72.60.193.120:5000/generate-image"

    // Download child image and convert to base64
    console.log("⬇️ Downloading child image for base64 conversion...");
    let childImageBase64;
    try {
      const childImageResponse = await fetch(childImageUrl);
      if (!childImageResponse.ok) {
        throw new Error(`Failed to download child image: ${childImageResponse.status}`);
      }
      const childImageArrayBuffer = await childImageResponse.arrayBuffer();
      const childImageBytes = new Uint8Array(childImageArrayBuffer);
      
      // Convert to base64
      let binaryString = '';
      for (let i = 0; i < childImageBytes.length; i++) {
        binaryString += String.fromCharCode(childImageBytes[i]);
      }
      childImageBase64 = btoa(binaryString);
      console.log(`✅ Child image converted to base64: ${childImageBase64.length} characters`);
    } catch (error) {
      console.error("❌ Failed to download/convert child image:", error);
      return new Response(
        JSON.stringify({ error: `Failed to process child image: ${error.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pythonRequest = {
      prompt: prompt,
      image: childImageBase64
    };

    console.log("📤 Sending request to Python API");

    const pythonResponse = await fetch(pythonApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pythonRequest)
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error("❌ Python API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Python API error", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseData = await pythonResponse.json();

    console.log("✅ Received response from Python API:", responseData);

    // Extract the generated image from Python API response
    const generatedImageBase64 = responseData.generated_image;
    if (!generatedImageBase64) {
      console.error("❌ No generated_image in Python API response");
      return new Response(
        JSON.stringify({ error: "No generated image received from AI service" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the base64 image data directly for Flutter to handle
    // Flutter will convert this to bytes and display using Image.memory()
    
    // Return result to client in the format Flutter expects
    return new Response(
      JSON.stringify({
        success: true,
        generated_image_base64: generatedImageBase64,
        generated_image_url: null, // No URL, using base64 instead
        message: "Image generated successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

