import * as PIXI from "pixi.js";
//Encapsulation pixi => export PiCi 

//Aliases
let Container = PIXI.Container,
    Application = PIXI.Application,// Fixed!! use Canvas force!！
    Sprite = PIXI.Sprite,
    Graphics = PIXI.Graphics;

let renderer = new Application(window.innerWidth, window.innerHeight, {
        antialias: true,//这抗锯齿一开整个世界都变了  => use Canvas no Webgl!!!
        forceFXAA: true,//For WebglRender AA
        backgroundColor: 0x1099bb
    }),//Todo=> parameter
    stage = renderer.stage,
    edgeContainer = new Container(),
    arrowContainer = new Container(),
    nodeContainer = new Container(),//节点在边之上
    dragContainer = new Container();//拖拽的节点处于最高层级
    //Canvas(defalut is Webgl) Render test
    // renderer.renderer = new PIXI.CanvasRenderer(window.innerWidth, window.innerHeight, {
    //     backgroundColor: 0x1099bb
    // })

document.body.appendChild(renderer.view);

const SCALE_MAX = 24, SCALE_MIN = 0.1;//For scale limmit
let nodeWidth=30;//默认值
let point = {};//Todo 这里以后指针的形状也可以自定义
let movePosBegin = {};

//先试试分开保存，便于搜索，先这样吧
let nodeList = {},
    edgeList = {},//保存边引用
    arrowList = {},//保存箭头信息
    edgeInfoList = {};//保存边信息

let testOrder = true; //Use to test z-index

function PiCi(opts) {
    opts = Object.assign({}, opts);
    //Extrac nodes/edges information from opts
    let elements = opts.elements;
    if (!elements) elements = [];
    if (elements.length > 0) {
        for (let i = 0, l = elements.length; i < l; i++) {
            let data = elements[i].data,
                id = data.id;

            //Simple check
            if (data == null) data = {};
            if (id == null) {//Id is neccesary
                //Check whether id is already exists
                if ((nodeList[id] != undefined) || edgeList[id] != undefined) {
                    console.error("id已存在");
                    break;
                } else {
                    console.error("id是必须参数");
                    break;
                }
            }
            
            if (data.source && data.target) {
                //Save this edge's info
                edgeInfoList[data.id] = data;

                //Get position info
                let source = nodeList[data.source];
                let target = nodeList[data.target];
            
                let newSourcePos, newTargetPos;
                //别着急画线啊，先画箭头和椭圆(Arrow first)
                if (data.targetShape) {
                    //Todo => nodeWidth
                    newTargetPos = drawTargetShape(data.id, data.targetShape, source, target);
                }
                if (data.sourceShape) {
                    newSourcePos = drawSourceShape(data.id, data.sourceShape, source, target);
                }

                let tempSourcePos = newSourcePos ? newSourcePos : source;
                let tempTargetPos = newTargetPos ? newTargetPos : target;

                //Draw edge
                let line = new Graphics();
                line.lineStyle(4, 0xFFFFFF, 1);

                line.moveTo(tempSourcePos.x, tempSourcePos.y);
                //先直线版
                line.lineTo(tempTargetPos.x, tempTargetPos.y);
                //line.quadraticCurveTo((tempSourcePos.x + tempTargetPos.x) / 2, (tempSourcePos.y + tempTargetPos.y) / 2 + 100, tempTargetPos.x, tempTargetPos.y);
                
                edgeList[data.id] = line;//保存边引用

                edgeContainer.addChild(line);

            } else {
                //Add node to nodeList
                nodeList[data.id] = data;

                //Draw node
                let circle = new Graphics();

                //Test z-index   no use ----
                testOrder = !testOrder;
                if (testOrder) {
                    circle.beginFill(0x66CCFF);
                } else {
                    circle.beginFill(0x000000);
                }
                //-------
                let width = nodeWidth;
                if(data.width)width=data.width;
                circle.drawCircle(0, 0, width);
                circle.endFill();
                circle = setNode(circle, data.id);

                //Move the graph to its designated position
                //Todo => Node坐标随机分布
                circle.x = data.x;
                circle.y = data.y;
                
                nodeContainer.addChild(circle);
            }
        }
    }
    //层级顺序
    stage.addChild(edgeContainer);
    stage.addChild(arrowContainer);
    stage.addChild(nodeContainer);
    stage.addChild(dragContainer);
}

