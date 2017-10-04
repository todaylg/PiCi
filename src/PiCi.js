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
    renderer = autoDetectRenderer(window.innerWidth, window.innerHeight, { backgroundColor: 0x1099bb });//Todo=> parameter
document.body.appendChild(renderer.view);

const SCALE_MAX = 4, SCALE_MIN = 0.1;//for scale limmit

//先试试分开保存，便于搜索，先这样吧
let nodeList = {},
    edgeList = {},//保存边引用
    edgeInfoList = {};//保存边信息

function setEdge(line, souPos, tarPos) {
    //还有必要转换为sprite吗？=> 有，线虽然没有交互效果，但是有选中的效果=>这个效果好像不需要一定是sprite吧，事件触发不行吗？
    //线先不转为sprite => 不转线失真啊。。
    line = new Sprite(line.generateCanvasTexture());
    // 谁小按谁算，反正变成sprite之后没有区分指向的必要了
    // 否则线的位置会莫名其妙乱掉
    // 现在换成曲线之后又乱了
    if (souPos.x > tarPos.x) {
        line.x = tarPos.x;
    } else {
        line.x = souPos.x;
    }
    if (souPos.y > tarPos.y) {
        line.y = tarPos.y;
    } else {
        line.y = souPos.y;
    }
    return line;
}

function setNode(graph, id) {

    //Then use that texture to create a new Sprite, and set that sprite as interactive
    graph = new Sprite(graph.generateCanvasTexture());

    let onDragStart = function (event) {
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.data = event.data;
        this.dragging = true;
    }

    let onDragEnd = function () {
        this.dragging = false;
        // set the interaction data to null
        this.data = null;
    }

    let onDragMove = function () {
        if (this.dragging) {
            var newPosition = this.data.getLocalPosition(this.parent);
            this.x = newPosition.x;
            this.y = newPosition.y;
            updateEdge(id, newPosition);//闭包的缘故，id能访问得到
            renderer.render(stage);
        }
    }

    let drawNewEdge = function (element, targetFlag, newPos) {
        let oldLine = edgeList[element];//在线的引用保存对象里找到线
        stage.removeChild(oldLine);//删除线重新画
        let line = new Graphics();
        line.lineStyle(4, 0xFFFFFF, 1);
        //target位置变了，但是source位置没有变
        let sourcePos = nodeList[edgeInfoList[element].source],//边的起点
            targetPos = nodeList[edgeInfoList[element].target];//边的终点
        if (targetFlag) {
            line.moveTo(sourcePos.x, sourcePos.y);
            //line.lineTo(newPos.x, newPos.y);
            line.quadraticCurveTo((sourcePos.x + newPos.x) / 2, (sourcePos.y + newPos.y) / 2 + 100, newPos.x, newPos.y);
            line = setEdge(line, sourcePos, newPos);
            // line = new Sprite(line.generateCanvasTexture());
            // line.x = sourcePos.x;
            // line.y = sourcePos.y;

            //保存修改了的target Node坐标
            targetPos.x = newPos.x;
            targetPos.y = newPos.y;
        } else {
            line.moveTo(newPos.x, newPos.y);
            //line.lineTo(targetPos.x, targetPos.y);
            line.quadraticCurveTo((newPos.x + targetPos.x) / 2, (newPos.y + targetPos.y) / 2 + 100, targetPos.x, targetPos.y);
            line = setEdge(line, newPos, targetPos);

            //保存修改了的source Node坐标
            sourcePos.x = newPos.x;
            sourcePos.y = newPos.y;
        }
        edgeList[element] = line;//保存边引用，免得重复画线=>好像必须重复画，再转为精灵=>便于删除吧
        stage.addChild(line);
    }

    //Bug => 为啥负角度就崩了？？？ 好像是还需要判断谁大谁小，因为好像差值不能为负数
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
    graph.anchor.set(0.5);

    graph
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);


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
                nodeList[data.id] = data;
                let source = nodeList[data.source];
                let target = nodeList[data.target];
                let line = new Graphics();
                line.lineStyle(4, 0xFFFFFF, 1);
                line.moveTo(source.x, source.y);

                line.quadraticCurveTo((source.x + target.x) / 2, (source.y + target.y) / 2 + 100, target.x, target.y);
                //line.lineTo(target.x, target.y);//要获取长度信息
                line = setEdge(line, source, target);

                //有点莫名其妙
                // line = new Sprite(line.generateCanvasTexture());
                // line.x = source.x;
                // line.y = source.y;//居然不行🚫  ???? =>也是行的,但是因为区分source和target，所以转换为sprite后重新赋值坐标得谁小按谁算（sprite生成后按照形状放在左上角）
                // console.log("Line:")
                // console.log(line.x)
                // console.log(line.y)

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
                circle = setNode(circle, data.id);

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


//Scale 
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
            stage.position.set(-(point.x * (scale-1)), -(point.y * (scale-1)))
        }
    } else {
        if (scale > SCALE_MIN) {
            scale -= 0.1;
            //moving            
            stage.position.set(-(point.x * (scale-1)), -(point.y * (scale-1)))
        }
    }
    stage.scale.set(scale, scale);
    renderer.render(stage);
}


export default PiCi;


