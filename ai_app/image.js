import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// No longer needed - we're passing URLs directly to Python API

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
      coverImageUrl, 
      childImageUrl, 
      childName, 
      userId,
      childImageBase64,
      childImageMime 
    } = data;

    // Validate required inputs
    if (!bookId || !childName || !userId) {
      console.log("❌ Missing basic required parameters");
      return new Response(
        JSON.stringify({ error: "Missing required parameters: bookId, childName, userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if we have image URLs
    if (!coverImageUrl || !childImageUrl) {
      console.log("❌ Missing image URLs");
      return new Response(
        JSON.stringify({ error: "Missing required image URLs: coverImageUrl and childImageUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Parameters validated");

    // Generate prompt
    const prompt = `[change the face of cover image kid] + [use 2nd image real kid image in comic book character face] Replace the kids face in the book cover with the attached reference child image. Keep the face, hairstyle, and camera angle exactly the same and give details in face as per the 2nd uploaded single kid realistic image focous on face zoom in. The background and context must remain unchanged, and the final image should look perfectly realistic and clearly identifiable as the sam ${childName}`;
    
    console.log("🤖 Generated prompt:", prompt);
    console.log("🔗 Using direct URLs - no downloading needed");
    console.log("📸 Cover URL:", coverImageUrl);
    console.log("👶 Child URL:", childImageUrl);

    // Call your Python API with URLs directly
    const pythonApiUrl = "http://72.60.193.120:5000/api/face-swap";

    const pythonRequest = {
      cover_image_url: coverImageUrl,  // Use the cover URL from Flutter app
      child_image_url: childImageUrl,
      prompt: prompt,
      user_id: userId,
      book_id: bookId,
      child_name: childName
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

    // Extract the processed image from Python API response
    const processedImageBase64 = responseData.processed_image;
    if (!processedImageBase64) {
      console.error("❌ No processed_image in Python API response");
      return new Response(
        JSON.stringify({ error: "No processed image received from AI service" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the base64 image data directly for Flutter to handle
    // Flutter will convert this to bytes and display using Image.memory()
    
    // Return result to client in the format Flutter expects
    return new Response(
      JSON.stringify({
        success: true,
        generated_image_base64: processedImageBase64,
        generated_image_url: null, // No URL, using base64 instead
        message: "Image processed successfully"
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
