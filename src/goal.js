import PiCi from './PiCi.js';
//Result/Goal
PiCi({
    container: document.getElementById('cy'),
    elements: [//先node再edge
        { data: { id: 'a', x: 342, y: 42 } },
        { data: { id: 'b', x: 212, y: 312 } },
        {
            data: {
                id: 'ab',
                source: 'a',
                target: 'b',
                targetShape: 'triangle',
                sourceShape: 'circle',
            }
        }],
    // style: [
    //     {
    //         selector: 'node',
    //         style: {
    //             shape: 'hexagon',
    //             'background-color': 'red',
    //             label: 'data(id)'
    //         }
    //     },
    //     {
    //         selector: 'edge',
    //         style: {
    //             'target-arrow-shape': 'triangle',
    //             'source-arrow-shape': 'circle',
    //             'curve-style': 'bezier',
    //             'opacity': 0.666,
    //         }
    //     }
    // ]
})