var nodes = [
  { id: "grembim", label: "Planted the first tree 🌲", date: "26/02/2024" }
];

var edges = [
  { source: "grembim", target: "grembim" }
];

// Add Node Form
var addNodeForm = document.getElementById("add-node-form");

addNodeForm.addEventListener("submit", function(event) {
  event.preventDefault();
  
  var nodeId = document.getElementById("node-id").value;
  var nodeLabel = document.getElementById("node-label").value;
  var nodeTarget = document.getElementById("node-target").value;
  
  // Send data to backend
  fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nodeId: nodeId,
      nodeLabel: nodeLabel,
      nodeTarget: nodeTarget,
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to add node. Please try again.');
    }
    return response.text();
  })
  .then(message => {
    console.log(message);
    alert('Node added successfully!');
    loadGraphData(); // Update graph after adding a new node
    addNodeForm.reset(); // Clear form fields
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Failed to add node. Please try again.');
  });
});

// Function to load nodes and edges from the database
function loadGraphData() {
  fetch('/api/graph')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch graph data');
      }
      return response.json();
    })
    .then(data => {
      // Update nodes and edges arrays
      nodes = data.nodes;
      edges = data.edges;
      // Update the graph
      updateGraph();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to load graph data. Please try again.');
    });
}

// Function to restrict tree by vertical and horizontal boundaries
function restrictTreeBoundaries() {
  const svgWidth = svg.node().getBoundingClientRect().width;
  const svgHeight = svg.node().getBoundingClientRect().height;

  nodes.forEach(node => {
    node.x = Math.max(20, Math.min(svgWidth - 20, node.x));
    node.y = Math.max(20, Math.min(svgHeight - 20, node.y));
  });
}

// Function to update graph height if the number of nodes exceeds 500
function updateGraphHeight() {
  const graphContainer = document.getElementById("graph-container");
  if (nodes.length > 500) {
    graphContainer.style.height = "1600px"; // Increase height
  } else {
    graphContainer.style.height = "1200px"; // Reset height
  }
}

function updateGraph() {
  // Clear previous SVG content
  d3.select("svg").remove();

  // Set up SVG container
  const svg = d3.select("#graph-container")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%");

  // Implement force-directed layout
  simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(edges).id((d) => d.id))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(svg.node().getBoundingClientRect().width / 2, svg.node().getBoundingClientRect().height / 2));

  // Draw nodes with text labels
nodeElements = svg.append("g")
  .selectAll("g")
  .data(nodes)
  .enter()
  .append("g")
  .attr("class", "node-group")
  .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

nodeElements.append("circle")
  .attr("r", 12)
  .attr("fill", "green")
  .attr("stroke", "black");

nodeElements.append("text")
  .attr("dx", 16) 
  .attr("dy", ".35em") 
  .text(d => d.id);
  

  // Draw edges
  edgeElements = svg.append("g")
    .selectAll("line")
    .data(edges)
    .enter()
    .append("line")
    .attr("stroke", "lime")
    .attr("stroke-width", 2);

  // Display Node Information
  nodeElements.on("click", (event, d) => {
    alert(`Node ID: ${d.id} \nNode Label: ${d.label} \nCreated at: ${d.date}`);
  });

  // Implement Node Movement
  nodeElements.call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

  // Handle node dragging
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.5).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    d.fx = null;
    d.fy = null;
    simulation.alphaTarget(0);
  }

  // Update positions on simulation tick
  simulation.on("tick", () => {
    nodeElements.attr("transform", d => `translate(${d.x},${d.y})`);

    nodeElements
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);

    edgeElements
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
  });
}

// Initial graph update
loadGraphData();