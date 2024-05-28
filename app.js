require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json()); // Add this line to parse JSON bodies

// Initialize OpenAI instance with your API key
const openai = new OpenAI(process.env.OPENAI_API_KEY);

const speechFilePath = path.resolve('./speech.mp3');

// Function to read and encode the MP3 file
async function encodeMP3() {
  try {
    const mp3Buffer = await fs.promises.readFile(speechFilePath);
    return mp3Buffer.toString('base64');
  } catch (error) {
    console.error('Error reading MP3 file:', error);
    throw error;
  }
}

function splitResponse(text) {
  var parsedText = {}

  var currentString = "";
  var example = false;
  var fileNumber = 1;
  // tmp = "1": ['currentString', 'example']

  // Loop through the string
  for(i = 0;i < text.length; i++) {
    // Start of an example
    if(text[i] == '¬' && example == false) {
      parsedText[fileNumber] = [currentString, "commentary"];
      fileNumber++;
      example = true;
      currentString = "";
    } 
    // end of an example
    else if (text[i] == '¬' && example == true) {
      parsedText[fileNumber] = [currentString, "example"];
      fileNumber++;
      example = false;
      currentString = "";
    }
    // Not a delimiter 
    else {
      currentString += text[i];
    }
  }

  return parsedText;
}

async function generateCommentaryMP3s(splitText) {
  const mp3Files = [];

  for (const key in splitText) {
    const [commentaryText, sectionType] = splitText[key];
    if (sectionType === "commentary") {
      try {
        const mp3Response = await openai.audio.speech.create({
          model: 'tts-1',
          voice: 'fable',
          input: commentaryText,
        });
      
        const buffer = Buffer.from(await mp3Response.arrayBuffer());
        const base64Audio = Buffer.from(buffer).toString('base64');
        mp3Files.push(base64Audio);
      } catch (error) {
        console.error("Error generating TTS for commentary", key, ":", error);
      }
    }
  }
  return mp3Files;
}

app.post('/generate-text', async (req, res) => {
  const { text } = req.body;
  console.log("input:", text);

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: text}, {role: 'system', content: "you are an esteemed mathematics professor teaching an undergrad student. You must respond in a example, explanation format where examples are wrapped in ¬. Examples are solely latex, and therefore every latex string is wrapped with ¬. keep under 30 words."}],
      model: 'gpt-4o',
    });

    const generatedText = completion.choices[0].message.content;
    console.log(generatedText);
    const splitText = splitResponse(generatedText);
    console.log("splitText: \n", splitText);

    var speechStrings = await generateCommentaryMP3s(splitText);

    console.log("speechstrings", speechStrings);
    
    res.json({mp3Files: speechStrings, splitText, generatedText });
  } catch (error) {
    console.error('Error fetching response from OpenAI API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
