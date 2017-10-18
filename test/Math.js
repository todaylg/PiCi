//脑残算法
function myStupiedCacQuadraticCurveMidPos(tempSourcePos, tempTargetPos, height = 100) {
    let disX = Math.abs(tempTargetPos.x - tempSourcePos.x), disY = Math.abs(tempTargetPos.y - tempSourcePos.y);
    let angle = Math.atan(disY / disX);
    let halfLen = Math.sqrt(disX * disX + disY * disY) / 2;
    let angle1 = Math.atan(height / halfLen);
    let angleTotal = angle + angle1;
    if (angleTotal - Math.PI / 2 > 0) {//两角相加为一个钝角了
        let angleBeats = Math.PI - (angle + angle1);
        let edge = 100 / Math.sin(angle1);
        let xLen = edge * Math.cos(angleBeats);
        let yLen = edge * Math.sin(angleBeats);
        let minX = tempSourcePos.x - tempTargetPos.x >= 0 ? tempTargetPos.x : tempSourcePos.x;
        let minY = tempSourcePos.y - tempTargetPos.y >= 0 ? tempSourcePos.y : tempTargetPos.y;
        return {
            x: minX - xLen,
            y: minY - yLen
        }
    } else {//两角相加为一个锐角了
        let edgeLen = height / Math.sin(angle1);
        let xLen = edgeLen * Math.sin(angleTotal);
        let yLen = edgeLen * Math.cos(angleTotal);
        let maxX = tempSourcePos.x - tempTargetPos.x >= 0 ? tempSourcePos.x : tempTargetPos.x;
        let minY = tempSourcePos.y - tempTargetPos.y >= 0 ? tempSourcePos.y : tempTargetPos.y;
        return {
            x: maxX - xLen,
            y: minY + yLen
        }
    }
}

//二阶贝塞尔曲线---大神算法
function CacQuadraticCurveMidPos(tempSourcePos, tempTargetPos, h = 100) {
    let x2 = (tempSourcePos.x - tempTargetPos.x) * (tempSourcePos.x - tempTargetPos.x);
    let y2 = (tempSourcePos.y - tempTargetPos.y) * (tempSourcePos.y - tempTargetPos.y);
    let sqrt = Math.sqrt(x2 + y2);
    let resX = (tempSourcePos.y - tempTargetPos.y) * (2 - h) / sqrt;
    let resY = (tempSourcePos.x - tempTargetPos.x) * (2 - h) / sqrt;
    return {
        x: resX,
        y: resY
    };
}