function setNode(graph, id) {

    let onDragStart = function (event) {
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        event.stopPropagation();
        this.data = event.data;
        this.dragging = true;
    }

    let onDragEnd = function () {
        this.dragging = false;
        // set the interaction data to null
        this.data = null;
        //归位
        dragContainer.removeChild(this);
        nodeContainer.addChild(this);
    }

    let onDragMove = function () {
        if (this.dragging) {
            let newPosition = this.data.getLocalPosition(this.parent);
            this.x = newPosition.x;
            this.y = newPosition.y;
            updateEdge(id, newPosition);//闭包的缘故，id是能访问得到的
            nodeContainer.removeChild(this);
            dragContainer.addChild(this);
        }
    }

    let updateEdge = function (id, newPos) {
        for (let element in edgeInfoList) {//一个节点可能连接着多根线
            if (edgeInfoList[element].target === id) {
                drawNewEdge(edgeInfoList[element], true, newPos);
            } else if (edgeInfoList[element].source === id) {
                drawNewEdge(edgeInfoList[element], false, newPos);
            }
        };
    }

    let drawNewEdge = function (element, targetFlag, newPos) {
        let oldLine = edgeList[element.id];//在线的引用保存对象里找到线
        edgeContainer.removeChild(oldLine);//删除线重新画

        //Get position info
        let sourcePos = targetFlag ? nodeList[element.source] : newPos,//起点（node坐标）
            targetPos = targetFlag ? newPos : nodeList[element.target];//终点（node坐标）

        let newSourcePos, newTargetPos;
        //别着急画线啊，先画箭头和椭圆
        if (element.targetShape) {
            newTargetPos = drawTargetShape(element.id, element.targetShape, sourcePos, targetPos, nodeWidth);
        }
        if (element.sourceShape) {
            newSourcePos = drawSourceShape(element.id, element.sourceShape, sourcePos, targetPos, nodeWidth);
        }

        let tempSourcePos = newSourcePos ? newSourcePos : sourcePos;
        let tempTargetPos = newTargetPos ? newTargetPos : targetPos;//todo 多余了其实

        //Draw edge
        let line = new Graphics();
        line.lineStyle(4, 0xFFFFFF, 1);
        line.moveTo(tempSourcePos.x, tempSourcePos.y);
        line.lineTo(tempTargetPos.x, tempTargetPos.y);

        //Save position change
        if (targetFlag) {
            //保存修改了的target Node坐标
            nodeList[element.target].x = newPos.x;
            nodeList[element.target].y = newPos.y;
        } else {
            //保存修改了的source Node坐标
            nodeList[element.source].x = newPos.x;
            nodeList[element.source].y = newPos.y;
        }

        edgeList[element.id] = line;//保存边引用
        edgeContainer.addChild(line);
    }

    graph.interactive = true;
    // this button mode will mean the hand cursor appears when you roll over the bunny with your mouse
    graph.buttonMode = true;
    graph
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);

    return graph;
}

