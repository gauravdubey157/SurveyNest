require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');

// Initialize the Notion client with the integration token
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Initialize Express
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

const databaseId = process.env.NOTION_DATABASE_ID;

// Function to add a survey response to the Notion database
async function addSurveyResponseToNotion(responseData) {
  // Initialize an object to hold the mapped properties
  const notionProperties = {};

  // Map survey response data to Notion properties
  for (const [key, value] of Object.entries(responseData)) {
    switch (key) {
      case 'Name':
        notionProperties['Name'] = {
          title: [{
            text: { content: value }
          }]
        };
        break;
      case 'Email':
        notionProperties['Email'] = {
          email: value
        };
        break;
      case 'Feedback':
        notionProperties['Feedback'] = {
          rich_text: [{ text: { content: value } }]
        };
        break;
      // Add cases for other property types as needed
    }
  }

  try {
    // Create a new page in the specified Notion database
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: notionProperties
    });
    console.log('Success! Entry added to Notion:', response);
    return response;
  } catch (error) {
    console.error('Error adding entry to Notion:', error);
    throw error;
  }
}

// Endpoint to receive the webhook from SurveySparrow
app.post('/survey-submission', async (req, res) => {
  console.log('Received survey submission:', JSON.stringify(req.body, null, 2));
  try {
    // Process the survey submission and add it to Notion
    const notionResponse = await addSurveyResponseToNotion(req.body);
    res.status(200).json({ message: 'Success', data: notionResponse });
  } catch (error) {
    // Handle errors, such as issues with the Notion API or the request format
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// Start the server on the specified port or 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
