import * as PIXI from "pixi.js";
//Encapsulation pixi
//export PiCi 

//Aliases
let Container = PIXI.Container,
    CanvasRenderer = PIXI.CanvasRenderer,//Fixed!! use Canvas force!!
    loader = PIXI.loader,
    TextureCache = PIXI.utils.TextureCache,
    Texture = PIXI.Texture,
    Sprite = PIXI.Sprite,
    Graphics = PIXI.Graphics;

let stage = new Container(),
    edgeContainer = new Container(),
    nodeContainer = new Container(),//节点在边之上
    dragContainer = new Container(),//拖拽的节点处于最高层级
    renderer = new CanvasRenderer(window.innerWidth, window.innerHeight, {
        // antialias: true,//这抗锯齿一开整个世界都变了  => use Canvas no Webgl!!!
        // forceFXAA: true,
        // transparent: false,
        // resolution: 1,
        backgroundColor: 0x1099bb
    });//Todo=> parameter
document.body.appendChild(renderer.view);

const SCALE_MAX = 24, SCALE_MIN = 0.1;//for scale limmit

//先试试分开保存，便于搜索，先这样吧
let nodeList = {},
    edgeList = {},//保存边引用
    edgeInfoList = {};//保存边信息

function setNode(graph, id) {
    //Then use that texture to create a new Sprite, and set that sprite as interactive
    //graph = new Sprite(graph.generateCanvasTexture());

    let onDragStart = function (event) {
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.data = event.data;
        //this.displayGroup = dragLayer;
        this.dragging = true;
    }

    let onDragEnd = function () {
        this.dragging = false;
        // set the interaction data to null
        this.data = null;
        //归位
        dragContainer.removeChild(this);
        nodeContainer.addChild(this);
        renderer.render(stage);
    }

    let onDragMove = function () {
        if (this.dragging) {
            var newPosition = this.data.getLocalPosition(this.parent);
            this.x = newPosition.x;
            this.y = newPosition.y;
            updateEdge(id, newPosition);//闭包的缘故，id是能访问得到的
            nodeContainer.removeChild(this);
            dragContainer.addChild(this);
            renderer.render(stage);
        }
    }

    let drawNewEdge = function (element, targetFlag, newPos) {
        let oldLine = edgeList[element];//在线的引用保存对象里找到线
        edgeContainer.removeChild(oldLine);//删除线重新画
        let line = new Graphics();
        line.lineStyle(4, 0xFFFFFF, 1);
        //target位置变了，但是source位置没有变
        let sourcePos = nodeList[edgeInfoList[element].source],//边的起点
            targetPos = nodeList[edgeInfoList[element].target];//边的终点
        if (targetFlag) {
            line.moveTo(sourcePos.x, sourcePos.y);
            //line.lineTo(newPos.x, newPos.y);
            line.quadraticCurveTo((sourcePos.x + newPos.x) / 2, (sourcePos.y + newPos.y) / 2 + 100, newPos.x, newPos.y);
            //保存修改了的target Node坐标
            targetPos.x = newPos.x;
            targetPos.y = newPos.y;
        } else {
            line.moveTo(newPos.x, newPos.y);
            //line.lineTo(targetPos.x, targetPos.y);
            line.quadraticCurveTo((newPos.x + targetPos.x) / 2, (newPos.y + targetPos.y) / 2 + 100, targetPos.x, targetPos.y);
            //保存修改了的source Node坐标
            sourcePos.x = newPos.x;
            sourcePos.y = newPos.y;
        }
        edgeList[element] = line;//保存边引用
        edgeContainer.addChild(line);
    }

    let updateEdge = function (id, newPos) {
        for (let element in edgeInfoList) {
            if (edgeInfoList[element].target === id) {
                drawNewEdge(element, true, newPos);
            } else if (edgeInfoList[element].source === id) {
                drawNewEdge(element, false, newPos);
            }
        };
    }

    graph.interactive = true;
    // this button mode will mean the hand cursor appears when you roll over the bunny with your mouse
    graph.buttonMode = true;
    //to ckeck

    graph
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);

    return graph;
}
let testOrder = true; 
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
                if ((nodeList[id] != undefined) || edgeList[id] != undefined) {
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
                let source = nodeList[data.source];
                let target = nodeList[data.target];
                let line = new Graphics();
                line.lineStyle(4, 0xFFFFFF, 1);
                line.moveTo(source.x, source.y);

                line.quadraticCurveTo((source.x + target.x) / 2, (source.y + target.y) / 2 + 100, target.x, target.y);
                
                //zOrder
                //line.displayGroup = edgeLayer;
                
                edgeList[data.id] = line;//保存边引用

                edgeContainer.addChild(line);

            } else {
                //add node to nodeList
                nodeList[data.id] = data;
                //Draw node
                let circle = new Graphics();
                testOrder = !testOrder;
                if(testOrder){
                    circle.beginFill(0x66CCFF);
                }else{
                    circle.beginFill(0x000000);
                }
                
                circle.drawCircle(0, 0, 32);
                circle.endFill();
                circle = setNode(circle, data.id);

                // move the sprite to its designated position
                circle.x = data.x;
                circle.y = data.y;

                //zOrder
                //circle.displayGroup = nodeLayer;

                nodeContainer.addChild(circle);
            }
        }
    }
    stage.addChild(edgeContainer);
    stage.addChild(nodeContainer);
    stage.addChild(dragContainer);
    //Render the stage
    renderer.render(stage);
}


// Scale/Zoom
renderer.view.addEventListener('wheel', function (e) {
    if (e.deltaY < 0) {
        zooming(true, e.pageX, e.pageY);
    } else {
        zooming(false, e.pageX, e.pageY);
    }
});

function zooming(zoomFlag, x, y) {
    //Current scale    
    let scale = stage.scale.x;
    //Mouse position    
    let mouse = new PIXI.Point(x, y);
    //Mouse position relative to Container    
    let point = stage.toLocal(mouse);//same   maybe dont need this change
    //zooming    
    if (zoomFlag) {
        if (scale < SCALE_MAX) {
            scale += 0.1;
            //moving      
            stage.position.set(-(point.x * (scale - 1)), -(point.y * (scale - 1)))
        }
    } else {
        if (scale > SCALE_MIN) {
            scale -= 0.1;
            //moving            
            stage.position.set(-(point.x * (scale - 1)), -(point.y * (scale - 1)))
        }
    }
    stage.scale.set(scale, scale);
    //renderer.clear();
    renderer.render(stage);
}


export default PiCi;


