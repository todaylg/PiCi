import * as PIXI from "pixi.js";
import arcToBezier from 'svg-arc-to-cubic-bezier';
// import * as d3 from "d3-force";
import Dracula from 'graphdracula';

//Use Sprite repalce Graph

//Encapsulation PiXi => export PiCi 
//Aliases
let Container = PIXI.Container,
    Application = PIXI.Application,
    Sprite = PIXI.Sprite,
    Text = PIXI.Text,
    Filters = PIXI.filters,
    Graphics = PIXI.Graphics;

let renderer = new Application(window.innerWidth, window.innerHeight, {
    antialias: true,// antialias: true,//这抗锯齿一开整个世界都变了  =>bug(just Chrome,FF is ok): renderer = new PIXI.WebGLRenderer + renderer.render(stage);
    forceFXAA: true,//For WebglRender AA
    backgroundColor: 0x1099bb
}),//Todo=> parameter
    stage = renderer.stage,
    edgeContainer = new Container(),
    arrowContainer = new Container(),
    nodeContainer = new Container(),//Node above edge
    textContainer = new Container(),//Text above node
    dragContainer = new Container();//Hightest level

//Canvas(defalut is Webgl) Use for Render test
// renderer.renderer = new PIXI.CanvasRenderer(window.innerWidth, window.innerHeight, {
//     backgroundColor: 0x1099bb
// })

document.body.appendChild(renderer.view);

const SCALE_MAX = 10, SCALE_MIN = 0.4;//For scale limmit
let nodeWidth = 30;//defalut node radius
let point = {};//Todo 这里以后指针的形状也可以自定义
let movePosBegin = {};

let nodeList = {},//Save node
    edgeList = {},//Cache edge
    arrowList = {},//Save arrow
    textList = {},//Save text
    edgeInfoList = {};//Save edge info

let circleList = {};
let bezierList = {};//Deal with 2 bezierCurve
let midPos;//Now is just for Bezier,TODO is for all(include straight use midPos to Calculate)

function PiCi(opts) {
    opts = Object.assign({}, opts);
    //Extrac nodes/edges information from opts
    let elements = opts.elements;
    let nodes = [];
    let edges = [];
    if (!elements) elements = [];
    if (elements.length > 0) {//init Node
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

            if (!data.source && !data.target) {//Node
                nodeList[data.id] = data;
                nodes.push(data);
            } else {
                edges.push(data);
                //Save this edge's info
                edgeInfoList[data.id] = data;
            }
        }
    }

    initializeNodes(nodes, edges);

    for (let i = 0, l = elements.length; i < l; i++) {//init Edge
        let data = elements[i].data,
            id = data.id;
        //Save this edge's info
        edgeInfoList[data.id] = data;
        if (data.source && data.target) {//Edge
            //Get position info
            let source = nodeList[data.source];
            let target = nodeList[data.target];

            drawArrowAndEdge(data, source, target);
        }
    }
    //层级顺序
    stage.addChild(edgeContainer);
    stage.addChild(arrowContainer);
    stage.addChild(nodeContainer);
    stage.addChild(textContainer);
    stage.addChild(dragContainer);
}

