import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to generate custom prompts for each story
function generateCustomPrompt(bookName, childName) {
  const bookNameLower = (bookName || '').toLowerCase();
  
  console.log(`🔍 Checking book name: "${bookName}" (lowercase: "${bookNameLower}")`);
  
  // Boy The Dinos Need You - Check this FIRST (most specific)
  if (bookNameLower.includes('dinos') || bookNameLower.includes('dinosaur') || bookNameLower.includes('dino')) {
    console.log('✅ Matched: The Dinos Need You');
    return `Create an exciting children's book cover featuring ${childName} as a brave young hero in a prehistoric adventure. Show ${childName} standing confidently with friendly dinosaurs in the background - maybe a gentle triceratops, a curious stegosaurus, and a small, cute baby dinosaur. The setting should be a prehistoric landscape with volcanoes, palm trees, and a dramatic sky. ${childName} should look determined and heroic, wearing adventure clothing. Include the title "The Dinos Need You" in bold, adventure-style fonts. Use vibrant colors with oranges, reds, and greens to create an exciting, action-packed feel. Make sure ${childName}'s face is clearly recognizable and the image conveys adventure and friendship.`;
  }
  
  // Girl Counts with Forest Friends
  else if (bookNameLower.includes('girl') || bookNameLower.includes('counts') || bookNameLower.includes('forest') || bookNameLower.includes('friends')) {
    console.log('✅ Matched: Girl Counts with Forest Friends');
    return `Create a magical children's book cover featuring ${childName} as the main character in a lush forest adventure. Show ${childName} in a storybook style scene with a forest path, soft sunlight filtering through trees, and a playful, cheerful atmosphere. The background should be filled with flowers, greenery, and gentle wildlife like a bunny and bees, giving it a magical and joyful feeling. ${childName} should look happy and adventurous, with the forest friends around them. Use vibrant greens and warm colors to create an enchanting, magical feel. Make sure ${childName}'s face is clearly recognizable and the image conveys adventure and friendship.`;
  }
  
  // Boys Smile Story - Check this LAST (least specific, contains generic "boy")
  else if (bookNameLower.includes('boys') || bookNameLower.includes('smile')) {
    console.log('✅ Matched: Boys Smile Story');
    return `Create a beautiful, personalized children's book cover featuring ${childName} as the main character. The cover should show ${childName} in a dreamy, sunlit field of daisies with a warm, golden-hour lighting. ${childName} should be smiling and happy, wearing a floral-patterned outfit. The background should have soft bokeh effects with daisies and gentle sunlight filtering through. The image should have a dreamy, serene atmosphere with warm colors and natural lighting. Make sure ${childName}'s face is clearly recognizable and the image conveys joy and innocence.`;
  }
  
  // Default prompt for other stories
  else {
    console.log('⚠️ No specific match found, using default prompt');
    return `Create a beautiful, personalized children's book cover featuring ${childName} as the main character. The cover should be colorful, engaging, and perfect for a children's book. Show ${childName} in an exciting adventure scene that matches the story theme. Use bright, vibrant colors and a cheerful atmosphere. Make sure ${childName}'s face is clearly recognizable and the image conveys joy and adventure. The style should be appropriate for children with a magical, storybook feel.`;
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
    const pythonApiUrl = "http://72.60.193.120:5000/generate-image";

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
