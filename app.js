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

  // try {
  //   const completion = await openai.chat.completions.create({
  //     messages: [{ role: 'user', content: text}, {role: 'system', content: "you are an esteemed mathematics professor teaching an undergrad student, all responses must give an example and an explanation of the example (go through the example with the student). do not use any latex in the explanation, just use plaintext. use latex for the examples. before writing any examples type the word 'examples'. stay under 200 words."}], // without the 200 words is also a strong prompt!
  //     model: 'gpt-4o',
  //   });

  //   const generatedText = completion.choices[0].message.content;

    // var splitText = splitTextIntoPairs(generatedText);
    // console.log(splitText);

    var generatedText = `Certainly! Let's talk about the concept of span in the context of linear algebra.

    Definition: The span of a set of vectors is the collection of all possible linear combinations of those vectors. In simpler terms, it's all the ways you can add and scale the given vectors.
    Example and Explanation
    
    Suppose we have two vectors in two-dimensional space: [ \\mathbf{v}_1 = \\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix} ] [ \\mathbf{v}_2 = \\begin{pmatrix} 3 \\\\ 4 \\end{pmatrix} ]
    
    The span of these vectors, denoted as span((\\mathbf{v}_1, \\mathbf{v}_2)), includes all vectors (\\mathbf{w}) that can be written as: [ \\mathbf{w} = c_1 \\mathbf{v}_1 + c_2 \\mathbf{v}_2 ] where (c_1) and (c_2) are any real numbers.
    
    For instance, let's take (c_1 = 1) and (c_2 = -1). The resulting vector is: [ \\mathbf{w} = 1 \\cdot \\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix} + (-1) \\cdot \\begin{pmatrix} 3 \\\\ 4 \\end{pmatrix} = \\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix} - \\begin{pmatrix} 3 \\\\ 4 \\end{pmatrix} = \\begin{pmatrix} -2 \\\\ -2 \\end{pmatrix} ]
    
    This vector (\\begin{pmatrix} -2 \\\\ -2 \\end{pmatrix}) is part of the span((\\mathbf{v}_1, \\mathbf{v}_2)).
    
    If you change the coefficients (c_1) and (c_2), you'll get different vectors, but all those vectors lie within the same plane formed by (\\mathbf{v}_1) and (\\mathbf{v}_2).
    Conclusion
    
    So, the span of (\\mathbf{v}_1) and (\\mathbf{v}_2) is the entire 2D plane because any vector in that plane can be expressed as a combination of (\\mathbf{v}_1) and (\\mathbf{v}_2).
    `;
    
    var splitText = splitTextIntoPairs(generatedText);
    console.log(splitText);


    // const mp3 = await openai.audio.speech.create({
    //   model: 'tts-1',
    //   voice: 'fable',
    //   input: generatedText,
    // });

    // // Write the MP3 file
    // const mp3Buffer = Buffer.from(await mp3.arrayBuffer());
    // await fs.promises.writeFile(speechFilePath, mp3Buffer);

    // // Encode the MP3 file to Base64
    // const mp3Base64 = await encodeMP3();

    // console.log(generatedText);

    // // Send both the generated text and the Base64-encoded MP3 as response
    // res.json({ generatedText, mp3: mp3Base64 });
  // } catch (error) {
  //   console.error('Error fetching response from OpenAI API:', error);
  //   res.status(500).json({ error: 'Internal Server Error' });
  // }
});

function splitTextIntoPairs(text) {
  // Find the index where "Examples" appears
  const examplesIndex = text.indexOf("Examples");
  
  // Extract the opening remarks separately
  const openingRemarks = text.substring(0, examplesIndex);
  
  // Remove the opening remarks from the text
  text = text.substring(examplesIndex);

  const regex = /\s*([^()]+?)\s*((?:\([^()]+\))|(?:\[[^\[\]]+\]))/g; // Regular expression to match example-commentary pairs
  let pairs = [];
  let match;

  // Iterate over matches in the text
  while ((match = regex.exec(text)) !== null) {
      let commentary = match[1].trim(); // Commentary text
      let example = match[2].trim(); // Example text
      
      // Push the example-commentary pair as an object into the pairs array
      pairs.push({ commentary, example });
  }

  return { openingRemarks, pairs };
}

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
