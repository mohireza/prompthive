import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  ConnectionLineType,
  Panel,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';
import { Container, Row } from 'react-bootstrap';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (treeNodes, treeEdges, direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  treeNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  treeEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = treeNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };

    return newNode;
  });
  console.log({ nodes: newNodes, edges: treeEdges })
  return { nodes: newNodes, edges: treeEdges };
};

const position = { x: 0, y: 0 };
const edgeType = 'smoothstep';


const LayoutFlow = ({initialNodes, initialEdges}) => {
    
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialNodes,
            initialEdges,
        );
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, [initialNodes, initialEdges])
    const onLayout = useCallback(
        (direction) => {
        const { nodes: layoutedNodes, edges: layoutedEdges } =
            getLayoutedElements(nodes, edges, direction);

        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
        },
        [nodes, edges],
    );

    return (
        <Container fluid className="p-0" style={{ height: '100vh' }}>
            <Row style={{ height: '100vh' }}>
                <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                style={{ height: '100vh' }}
                >
                    {nodes.length}
                    {initialNodes.length}
                    <Panel position="top-right">
                        <button onClick={() => onLayout('TB')}>vertical layout</button>
                        <button onClick={() => onLayout('LR')}>horizontal layout</button>
                    </Panel>
                </ReactFlow>
            </Row>
            
        </Container>
        
    );
};

export default LayoutFlow;
