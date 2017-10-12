import PiCi from './PiCi.js';
//Result/Goal
PiCi({
    container: document.getElementById('cy'),
    elements: [//先node再edge
        { data: { id: 'a', width:40,color:"0x000000"} },
        { data: { id: 'b'} },
        { data: { id: 'c',width:60,color:"0x000000"} },
        { data: { id: 'd'} },
        { data: { id: 'e', width:80,color:"0x000000"} },
        { data: { id: 'f'} },
        {
            data: {
                id: 'ab',
                source: 'a',
                target: 'b',
                curveStyle: 'bezier',
                targetShape: 'triangle',
                sourceShape: 'circle',
            }
        },
        {
            data: {
                id: 'abc',
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
        {
            data: {
                id: 'ad',
                source: 'a',
                target: 'd',
                curveStyle: 'bezier',
                targetShape: 'triangle',
                sourceShape: 'circle',
            }
        },
        {
            data: {
                id: 'bf',
                source: 'b',
                target: 'f',
                curveStyle: 'bezier',
                targetShape: 'triangle',
                sourceShape: 'circle',
            }
        },
        {
            data: {
                id: 'be',
                source: 'b',
                target: 'e',
                curveStyle: 'bezier',
                targetShape: 'triangle',
                sourceShape: 'circle',
            }
        },
        {
            data: {
                id: 'af',
                source: 'a',
                target: 'f',
                curveStyle: 'bezier',
                targetShape: 'triangle',
                sourceShape: 'circle',
            }
        },
    ],
    
})