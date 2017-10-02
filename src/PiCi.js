import * as PIXI from "pixi.js";
//Encapsulation pixi
//export PiCi 

//Aliases
let Container = PIXI.Container,
    autoDetectRenderer = PIXI.autoDetectRenderer,
    loader = PIXI.loader,
    TextureCache = PIXI.utils.TextureCache,
    Texture = PIXI.Texture,
    Sprite = PIXI.Sprite,
    Graphics = PIXI.Graphics;

let stage = new Container(),
    renderer = autoDetectRenderer(window.innerWidth, window.innerHeight);//Todo=> parameter
document.body.appendChild(renderer.view);

//先试试分开保存，便于搜索，先这样吧
let nodeList = {},
    edgeList = {},//保存边引用
    edgeInfoList = {};//保存边信息

function setGraph(graph, lineFlag,id) {
    
    //Then use that texture to create a new Sprite, and set that sprite as interactive
    graph = new Sprite(graph.generateCanvasTexture());

    let onDragStart = function(event) {
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.data = event.data;
        this.dragging = true;
    }

    let onDragEnd = function() {
        this.dragging = false;
        // set the interaction data to null
        this.data = null;
    }

    let onDragMove = function() {
        if (this.dragging) {
            var newPosition = this.data.getLocalPosition(this.parent);
            this.x = newPosition.x;
            this.y = newPosition.y;
            updateEdge(id,newPosition);
            renderer.render(stage);
        }
    }
    //Bug => 为啥负角度就崩了？？？
    let updateEdge = function(id,newPos){
        for(let element in edgeInfoList) {
            if(edgeInfoList[element].target === id){
                let oldLine = edgeList[element];//在线的引用保存对象里找到线
                stage.removeChild(oldLine);//删除线重新画
                let line = new Graphics();
                line.lineStyle(4, 0xFFFFFF, 1);
                //target位置变了，但是source位置没有变
                let sourcePos = nodeList[edgeInfoList[element].source],//边的起点
                targetPos = nodeList[edgeInfoList[element].target];//边的终点

                line.moveTo(sourcePos.x, sourcePos.y);
                line.lineTo(newPos.x, newPos.y);

                //还有必要转换为sprite吗？=> 有，线虽然没有交互效果，但是有选中的效果
                line = setGraph(line, true);
                // move the sprite to its designated position
                line.x = sourcePos.x;
                line.y = sourcePos.y;

                edgeList[element] = line;//保存边引用，免得重复画线=>好像必须重复画，再转为精灵=>便于删除吧

                //保存修改了的target Node坐标
                targetPos.x = newPos.x;
                targetPos.y = newPos.y;

                stage.addChild(line);
            }else if(edgeInfoList[element].source === id){

                let oldLine = edgeList[element];//在线的引用保存对象里找到线
                stage.removeChild(oldLine);//在删除线重新画
                let line = new Graphics();
                line.lineStyle(4, 0xFFFFFF, 1);

                //source位置变了，但是target位置没有变
                let sourcePos = nodeList[edgeInfoList[element].source],
                targetPos = nodeList[edgeInfoList[element].target];

                line.moveTo(newPos.x, newPos.y);
                line.lineTo(targetPos.x, targetPos.y);

                //还有必要转换为sprite吗？=> 有，线虽然没有交互效果，但是有选中的效果
                line = setGraph(line, true);
                // move the sprite to its designated position
                line.x = newPos.x;
                line.y = newPos.y;

                edgeList[element] = line;//保存边引用，免得重复画线=>好像必须重复画，再转为精灵=>便于删除吧

                //保存修改了的target Node坐标
                sourcePos.x = newPos.x;
                sourcePos.y = newPos.y;

                stage.addChild(line);
            }
        };
    }

    if (!lineFlag) {//node can move only
        graph.interactive = true;
        // this button mode will mean the hand cursor appears when you roll over the bunny with your mouse
        graph.buttonMode = true;
        //to ckeck
        graph.anchor.set(0.5);

        graph
            .on('pointerdown', onDragStart)
            .on('pointerup', onDragEnd)
            .on('pointerupoutside', onDragEnd)
            .on('pointermove', onDragMove);
       
    } else {//edge

    }
    return graph;
}

function PiCi(opts) {
    opts = Object.assign({}, opts);


    //extrac nodes/edges information form opts
    let elements = opts.elements;

    if (!elements) {
        elements = [];
    } else if (elements.length > 0) {
        for (let i = 0, l = elements.length; i < l; i++) {
            let data = elements[i].data,
                id = data.id;

            //Simple check
            if (data == null) {
                data = {};
            }
            if (id == null) {//id is neccesary
                //check whether id is already exists
                if ((nodeList[id] != undefined)||edgeList[id] != undefined) {
                    console.error("id已存在");
                    break;
                } else {
                    console.error("id是必须参数");
                    break;
                }

            }

            if (data.source && data.target) {
                //add edge to edgeList
                edgeInfoList[data.id] = data;
                //Draw edge
                nodeList[data.id] = data;
                let source = nodeList[data.source];
                let target = nodeList[data.target];
                let line = new Graphics();
                line.lineStyle(4, 0xFFFFFF, 1);
                line.moveTo(source.x, source.y);
                line.lineTo(target.x, target.y);

                //还有必要转换为sprite吗？=> 有，线虽然没有交互效果，但是有选中的效果=>这个效果好像不需要一定是sprite吧，事件触发不行吗？
                //线先不转为sprite
                // line = setGraph(line, true);
                // // move the sprite to its designated position
                // line.x = source.x;
                // line.y = source.y;

                edgeList[data.id] = line;//保存边引用，免得重复画线=>好像必须重复画，再转为精灵=>便于删除吧

                stage.addChild(line);
            } else {
                //add node to nodeList
                nodeList[data.id] = data;
                //Draw node
                let circle = new Graphics();
                circle.beginFill(0x66CCFF);
                circle.drawCircle(0, 0, 32);
                circle.endFill();
                circle = setGraph(circle, false,data.id);

                // move the sprite to its designated position
                circle.x = data.x;
                circle.y = data.y;
                stage.addChild(circle);
            }
        }
    }
    //Render the stage
    renderer.render(stage);
}

export default PiCi;