function drawSourceShape(id, shape, sourcePos, targetPos) {
    let nodeRadius = nodeWidth;
    if(sourcePos.width)nodeRadius = sourcePos.width;
    //贴一起了就别显示啦
    if ((Math.abs(sourcePos.y - targetPos.y) < nodeRadius * 1.5) &&
        (Math.abs(sourcePos.x - targetPos.x) < nodeRadius * 1.5)) {
            nodeRadius = 0;
    }
    switch (shape) {
        case 'circle':
            let angle = Math.atan(Math.abs(sourcePos.y - targetPos.y) / Math.abs(sourcePos.x - targetPos.x))
            let circleWidth = nodeRadius / 2;
            //posX和posY就是circle的最终中心坐标
            let posX = (nodeRadius + circleWidth) * Math.cos(angle),
                posY = (nodeRadius + circleWidth) * Math.sin(angle);

            //分类讨论target和source的相对左右位置
            if (sourcePos.x > targetPos.x) {//source节点在右边
                posX = sourcePos.x - posX;
            } else {
                posX = sourcePos.x + posX;
            }
            if (sourcePos.y > targetPos.y) {//source节点在上边
                posY = sourcePos.y - posY;
            } else {
                posY = sourcePos.y + posY;
            }

            //Draw circle
            let circle = new Graphics();
            circle.beginFill(0x66CCFF);

            circle.drawCircle(0, 0, circleWidth);
            circle.endFill();

            circle.x = posX;
            circle.y = posY;

            if (!arrowList[id]) arrowList[id] = {};
            //remove oldArrow first
            if (arrowList[id].sourceArrow) arrowContainer.removeChild(arrowList[id].sourceArrow);
            //save newArrow
            arrowList[id].sourceArrow = circle;
            arrowContainer.addChild(circle);

            return {
                x: posX,
                y: posY
            }
    }
}

function drawTargetShape(id, shape, sourcePos, targetPos) {
    let nodeRadius = nodeWidth;
    if(targetPos.width)nodeRadius = targetPos.width;
    //贴一起了就别显示啦
    if ((Math.abs(sourcePos.y - targetPos.y) < nodeRadius * 1.5) &&
        (Math.abs(sourcePos.x - targetPos.x) < nodeRadius * 1.5)) {
            nodeRadius = 0;
    }
    switch (shape) {
        case 'triangle':
            //这个三角形默认按顶角为50°，两个底角为65°来算，两边长先按一半nodeWidth来算吧
            //先画出来再想抽象的事
            let topAngle = Math.PI / 180 * 50,//角度转弧度，注意Math的那些方法的单位是弧度
                sideEdge = nodeRadius,//瞅着合适，先凑合
                halfBottomEdge = Math.sin(topAngle / 2) * sideEdge,
                centerEdge = Math.cos(topAngle / 2) * sideEdge;
            //angle是一样的，先按node中心算，arrow中心算之后再说，先todo(直线版看出不这个问题，曲线就崩了)
            let angle = Math.atan(Math.abs(sourcePos.y - targetPos.y) / Math.abs(sourcePos.x - targetPos.x));
            let beginPosX = nodeRadius * Math.cos(angle),
                beginPosY = nodeRadius * Math.sin(angle),
                pos1X, pos1Y, pos2X, pos2Y,
                centerX = (nodeRadius + centerEdge) * Math.cos(angle),
                centerY = (nodeRadius + centerEdge) * Math.sin(angle);

            pos1X = pos2X = Math.sin(angle) * halfBottomEdge;
            pos1Y = pos2Y = Math.cos(angle) * halfBottomEdge;//简单的几何知识(手动抽搐😖)

            //还需要分类讨论target和source的左右位置的各种情况
            //1234代表target相对source所在象限
            if (sourcePos.x > targetPos.x) {//source节点在右
                if (sourcePos.y > targetPos.y) {//下 ----> 1
                    beginPosX = targetPos.x + beginPosX;
                    beginPosY = targetPos.y + beginPosY;

                    centerX = targetPos.x + centerX;
                    centerY = targetPos.y + centerY;

                    pos1X = centerX + pos1X;
                    pos1Y = centerY - pos1Y;//+ -

                    pos2X = centerX - pos2X;
                    pos2Y = centerY + pos2Y;//- +
                } else {//上 ----> 4
                    beginPosX = targetPos.x + beginPosX;
                    beginPosY = targetPos.y - beginPosY;

                    centerX = targetPos.x + centerX;
                    centerY = targetPos.y - centerY;

                    pos1X = centerX + pos1X;
                    pos1Y = centerY + pos1Y;//+ +

                    pos2X = centerX - pos2X;
                    pos2Y = centerY - pos2Y;//- -
                }

            } else {//source节点在左
                if (sourcePos.y > targetPos.y) {//下 ----> 2
                    beginPosX = targetPos.x - beginPosX;
                    beginPosY = targetPos.y + beginPosY;

                    centerX = targetPos.x - centerX;
                    centerY = targetPos.y + centerY;

                    pos1X = centerX - pos1X;
                    pos1Y = centerY - pos1Y;//- -

                    pos2X = centerX + pos2X;
                    pos2Y = centerY + pos2Y;//+ +
                } else {//上 ----> 3
                    beginPosX = targetPos.x - beginPosX;
                    beginPosY = targetPos.y - beginPosY;

                    centerX = targetPos.x - centerX;
                    centerY = targetPos.y - centerY;

                    pos1X = centerX - pos1X;
                    pos1Y = centerY + pos1Y;//- +

                    pos2X = centerX + pos2X;
                    pos2Y = centerY - pos2Y;//+ -
                }
            }

            //Draw triangle
            let triangle = new Graphics();

            triangle.beginFill(0x66CCFF);
            triangle.lineStyle(0, 0x66CCFF, 1);
            triangle.moveTo(beginPosX, beginPosY);
            triangle.lineTo(pos1X, pos1Y);
            triangle.lineTo(pos2X, pos2Y);
            triangle.endFill();

            if (!arrowList[id]) arrowList[id] = {};
            //remove oldArrow first
            if (arrowList[id].targetArrow) arrowContainer.removeChild(arrowList[id].targetArrow);
            //save newArrow
            arrowList[id].targetArrow = triangle;
            arrowContainer.addChild(triangle);

            return {
                x: centerX,
                y: centerY
            }
    }
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
    let point = toLocalPos(x, y);
    //Zooming    
    if (zoomFlag) {
        if (scale < SCALE_MAX) {
            scale += 0.1;
            //moving      
            stage.position.set(stage.x - (point.x * 0.1), stage.y - (point.y * 0.1))
        }
    } else {
        if (scale > SCALE_MIN) {
            scale -= 0.1;
            //moving
            stage.position.set(stage.x - (point.x * -0.1), stage.y - (point.y * -0.1))
        }
    }
    stage.scale.set(scale, scale);
}