function drawArrowAndEdge(data, source, target) {
    //Remove old edge (drawArrowShape会擦除旧arrow)
    if (edgeList[data.id]) edgeContainer.removeChild(edgeList[data.id]);
    //Draw Arrow
    let newSourcePos, newTargetPos;
    if (data.targetShape) {
        switch (data.curveStyle) {
            case "bezier":
                //三阶贝塞尔曲线
                let bMidPos = CacBezierCurveMidPos(source, target, 100);
                if (bezierList[source + '+' + target]) {
                    bezierList[source + '+' + target] = 1;//'source+target'
                } else {
                    bezierList[source + '+' + target]++;
                }
                let pos2 = { x: bMidPos.x2, y: bMidPos.y2 }
                //drawCircle(pos2.x, pos2.y, 5);
                newTargetPos = drawArrowShape(data.id, data.targetShape, pos2, target, source, target, true);
                break;
            case "quadraticCurve":
                //二阶贝塞尔曲线
                let cMidPos = CacQuadraticCurveMidPos(source, target, 100);
                //drawCircle(cMidPos.x, cMidPos.y, 5);
                newTargetPos = drawArrowShape(data.id, data.targetShape, cMidPos, target, source, target, true);
                break;
            default:
                newTargetPos = drawArrowShape(data.id, data.targetShape, source, target, source, target, true);
                break;
        }
    }
    if (data.sourceShape) {
        switch (data.curveStyle) {
            case "bezier":
                //三阶贝塞尔曲线
                let bMidPos = CacBezierCurveMidPos(source, target, 100);
                let pos1 = { x: bMidPos.x1, y: bMidPos.y1 }
                //drawCircle(pos1.x, pos1.y, 5);
                newSourcePos = drawArrowShape(data.id, data.sourceShape, source, pos1, source, target, false);
                break;
            case "quadraticCurve":
                //二阶贝塞尔曲线
                let cMidPos = CacQuadraticCurveMidPos(source, target, 100);
                //drawCircle(cMidPos.x, cMidPos.y, 5);
                newSourcePos = drawArrowShape(data.id, data.sourceShape, source, cMidPos, source, target, false);
                break;
            default:
                newSourcePos = drawArrowShape(data.id, data.sourceShape, source, target, source, target, false);
                break;
        }
    }

    let tempSourcePos = newSourcePos ? newSourcePos : source;
    let tempTargetPos = newTargetPos ? newTargetPos : target;

    //Draw edge
    let line = new Graphics();
    line.lineStyle(4, 0xFFFFFF, 1);

    line.moveTo(tempSourcePos.x, tempSourcePos.y);
    switch (data.curveStyle) {
        case "bezier":
            //三阶贝塞尔曲线
            let cPos = CacBezierCurveMidPos(tempSourcePos, tempTargetPos, 100);
            line.bezierCurveTo(cPos.x1, cPos.y1, cPos.x2, cPos.y2, cPos.x, cPos.y);
            break;
        case "quadraticCurve":
            //二阶贝塞尔曲线
            let bPos = CacQuadraticCurveMidPos(tempSourcePos, tempTargetPos, 100);
            line.quadraticCurveTo(bPos.x, bPos.y, tempTargetPos.x, tempTargetPos.y);
            break;
        default:
            line.lineTo(tempTargetPos.x, tempTargetPos.y);
            break;
    }

    edgeList[data.id] = line;//保存边引用

    edgeContainer.addChild(line);
}

//Dragular Layout
function initializeNodes(nodes, edges) {
    let g = new Dracula.Graph();
    for (let i = 0, l = edges.length; i < l; i++) {
        let data = edges[i], id = data.id;
        g.addEdge(data.source, data.target);
    }
    var layouter = new Dracula.Layout.Spring(g);
    layouter.layout();

    var renderer = new Dracula.Renderer.Raphael('canvas', g, window.innerWidth - 100, window.innerHeight);

    renderer.draw();//这里改动了Dragular的源码，记一下，这个draw方法不再进行渲染

    //根据g生成的位置进行初始化
    let nodesObj = g.nodes;
    for (let node in nodesObj) {
        let id = nodesObj[node].id;
        nodeList[id].x = nodesObj[node].point[0];
        nodeList[id].y = nodesObj[node].point[1];

        node = nodeList[id];
        //位置信息就有了，和d3-force初始化不同,只需要画一遍即可
        //Draw node
        let width = nodeWidth;
        if (node.width) width = node.width;
        let scale = width / 600;
        let circle = generateSprite(node.shape, scale);//600=>todo=>param

        //change to tint
        if (node.color) {
            circle.tint = node.color;
        } else {
            circle.tint = 0x000000;
        }

        //Draw NodeText
        let textOpts;
        if(node.textOpts)textOpts = node.textOpts
        if(node.text) drawText(node.text,textOpts,node.id,node.x,node.y);

        circle = setNode(circle, node.id);

        //Move the graph to its designated position
        //Todo => Node坐标随机分布
        circle.x = node.x;
        circle.y = node.y;

        nodeContainer.addChild(circle);
    }
}
let offsetX,offsetY;
function drawText(text, opts, id, x, y){
    if(text===''||opts===undefined) return;
    let newText = new PIXI.Text(text, opts);
    if(!offsetX)offsetX = newText.width/2;//讲道理这里应该可以用缓存值吧
    if(!offsetY)offsetY = newText.height/2;//但是node的半径是不是可以动态改变的呢？
    newText.x = x-offsetX;
    newText.y = y-offsetY;
    textList[id] = newText;
    textContainer.addChild(newText);
}

function updateText(id, newPos){
    textList[id].x = newPos.x-offsetX;
    textList[id].y = newPos.y-offsetY;
}

