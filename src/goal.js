import PiCi from './PiCi.js';
//Result/Goal
PiCi({
    container: document.getElementById('cy'),
    elements: [//先node再edge
        { data: { id: 'a', x: 342, y: 42 ,width:40} },
        { data: { id: 'b', x: 212, y: 312 } },
        { data: { id: 'c', x: 242, y: 642 ,width:60} },
        { data: { id: 'd', x: 112, y: 112 } },
        {
            data: {
                id: 'ab',
                source: 'a',
                target: 'b',
                
                targetShape: 'triangle',
                sourceShape: 'circle',
            }
        },
        {
            data: {
                id: 'cd',
                source: 'c',
                target: 'd',
                curveStyle: 'bezier',
                targetShape: 'triangle',
                sourceShape: 'circle',
            }
        },
        {
            data: {
                id: 'bc',
                source: 'b',
                target: 'c',
                targetShape: 'triangle',
                sourceShape: 'circle',
            }
        },
    ],
    //TODO:
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