function drawCircle(x, y, r = 30) {
    let circle = new Graphics();
    circle.beginFill(0x000000, 0.2);

    circle.drawCircle(0, 0, r);
    circle.endFill();
    let localPos = toLocalPos(x, y);
    circle.x = localPos.x;
    circle.y = localPos.y;
    point.circle = circle;
    dragContainer.addChild(circle);
}

// Drag/Move
let startMousePos = {};

stage.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);
stage.interactive = true;
stage.buttonMode = true;

stage.on('pointerdown', stagePointerDown)
     .on('pointerup', stagePointerUp)
     .on('pointerupoutside', stagePointerUp)
     .on('pointermove', stagePointerMove);

function stagePointerDown(event) {
    this.dragging = true;
    movePosBegin.x = stage.x;
    movePosBegin.y = stage.y;
    let newPosition = event.data.global;
    let x = newPosition.x;
    let y = newPosition.y;
    startMousePos.x = x; startMousePos.y = y;
    //Draw circle
    let r = 30 / stage.scale.x;
    drawCircle(x, y, r);
}

function stagePointerUp(event) {
    this.dragging = false;
    //Remove  circle
    if (point.circle) dragContainer.removeChild(point.circle);
}

function stagePointerMove(event) {
    if (this.dragging) {
        //Move  circle
        let newPosition = event.data.global;
        let x = newPosition.x;
        let y = newPosition.y;

        //Remove  circle first
        if (point.circle) dragContainer.removeChild(point.circle);
        //Redraw circle
        //Current scale    
        let scale = stage.scale.x;
        let r = 30 / scale;
        drawCircle(x, y, r);

        //需要注意这里的差值必须要拿global坐标来算而不是to stageLocalPos来算
        //因为stage.x/y按照的是global坐标来移动的
        let offsetX = x - startMousePos.x,//差值
            offsetY = y - startMousePos.y;

        stage.x = movePosBegin.x + offsetX;
        stage.y = movePosBegin.y + offsetY;//修正差值
    }
}

function toLocalPos(x, y) {
    let mouse = new PIXI.Point(x, y);
    let localPos = stage.toLocal(mouse);
    return localPos;
}

export default PiCi;