function setNode(sprite, id) {

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
        dragContainer.removeChild(textList[id]);
        nodeContainer.addChild(this);
        textContainer.addChild(textList[id]);
    }

    let onDragMove = function () {
        if (this.dragging) {
            let newPosition = this.data.getLocalPosition(this.parent);
            this.x = newPosition.x;
            this.y = newPosition.y;
            updateEdge(id, newPosition);//闭包的缘故，id是能访问得到的
            updateText(id, newPosition);
            textContainer.removeChild(textList[id]);
            nodeContainer.removeChild(this);
            dragContainer.addChild(this);
            dragContainer.addChild(textList[id]);
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

    let drawNewEdge = function (data, targetFlag, newPos) {
        let oldLine = edgeList[data.id];//在线的引用保存对象里找到线
        edgeContainer.removeChild(oldLine);//删除线重新画
        //不落帧
        if (targetFlag) {
            nodeList[data.target].x = newPos.x;
            nodeList[data.target].y = newPos.y;
        } else {
            nodeList[data.source].x = newPos.x;
            nodeList[data.source].y = newPos.y;
        }

        let source = nodeList[data.source],//起点（node坐标）
            target = nodeList[data.target];//终点（node坐标）

        //Redraw
        drawArrowAndEdge(data, source, target);

        // //Save position change
        if (targetFlag) {
            //保存修改了的target Node坐标
            nodeList[data.target].x = newPos.x;
            nodeList[data.target].y = newPos.y;
        } else {
            //保存修改了的source Node坐标
            nodeList[data.source].x = newPos.x;
            nodeList[data.source].y = newPos.y;
        }

    }

    sprite
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);

    return sprite;
}

