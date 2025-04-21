import React, { useEffect, useRef, useState } from 'react';
import LayoutFlow from "./LayoutFlow"
import { promptHintLibraryService } from '../../services/promptHintLibraryService';
import { Card, Container, Row, Col, InputGroup, Form,  Button} from 'react-bootstrap';
import NavHeader from '../Header/NavHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function PromptTreeVisualiser() {    
    
    const [sheetId, setSheetId] = useState("");
    const [sheetLink, setSheetLink] = useState("");

    const position = { x: 0, y: 0 };
    const edgeType = 'smoothstep';


    const [treeNodes, setTreeNodes] = useState([]);
    const [treeEdges, setTreeEdges] = useState([]);

    const extractSheetIdFromLink = (link) => {
        const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
        const match = link.match(regex);
        return match ? match[1] : null;
      };

    useEffect(() => {
        const sheetIdFromLink = extractSheetIdFromLink(sheetLink);
        if (sheetIdFromLink) {
          setSheetId(sheetIdFromLink);
        }
      }, [sheetLink]);

    const extractNodeData = (node, nodes, edges) => {
        //const newNode = {...(node.data)};
        const newNode = { id: node.data.id };
        newNode.data = { label: newNode.id };
        newNode.position = position
        nodes.push(newNode);
        node.children.forEach(childNode => {
            edges.push({
                id: `e${node.data.id}-${childNode.data.id}`,
                source: node.data.id,
                target: childNode.data.id,
                type: 'smoothstep',
                animated: true
            })
            extractNodeData(childNode, nodes, edges);
        })
    }

    const tranformTreeData = (treeData) => {
        const nodes = [];
        const edges = [];
        treeData.forEach(node => {
            extractNodeData(node, nodes, edges);
        })
        return { nodes, edges };
    }

    const fetchAndTransformPromptHintTree = async () => {
        const response = await promptHintLibraryService.visualisePromptLibraryTree(sheetId);
        if(response.status === 200){
            const { nodes, edges } = tranformTreeData(response.data);
            console.log(JSON.stringify(nodes));
            console.log(JSON.stringify(edges));
            setTreeEdges(edges);
            setTreeNodes(nodes);
        }
    }


    useEffect(() => {
        fetchAndTransformPromptHintTree();
    }, [sheetId])



    return <Container fluid className="p-0">
            <NavHeader/>
            <Row>
                <Col>
                    <Card.Header className="d-flex problems-card-header align-items-center">
                        <InputGroup>
                            <Form.Control
                            className="text-truncate"
                            placeholder="Paste OATutor Google Sheet link here..."
                            aria-label="Paste OATutor Google Sheet link here..."
                            value={sheetLink}
                            onChange={(e) => setSheetLink(e.target.value)}
                            />
                            <Form.Check inline type="radio" label="visualize tree" name="mode select"/>
                            <Form.Check inline type="radio" label="trace prompt" name="mode select"/>
                        </InputGroup>
                        {/* <Button 
                            size="sm"
                            className="ms-2 mb-1"
                            variant="light"
                            onClick={fetchAndTransformPromptHintTree}>
                            <FontAwesomeIcon icon="fa-refresh"/>
                        </Button> */}
                    </Card.Header>
                </Col>
            </Row>
            <LayoutFlow initialNodes={treeNodes} initialEdges={treeEdges} />
        </Container>;
}

export default PromptTreeVisualiser;
