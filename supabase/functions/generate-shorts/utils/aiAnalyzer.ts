
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.0";

/**
 * Analyze video content using Gemini AI to extract meaningful segments
 * @param videoInfo Video information object
 * @param model Gemini AI model instance
 * @returns Array of segment objects
 */
export async function analyzeVideoContent(videoInfo: any, model: any) {
  try {
    console.log(`Analyzing video content: ${videoInfo.title}`);
    
    // Create detailed prompt for Gemini to extract meaningful segments
    const prompt = `
      I have a video with the following details:
      - Title: "${videoInfo.title}"
      - Source: ${videoInfo.source}
      
      I need to extract the 3 most engaging segments from this video that would make great short-form content.
      
      For each segment, please provide:
      1. A catchy, click-worthy title that would engage viewers (maximum 60 characters)
      2. An estimated timestamp range in the format MM:SS-MM:SS (start-end)
      3. A brief compelling description that explains why this segment stands out (100-150 characters)
      4. A duration in seconds (between 30-60 seconds)
      
      The segments should be diverse and represent the most interesting parts of the video.
      Format your response as JSON with this structure:
      {
        "segments": [
          {
            "title": "string",
            "timestamp": "string",
            "description": "string",
            "duration_seconds": number
          }
        ]
      }
    `;

    // Call Gemini API for content analysis
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Raw Gemini response:", text);
    
    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    
    try {
      const parsedResponse = JSON.parse(jsonString);
      console.log("Successfully parsed response from Gemini");
      return parsedResponse.segments;
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini response:", parseError);
      console.log("Raw response:", text);
      
      // Fallback to extract segments if JSON parsing fails
      return extractSegmentsFromText(text, videoInfo.title);
    }
  } catch (error) {
    console.error("Error analyzing video content:", error);
    throw new Error(`Failed to analyze video content: ${error.message}`);
  }
}

/**
 * Fallback function to extract segments from text if JSON parsing fails
 * @param text Raw text from AI response
 * @param videoTitle Original video title
 * @returns Array of segment objects
 */
export function extractSegmentsFromText(text: string, videoTitle: string) {
  console.log("Using fallback segment extraction");
  
  const segments = [];
  const segmentMatches = text.split(/Segment \d+:|Short \d+:|Content \d+:/gi).filter(Boolean);
  
  for (let i = 0; i < Math.min(segmentMatches.length, 3); i++) {
    const segmentText = segmentMatches[i];
    
    // Extract title
    const titleMatch = segmentText.match(/Title:?\s*["']?(.*?)["']?(?:\n|$|\.|,)/i);
    const title = titleMatch ? titleMatch[1].trim() : `Highlight ${i+1}: ${videoTitle}`;
    
    // Extract timestamp
    const timestampMatch = segmentText.match(/Time(?:stamp)?:?\s*(\d+:\d+(?:-\d+:\d+)?)/i) || 
                          segmentText.match(/(\d+:\d+)\s*-\s*(\d+:\d+)/i);
    const timestamp = timestampMatch ? 
      (timestampMatch[2] ? `${timestampMatch[1]}-${timestampMatch[2]}` : timestampMatch[1]) : 
      `00:${String(i*30).padStart(2, '0')}-00:${String((i+1)*30).padStart(2, '0')}`;
    
    // Extract description
    const descMatch = segmentText.match(/Desc(?:ription)?:?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is);
    const description = descMatch ? descMatch[1].trim() : `Key highlight from ${videoTitle}`;
    
    // Extract duration
    const durationMatch = segmentText.match(/Duration:?\s*(\d+)/i);
    const duration_seconds = durationMatch ? parseInt(durationMatch[1]) : 30 + (i * 10);
    
    segments.push({
      title,
      timestamp,
      description,
      duration_seconds: Math.min(Math.max(duration_seconds, 30), 60) // Keep between 30-60 seconds
    });
  }
  
  // If no segments were found, create default ones
  if (segments.length === 0) {
    return [
      {
        title: `Top Highlight: ${videoTitle}`,
        timestamp: "00:10-00:45",
        description: "The most engaging moment from the beginning of the video",
        duration_seconds: 35
      },
      {
        title: `Key Insight: ${videoTitle}`,
        timestamp: "01:30-02:15",
        description: "Core content that viewers will find most valuable",
        duration_seconds: 45
      },
      {
        title: `Best Conclusion: ${videoTitle}`,
        timestamp: "03:00-03:45",
        description: "The perfect closing segment that summarizes key points",
        duration_seconds: 45
      }
    ];
  }
  
  return segments;
}