//脑残画法
function drawArrowShape(id, shape, sourcePos, targetPos, source, target, targetFlag) {

    switch (shape) {
        case 'circle':
            let c_nodeRadius = nodeWidth;
            if (!targetFlag && sourcePos.width) c_nodeRadius = sourcePos.width;
            if (targetFlag && targetPos.width) c_nodeRadius = targetPos.width;

            //边界判定 => 贴一起了就别显示啦
            if ((Math.abs(source.y - target.y) < c_nodeRadius * 1.5) &&
                (Math.abs(source.x - target.x) < c_nodeRadius * 1.5)) {
                c_nodeRadius = 0;
            }

            let srcPos = targetFlag ? targetPos : sourcePos;
            let tgtPos = targetFlag ? sourcePos : targetPos;

            let c_angle = Math.atan(Math.abs(srcPos.y - tgtPos.y) / Math.abs(srcPos.x - tgtPos.x))
            let circleWidth = c_nodeRadius / 2;
            //posX和posY就是circle的最终中心坐标
            let posX = (c_nodeRadius + circleWidth) * Math.cos(c_angle),
                posY = (c_nodeRadius + circleWidth) * Math.sin(c_angle);

            //分类讨论target和source的相对左右位置
            if (srcPos.x > tgtPos.x) {//source节点在右边
                posX = srcPos.x - posX;
            } else {
                posX = srcPos.x + posX;
            }
            if (srcPos.y > tgtPos.y) {//source节点在上边
                posY = srcPos.y - posY;
            } else {
                posY = srcPos.y + posY;
            }

            //Draw circle
            let circle = new Graphics();
            circle.beginFill(0x66CCFF);

            circle.drawCircle(0, 0, circleWidth);
            circle.endFill();

            circle.x = posX;
            circle.y = posY;

            //updateArrow 
            updateArrow(id, circle, targetFlag);

            return {
                x: posX,
                y: posY
            }

        case 'triangle':
            //这个三角形默认按顶角为50°，两个底角为65°来算，两边长先按一半nodeWidth来算吧
            //先画出来再想抽象的事
            let t_nodeRadius = nodeWidth;
            if (!targetFlag && sourcePos.width) t_nodeRadius = sourcePos.width;
            if (targetFlag && targetPos.width) t_nodeRadius = targetPos.width;

            //边界判定 => 贴一起了就别显示啦
            if ((Math.abs(source.y - target.y) < t_nodeRadius * 1.5) &&
                (Math.abs(source.x - target.x) < t_nodeRadius * 1.5)) {
                t_nodeRadius = 0;
            }

            let t_srcPos = targetFlag ? sourcePos : targetPos;
            let t_tgtPos = targetFlag ? targetPos : sourcePos;

            let topAngle = Math.PI / 180 * 50,//角度转弧度，注意Math的那些方法的单位是弧度
                sideEdge = t_nodeRadius,//瞅着合适，先凑合
                halfBottomEdge = Math.sin(topAngle / 2) * sideEdge,
                centerEdge = Math.cos(topAngle / 2) * sideEdge;
            //angle是一样的，先按node中心算，arrow中心算之后再说，先todo(直线版看出不这个问题，曲线就崩了)
            let angle = Math.atan(Math.abs(t_srcPos.y - t_tgtPos.y) / Math.abs(t_srcPos.x - t_tgtPos.x));
            let beginPosX = t_nodeRadius * Math.cos(angle),
                beginPosY = t_nodeRadius * Math.sin(angle),
                pos1X, pos1Y, pos2X, pos2Y,
                centerX = (t_nodeRadius + centerEdge) * Math.cos(angle),
                centerY = (t_nodeRadius + centerEdge) * Math.sin(angle);

            pos1X = pos2X = Math.sin(angle) * halfBottomEdge;
            pos1Y = pos2Y = Math.cos(angle) * halfBottomEdge;//简单的几何知识(手动抽搐😖)

            //还需要分类讨论target和source的左右位置的各种情况
            //1234代表target相对source所在象限
            if (t_srcPos.x > t_tgtPos.x) {//source节点在右
                if (t_srcPos.y > t_tgtPos.y) {//下 ----> 1
                    beginPosX = t_tgtPos.x + beginPosX;
                    beginPosY = t_tgtPos.y + beginPosY;

                    centerX = t_tgtPos.x + centerX;
                    centerY = t_tgtPos.y + centerY;

                    pos1X = centerX + pos1X;
                    pos1Y = centerY - pos1Y;//+ -

                    pos2X = centerX - pos2X;
                    pos2Y = centerY + pos2Y;//- +
                } else {//上 ----> 4
                    beginPosX = t_tgtPos.x + beginPosX;
                    beginPosY = t_tgtPos.y - beginPosY;

                    centerX = t_tgtPos.x + centerX;
                    centerY = t_tgtPos.y - centerY;

                    pos1X = centerX + pos1X;
                    pos1Y = centerY + pos1Y;//+ +

                    pos2X = centerX - pos2X;
                    pos2Y = centerY - pos2Y;//- -
                }

            } else {//source节点在左
                if (t_srcPos.y > t_tgtPos.y) {//下 ----> 2
                    beginPosX = t_tgtPos.x - beginPosX;
                    beginPosY = t_tgtPos.y + beginPosY;

                    centerX = t_tgtPos.x - centerX;
                    centerY = t_tgtPos.y + centerY;

                    pos1X = centerX - pos1X;
                    pos1Y = centerY - pos1Y;//- -

                    pos2X = centerX + pos2X;
                    pos2Y = centerY + pos2Y;//+ +
                } else {//上 ----> 3
                    beginPosX = t_tgtPos.x - beginPosX;
                    beginPosY = t_tgtPos.y - beginPosY;

                    centerX = t_tgtPos.x - centerX;
                    centerY = t_tgtPos.y - centerY;

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

            updateArrow(id, triangle, targetFlag);

            return {
                x: centerX,
                y: centerY
            }
    }
}

function updateArrow(id, shape, targetFlag) {
    if (!arrowList[id]) arrowList[id] = {};
    if (!targetFlag) {//Source arrow
        if (arrowList[id].sourceArrow) arrowContainer.removeChild(arrowList[id].sourceArrow);
        //save newArrow
        arrowList[id].sourceArrow = shape;
    } else {//Target arrow
        if (arrowList[id].targetArrow) arrowContainer.removeChild(arrowList[id].targetArrow);
        //save newArrow
        arrowList[id].targetArrow = shape;
    }
    arrowContainer.addChild(shape);
}

function generateSprite(shape, scale = 0.2) {
    let sprite;

    switch (shape) {
        default:
            sprite = Sprite.fromImage('../assets/Circle_White.png');
            break;
    }
    sprite.anchor.set(0.5);
    sprite.scale.set(scale*2);//>>??????莫名其妙和graph差两倍
    sprite.filters = [new Filters.BlurFilter(1)];//效果拔群！！

    // Opt-in to interactivity
    sprite.interactive = true;

    // Shows hand cursor
    sprite.buttonMode = true;
    
    return sprite;

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

//三阶贝塞尔曲线---引用库:arcTobezier
function CacBezierCurveMidPos(tempSourcePos, tempTargetPos, height = 100) {
    let dx = tempSourcePos.x - tempTargetPos.x,
        dy = tempSourcePos.y - tempTargetPos.y,
        dr = Math.sqrt(dx * dx + dy * dy);

    const curve = {
        type: 'arc',
        rx: dr,
        ry: dr,
        largeArcFlag: 0,
        sweepFlag: 1,
        xAxisRotation: 0,
    }

    const curves = arcToBezier({
        px: tempSourcePos.x,
        py: tempSourcePos.y,
        cx: tempTargetPos.x,
        cy: tempTargetPos.y,
        rx: curve.rx,
        ry: curve.ry,
        xAxisRotation: curve.xAxisRotation,
        largeArcFlag: curve.largeArcFlag,
        sweepFlag: curve.sweepFlag,
    });

    return curves[0];
}

export default PiCi;