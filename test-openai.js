import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Simple test to verify OpenAI connectivity
async function testOpenAI() {
  try {
    console.log("Testing OpenAI connection...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: "Hello, can you confirm you're working? Reply with just 'Yes, working.'"
        }
      ],
      max_tokens: 50,
      temperature: 0.1
    });

    console.log("OpenAI Response:", response.choices[0].message.content);
    
    // Test image analysis
    const imageBuffer = fs.readFileSync('attached_assets/Screenshot 2025-06-09 213247_1750088347258.png');
    const base64Image = imageBuffer.toString('base64');
    
    console.log("Testing image analysis...");
    
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "What text can you see in this prescription image? Just list the key elements briefly."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    });

    console.log("Vision Response:", visionResponse.choices[0].message.content);
    
  } catch (error) {
    console.error("OpenAI Test Error:", error.message);
  }
}

testOpenAI();