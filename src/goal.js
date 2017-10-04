import PiCi from './PiCi.js';
//Result/Goal
PiCi({
    container: document.getElementById('cy'),
    elements: [
        { data: { id: 'a',x:642,y:442 } },
        { data: { id: 'b',x:212,y:312 } },
        {
            data: {
                id: 'ab',
                source: 'a',
                target: 'b'
            }
        }],
    style: [
        {
            selector: 'node',
            style: {
                shape: 'hexagon',
                'background-color': 'red',
                label: 'data(id)'
            }
        },
        {
            selector: 'edge',
            style: {
                'target-arrow-shape': 'triangle',
                'source-arrow-shape': 'circle',
                'curve-style': 'bezier',
                'opacity': 0.666,
            }
        }
    ]
})