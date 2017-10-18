import PiCi from './PiCi.js';
//Result/Goal
function autoGenera(nodeNum,edgeNum){//先node再edge
    let res = [];
    for(let i=0;i<nodeNum;i++){
        let temp = {};
        let data = temp.data = {};
        //Ascii => A => 65
        data.id = String.fromCharCode(65+i);
        data.width = (Math.random()*30)+20;
        data.text = "Text";
        data.textOpts = {
            fontFamily: 'Arial',
            fontSize: 36,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'], // gradient
            stroke: '#4a1850',
            strokeThickness: 5,
            wordWrap: true,
            wordWrapWidth: 440
        };
        //data.shape 默认为圆形
        if(i%2===0)data.color=0x66CCFF;
        res.push(temp);
    }
    for(let i=0;i<edgeNum;i++){
        let randomNode1 = Math.floor(Math.random()*nodeNum);
        let randomNode2 = Math.floor(Math.random()*nodeNum);
        //toFix => Node can arrow itself
        if(randomNode1 === randomNode2){
            if(randomNode1===1){
                randomNode1--;
            }else{
                randomNode2++;
            }
        };
        let temp = {};
        let data = temp.data = {};
        data.id = String.fromCharCode(65+nodeNum+i);
        data.source = res[randomNode1].data.id;
        data.target = res[randomNode2].data.id;
        if(i%2==0)data.curveStyle = 'bezier'
        if(i%2==0){
            data.targetShape='triangle';
            data.sourceShape='circle';
        }else{
            data.targetShape='circle';
            data.sourceShape='triangle';
        }
        res.push(temp);
    }
    return res;
}

PiCi({
    container: document.getElementById('cy'),
    elements: autoGenera(2,1)
    
})