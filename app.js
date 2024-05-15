require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const fs = require('fs');
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

// Endpoint to generate chat completions
app.post('/generate-text', async (req, res) => {
  const { text } = req.body;
  console.log("input:", text);

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: text}, {role: 'system', content: 'you are an esteemed mathematics professor teaching an undergrad student, all responses must give an example and an explanation of the example (go through the example with the student). stay under 200 words'}], // without the 200 words is also a strong prompt!
      model: 'gpt-4o',
    });

    const generatedText = completion.choices[0].message.content;

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'fable',
      input: generatedText,
    });

    // Write the MP3 file
    const mp3Buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFilePath, mp3Buffer);

    // Encode the MP3 file to Base64
    const mp3Base64 = await encodeMP3();

    console.log(generatedText);

    // Send both the generated text and the Base64-encoded MP3 as response
    res.json({ generatedText, mp3: mp3Base64 });
  } catch (error) {
    console.error('Error fetching response from OpenAI API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
