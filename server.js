const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_CONN, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  });

// Define MongoDB schemas
const nodeSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  label: String,
  date: String,
});
  
const edgeSchema = new mongoose.Schema({
  source: { type: String, ref: 'Node' }, 
  target: { type: String, ref: 'Node' }, 
});

// Define MongoDB models
const Node = mongoose.model('nodes', nodeSchema);
const Edge = mongoose.model('edges', edgeSchema);

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Default route to render index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to get graph data
app.get('/api/graph', async (req, res) => {
  try {
    const nodes = await Node.find({});
    const edges = await Edge.find({});
    res.send({ nodes, edges });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to add a new user node and edge
app.post('/api/register', async (req, res) => {
  try {
    const { nodeId, nodeLabel, nodeTarget } = req.body;
    if (!nodeId || !nodeLabel || !nodeTarget) {
      return res.status(400).send('Missing required fields');
    }

    // Check if the target node exists
    const targetNode = await Node.findOne({ id: nodeTarget });
    if (!targetNode) {
      return res.status(400).send('Target node does not exist');
    }

    // Create new node
    const newNode = new Node({  
      id: nodeId,
      label: nodeLabel,
      date: getCurrentDate(),
    });
    await newNode.save();

    // Create new edge
    const newEdge = new Edge({
      source: nodeId,
      target: nodeTarget,
    });
    await newEdge.save();

    res.status(201).send('User node and edge added successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

function getCurrentDate() {
  const currentDate = new Date();
  return currentDate.toLocaleDateString('en-GB');
}
