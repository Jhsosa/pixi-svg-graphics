import * as PIXI from 'pixi.js';
import color2color from './color2color.js';

class GraphicsExt extends PIXI.Graphics {
    lineSegments: number;
    lineDashLength: number;
    lineSpaceLength: number;
    lineDashed: boolean;
    styleAttributes: Object;
    parent: GraphicsExt;
    dirtyScale: boolean;

    public lineTo2(x: number, y: number) {
        if (!this.lineDashed) {
            this.currentPath.points.push(x, y)
        } else {
            var points = this.currentPath.points
            var fromX = points[points.length - 2]
            var fromY = points[points.length - 1]
            var distance = Math.abs(Math.sqrt(Math.pow(x - fromX, 2) + Math.pow(y - fromY, 2)))
            if (distance <= this.lineDashLength) {
                this.currentPath.points.push(x, y)
            } else {
                var spaceSegment = this.lineSpaceLength / distance
                var dashSegment = this.lineDashLength / distance
                var currSegment = dashSegment

                var dashOn = false
                var pX, pY
                for (var i = currSegment; i <= 1; i += currSegment) {

                    var t = Math.max(Math.min(i, 1), 0)
                    pX = fromX + (t * (x - fromX))
                    pY = fromY + (t * (y - fromY))

                    dashOn = !dashOn
                    if (dashOn) {
                        currSegment = spaceSegment
                        this.currentPath.points.push(pX, pY)
                    } else {
                        currSegment = dashSegment
                        // this.currentPath.shape.closed = false
                        this.moveTo(pX, pY)
                    }
                }

                dashOn = !dashOn
                if (dashOn && (pX !== x && pY !== y)) {
                    this.currentPath.points.push(x, y)
                }
            }
        }
        // this.dirtyScale = true

        return this
    }

    bezierCurveTo2(cpX: number, cpY: number, cpX2: number, cpY2: number, toX: number, toY: number) {
        if (this.currentPath) {
            if (this.currentPath.points.length === 0) this.currentPath.points = [0, 0]
        }
        else {
            this.moveTo(0, 0)
        }

        var n = this.lineSegments,
            dt,
            dt2,
            dt3,
            t2,
            t3,
            points = this.currentPath.points

        var fromX = points[points.length - 2]
        var fromY = points[points.length - 1]

        var j = 0

        //0 = drawSpace; 1 = drawLine
        var state = 1
        var lPx = null, lPy = null

        for (var i = 1; i <= n; i++) {
            j = i / n

            dt = (1 - j)
            dt2 = dt * dt
            dt3 = dt2 * dt

            t2 = j * j
            t3 = t2 * j

            //calculate next point
            var nPx = dt3 * fromX + 3 * dt2 * j * cpX + 3 * dt * t2 * cpX2 + t3 * toX
            var nPy = dt3 * fromY + 3 * dt2 * j * cpY + 3 * dt * t2 * cpY2 + t3 * toY

            if (!this.lineDashed) {
                points.push(nPx, nPy)
                continue
            }

            if (lPx == null) {
                lPx = nPx
                lPy = nPy
            }

            //calculate distance between last and next point
            var distance = Math.abs(Math.sqrt(Math.pow(nPx - lPx, 2) + Math.pow(nPy - lPy, 2)))
            if (state === 0) {
                if (distance >= this.lineSpaceLength) {
                    lPx = nPx
                    lPy = nPy
                    // this.currentPath.shape.closed = false
                    this.moveTo(nPx, nPy)
                    points = this.currentPath.points
                    state = 1
                }
            } else if (state === 1) {
                if (distance <= this.lineDashLength) {
                    points.push(nPx, nPy)
                } else {
                    lPx = nPx
                    lPy = nPy
                    state = 0
                }
            }
        }

        // this.currentPath.shape.closed = false
        // this.dirtyScale = true

        return this
    }

    quadraticCurveTo2(cpX: number, cpY: number, toX: number, toY: number) {
        if (this.currentPath) {
            if (this.currentPath.points.length === 0) this.currentPath.points = [0, 0]
        }
        else {
            this.moveTo(0, 0)
        }

        var xa,
            ya,
            n = this.lineSegments,
            points = this.currentPath.points
        if (points.length === 0) this.moveTo(0, 0)


        var fromX = points[points.length - 2]
        var fromY = points[points.length - 1]

        var j = 0
        var state = 1
        var lPx = null, lPy = null
        for (var i = 1; i <= n; i++) {
            j = i / n

            xa = fromX + ((cpX - fromX) * j)
            ya = fromY + ((cpY - fromY) * j)

            var nPx = xa + (((cpX + ((toX - cpX) * j)) - xa) * j)
            var nPy = ya + (((cpY + ((toY - cpY) * j)) - ya) * j)

            if (!this.lineDashed) {
                points.push(nPx, nPy)
                continue
            }

            if (lPx == null) {
                lPx = nPx
                lPy = nPy
            }

            //calculate distance between last and next point
            var distance = Math.abs(Math.sqrt(Math.pow(nPx - lPx, 2) + Math.pow(nPy - lPy, 2)))
            if (state === 0) {
                if (distance >= this.lineSpaceLength) {
                    lPx = nPx
                    lPy = nPy
                    // this.currentPath.shape.closed = false
                    this.moveTo(nPx, nPy)
                    points = this.currentPath.points
                    state = 1
                }
            } else if (state === 1) {
                if (distance <= this.lineDashLength) {
                    points.push(nPx, nPy)
                } else {
                    lPx = nPx
                    lPy = nPy
                    state = 0
                }
            }
        }

        // this.dirtyScale = true

        return this
    }

}

export class GraphicsSVG extends PIXI.Graphics {
    private _svg: HTMLElement;
    private _classes: any;
    private _nonScaling: boolean;
    private _options: Object;
    private _graphics: GraphicsExt;

    constructor(svg: HTMLElement, options?: Object) {
        super();
        this._svg = svg;
        this._classes = {};
        this._nonScaling = false
        this._options = Object.assign({
            holes: true
        }, options)
        if (svg) {
            this.drawSVG(svg)
        }
    }

    /**
     * Builds a PIXI.Graphics object from the given SVG document
     * @param  {HTMLElement} svg
     */
    drawSVG(svg: HTMLElement): void {
        console.log('Drawing SVG');
        // var children: HTMLCollection | NodeListOf<ChildNode> = svg.children || svg.childNodes;
        var children: NodeListOf<ChildNode> = svg.childNodes;
        // var children: HTMLCollection = svg.children;
        for (var i = 0, len = children.length; i < len; i++) {
            if (children[i].nodeType !== 1) {
                continue;
            }
            this.drawNode(null, children.item(i).parentElement);
        }
    }

    /**
     * Draws the given node
     * @param  {SVGElement} node
     */
    drawNode(parent: GraphicsExt, node: HTMLElement): void {
        console.log('Drawing Node');
        const types: string[] = ['Svg', 'G', 'Circle', 'Text', 'Line', 'Polyline', 'Ellipse', 'Rect', 'Polygon', 'Path'];
        this._graphics = new GraphicsExt()
        var tagName: string = node.tagName;
        var capitalizedTagName: string = tagName.charAt(0).toUpperCase() + tagName.slice(1);
        console.log(capitalizedTagName + ': ' + types.indexOf(capitalizedTagName));
        if (types.indexOf(capitalizedTagName) != -1) {
            if (capitalizedTagName === 'Svg') {
                var width: string = node.getAttribute('width');
                var height: string = node.getAttribute('height');
                this._graphics.beginFill(0x000, 0).drawRect(0, 0, parseInt(width), parseInt(height))
            }
            (parent || this).addChild(this._graphics)
            console.log('Drawing ' + capitalizedTagName + ' Node');
            switch (capitalizedTagName) {
                case 'Svg':
                    this.drawSvgNode(this._graphics, node);
                    break;
                case 'G':
                    this.drawGNode(this._graphics, node);
                    break;
                case 'Circle':
                    this.drawCircleNode(this._graphics, node)
                    break;
                case 'Text':
                    this.drawTextNode(this._graphics, node)
                    break;
                case 'Line':
                    this.drawLineNode(this._graphics, node)
                    break;
                case 'Polyline':
                    this.drawPolylineNode(this._graphics, node)
                    break;
                case 'Ellipse':
                    this.drawEllipseNode(this._graphics, node)
                    break;
                case 'Rect':
                    this.drawRectNode(this._graphics, node)
                    break;
                case 'Polygon':
                    this.drawPolygonNode(this._graphics, node)
                    break;
                case 'Path':
                    this.drawPathNode(this._graphics, node)
                    break;
                default: break;
            }
            this.applyTransformation(this._graphics, node)
            this._graphics.updateTransform()
        }
    }

    /**
     * Draws the given circle node
     * @param  {SVGCircleElement} node
     */
    drawCircleNode(graphics: GraphicsExt, node: HTMLElement) {
        this.parseSvgAttributes(graphics, node)
        var cx = this.parseScientific(node.getAttribute('cx'))
        var cy = this.parseScientific(node.getAttribute('cy'))
        var r = this.parseScientific(node.getAttribute('r'))
        graphics.drawCircle(cx, cy, r)
    }

    /**
     * Draws the given root SVG node (and handles it as a group)
     * @param  {SVGElement} node
     */
    drawSvgNode(graphics: GraphicsExt, node: HTMLElement) {
        this.parseSvgAttributes(graphics, node);
        // var children: HTMLCollection | NodeListOf<ChildNode> = node.children || node.childNodes;
        var children: NodeListOf<ChildNode> = node.childNodes;
        for (var i = 0; i < children.length; i++) {
            var child: HTMLElement = children[i].parentElement;
            if (child.tagName === 'style') {
                var regAttr = /{([^}]*)}/g
                var regName = /\.([^{;]*){/g
                var classNames; // = child.childNodes[0].data.match(regName)
                var classAttrs; // = child.childNodes[0].data.match(regAttr)
                for (var p = 0; p < classNames.length; p++) {
                    var className = classNames[p].substring(1, classNames[p].length - 1)
                    var classAttr = classAttrs[p].substring(1, classAttrs[p].length - 1)
                    this._classes[className] = classAttr
                }
            }
        }
        this.drawGNode(graphics, node)
    }

    /**
     * Draws the given group svg node
     * @param  {SVGGroupElement} node
     */
    drawGNode(graphics: GraphicsExt, node: HTMLElement) {
        this.parseSvgAttributes(graphics, node);
        var children = node.children || node.childNodes;
        var child;
        for (var i = 0, len = children.length; i < len; i++) {
            child = children[i];
            if (child.nodeType !== 1) {
                continue;
            }
            this.drawNode(graphics, child);
        }
    }

    /**
     * Draws tje text svg node
     * @param {SVGTextElement} node
     */
    drawTextNode(parent: GraphicsExt, node: HTMLElement) {
        var styles = node.getAttribute('style').split(";");
        var styles_obj = {};
        for (var i = 0; i < styles.length; i++) {
            var splitted_style = styles[i].split(':');
            var key = splitted_style[0];
            var val = splitted_style[1];
            styles_obj[key] = val;
        }
        var fontFamily = styles_obj['font-family'];
        var fontSize = styles_obj['font-size'];
        var fill = styles_obj['fill'];
        var tspan = node.childNodes[0];
        // var text = tspan.innerHTML || tspan.textContent

        // var pixi_text = new PIXI.Text(text, { fontFamily: fontFamily, fontSize: fontSize, fill: fill })
        // var x = tspan.getAttribute('x') || node.getAttribute('x') || 0
        // var y = tspan.getAttribute('y') || node.getAttribute('y') || 0
        // pixi_text.x = parseInt(x)
        // pixi_text.y = parseInt(y) - pixi_text.height + PIXI.TextMetrics._fonts[pixi_text._font].descent
        //     (parent || this).addChild(pixi_text)
    }

    /**
     * Draws the given line svg node
     * @param  {SVGLineElement} node
     */
    drawLineNode(graphics: GraphicsExt, node: HTMLElement) {
        this.parseSvgAttributes(graphics, node);
        var x1 = this.parseScientific(node.getAttribute('x1'));
        var y1 = this.parseScientific(node.getAttribute('y1'));
        var x2 = this.parseScientific(node.getAttribute('x2'));
        var y2 = this.parseScientific(node.getAttribute('y2'));
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
    }

    /**
     * Draws the given polyline svg node
     * @param  {SVGPolylineElement} node
     */
    drawPolylineNode(graphics: GraphicsExt, node: HTMLElement) {
        this.parseSvgAttributes(graphics, node)

        var reg = '(-?[\\d\\.?]+),(-?[\\d\\.?]+)'
        var points = node.getAttribute('points').match(new RegExp(reg, 'g'))

        var point
        for (var i = 0, len = points.length; i < len; i++) {
            point = points[i]
            var coords = point.match(new RegExp(reg))

            coords[1] = this.parseScientific(coords[1])
            coords[2] = this.parseScientific(coords[2])

            if (i === 0) {
                graphics.moveTo(coords[1], coords[2])
            } else {
                graphics.lineTo(coords[1], coords[2])
            }
        }
    }

    /**
     * Draws the given ellipse node
     * @param  {SVGCircleElement} node
     */
    drawEllipseNode(graphics: GraphicsExt, node: HTMLElement) {
        this.parseSvgAttributes(graphics, node)
        var cx = this.parseScientific(node.getAttribute('cx'))
        var cy = this.parseScientific(node.getAttribute('cy'))
        var rx = this.parseScientific(node.getAttribute('rx'))
        var ry = this.parseScientific(node.getAttribute('ry'))
        graphics.drawEllipse(cx, cy, rx, ry)
    }

    /**
     * Draws the given rect node
     * @param  {SVGRectElement} node
     */
    drawRectNode(graphics: GraphicsExt, node: HTMLElement) {
        this.parseSvgAttributes(graphics, node)

        var x = this.parseScientific(node.getAttribute('x'))
        var y = this.parseScientific(node.getAttribute('y'))
        var width = this.parseScientific(node.getAttribute('width'))
        var height = this.parseScientific(node.getAttribute('height'))

        graphics.drawRect(x, y, width, height)
    }

    /**
     * Draws the given polygon node
     * @param  {SVGPolygonElement} node
     */
    drawPolygonNode(graphics: GraphicsExt, node: HTMLElement) {
        this.parseSvgAttributes(graphics, node)

        var reg = '(-?[\\d\\.?]+),(-?[\\d\\.?]+)'
        var points = node.getAttribute('points').match(new RegExp(reg, 'g'))

        var path = []
        var point
        for (var i = 0, len = points.length; i < len; i++) {
            point = points[i]
            var coords = point.match(new RegExp(reg))

            coords[1] = this.parseScientific(coords[1])
            coords[2] = this.parseScientific(coords[2])

            path.push(new PIXI.Point(
                coords[1],
                coords[2]
            ))
        }

        this.parseSvgAttributes(graphics, node)
        this.drawPolygon(path)
    }

    /**
     * Draws the given path svg node
     * @param  {SVGPathElement} node
     */
    drawPathNode(graphics: GraphicsExt, node: HTMLElement) {
        this.parseSvgAttributes(graphics, node)
        var d = node.getAttribute('d').trim()
        var data = this.tokenizePathData(d)
        this.drawPathData(graphics, data)
    }

    /**
     * Draw the given tokenized path data object
     */
    drawPathData(graphics: GraphicsExt, data: Object) {
        var instructions = data['instructions'];
        var subPathIndices = []

        for (var j = 0; j < instructions.length; j++) {
            if (instructions[j].command.toLowerCase() === 'm') {
                subPathIndices.push(j)
            }
        }

        for (var i = 0; i < instructions.length; i++) {
            var command = instructions[i].command
            var points = instructions[i].points
            var z = 0
            if (command.toLowerCase() === 'z' && points.length === 0) {
                points.length = 1
            }

            while (z < points.length) {
                switch (command.toLowerCase()) {
                    // moveto command
                    case 'm':
                        var x = points[z].x
                        var y = points[z].y

                        if (z === 0) {
                            if (subPathIndices.indexOf(i) >= 2 && this._options['holes']) {
                                graphics.beginHole(); //.addHole()
                                graphics.endHole();
                            }
                            graphics.moveTo(x, y)
                            // graphics.graphicsData[graphics.graphicsData.length - 1].shape.closed = false
                        } else {
                            graphics.lineTo2(x, y)
                        }
                        z += 1
                        break
                    // lineto command
                    case 'l':
                        var x = points[z].x
                        var y = points[z].y

                        graphics.lineTo2(x, y)
                        z += 1
                        break
                    // curveto command
                    case 'c':
                        graphics.bezierCurveTo2(
                            points[z].x,
                            points[z].y,
                            points[z + 1].x,
                            points[z + 1].y,
                            points[z + 2].x,
                            points[z + 2].y
                        )
                        z += 3
                        break
                    // vertial lineto command
                    case 'v':
                        var x = points[z].x
                        var y = points[z].y

                        graphics.lineTo2(x, y)
                        z += 1
                        break
                    // horizontal lineto command
                    case 'h':
                        var x = points[z].x
                        var y = points[z].y

                        graphics.lineTo2(x, y)
                        z += 1
                        break
                    // bezier curve command
                    case 's':
                        graphics.bezierCurveTo2(
                            points[z].x,
                            points[z].y,
                            points[z + 1].x,
                            points[z + 1].y,
                            points[z + 2].x,
                            points[z + 2].y
                        )
                        z += 3
                        break
                    // closepath command
                    case 'z':
                        // graphics.graphicsData[graphics.graphicsData.length - 1].shape.closed = true
                        z += 1
                        break
                    default:
                        throw new Error('Could not handle path command: ' + command)
                }
            }
        }
        // add the last subpath as a hole if there were holes added before and there is no z command in the end
        if (subPathIndices.length > 1 && this._options['holes']) {
            graphics.beginHole();
            graphics.endHole();
            // graphics.addHole()
        }
    }

    tokenizePathData(pathData): Object {
        var commands = pathData.match(/[a-df-z][^a-df-z]*/ig)
        var data = {
            instructions: []
        }

        //needed to calculate absolute position of points
        var lastPoint = {
            x: 0,
            y: 0
        }
        var lastControl = null

        for (var i = 0; i < commands.length; i++) {
            var instruction = {
                command: '',
                points: []
            }
            var command = commands[i][0]
            var args = []

            //allow any decimal number in normal or scientific form
            args = args.concat(commands[i].slice(1).trim().match(/[+|-]?(?:0|[0-9]\d*)?(?:\.\d*)?(?:[eE][+\-]?\d+)?/g))

            for (var j = args.length - 1; j >= 0; j--) {
                var arg = args[j]
                if (arg === "") {
                    args.splice(j, 1)
                }
            }

            var p = 0
            while (p < args.length) {
                var offset = {
                    x: 0,
                    y: 0
                }
                if (command === command.toLowerCase()) {
                    // Relative positions
                    offset = lastPoint
                }
                var points = []
                switch (command.toLowerCase()) {
                    case 'm':
                        var point = { x: 0, y: 0 };
                        point.x = this.parseScientific(args[p]) + offset.x;
                        point.y = this.parseScientific(args[p + 1]) + offset.y;
                        points.push(point);
                        lastPoint = point;
                        p += 2;
                        break
                    case 'l':
                        var point = { x: 0, y: 0 };
                        point.x = this.parseScientific(args[p]) + offset.x;
                        point.y = this.parseScientific(args[p + 1]) + offset.y;
                        points.push(point);
                        lastPoint = point;
                        p += 2;
                        break
                    case 'c':
                        var point1 = { x: 0, y: 0 };
                        var point2 = { x: 0, y: 0 };
                        var point3 = { x: 0, y: 0 };
                        point1.x = this.parseScientific(args[p]) + offset.x;
                        point1.y = this.parseScientific(args[p + 1]) + offset.y;
                        point2.x = this.parseScientific(args[p + 2]) + offset.x;
                        point2.y = this.parseScientific(args[p + 3]) + offset.y;
                        point3.x = this.parseScientific(args[p + 4]) + offset.x;
                        point3.y = this.parseScientific(args[p + 5]) + offset.y;
                        points.push(point1);
                        points.push(point2);
                        points.push(point3);
                        lastPoint = point3;
                        lastControl = point2;
                        p += 6;
                        break
                    case 'v':
                        var point = { x: 0, y: 0 };
                        point.y = this.parseScientific(args[p]) + offset.y;
                        point.x = lastPoint.x;
                        points.push(point);
                        lastPoint = point;
                        p += 1;
                        break
                    case 'h':
                        var point = { x: 0, y: 0 };
                        point.x = this.parseScientific(args[p]) + offset.x;
                        point.y = lastPoint.y;
                        points.push(point);
                        lastPoint = point;
                        p += 1;
                        break
                    case 's':
                        var point1 = { x: 0, y: 0 };
                        var point2 = { x: 0, y: 0 };
                        var point3 = { x: 0, y: 0 };
                        if (lastControl === null) {
                            point1.x = lastPoint.x;
                            point1.y = lastPoint.y;
                        } else {
                            point1.x = 2 * lastPoint.x - lastControl.x;
                            point1.y = 2 * lastPoint.y - lastControl.y;
                        }
                        point2.x = this.parseScientific(args[p]) + offset.x;
                        point2.y = this.parseScientific(args[p + 1]) + offset.y;
                        point3.x = this.parseScientific(args[p + 2]) + offset.x;
                        point3.y = this.parseScientific(args[p + 3]) + offset.y;
                        points.push(point1);
                        points.push(point2);
                        points.push(point3);
                        lastPoint = point3;
                        lastControl = point2;
                        p += 4;
                        break
                    default:
                        p += 1;
                        break
                }
                instruction.points = instruction.points.concat(points);
            }
            instruction.command = command;
            data.instructions.push(instruction);
        }
        return data;
    }


    /**
     * Applies the given node's attributes to our PIXI.Graphics object
     * @param  {SVGElement} node
     */
    parseSvgAttributes(graphics: GraphicsExt, node: HTMLElement) {
        var attributes = new Object();
        // Get node attributes
        var i: number = node.attributes.length;
        var attribute: Attr;
        while (i--) {
            attribute = node.attributes.getNamedItem[i];
            if (attribute) {
                attributes[attribute.name] = attribute.value;
            }
        }

        // CSS attributes override node attributes
        var cssClass: string = node.getAttribute('class');
        var cssClasses: string[] = [];
        if (cssClass) {
            cssClasses = cssClass.split(' ');
        }
        var style: string = node.getAttribute('style');
        if (style) {
            this._classes['style'] = style;
            cssClasses.push('style');
        }
        for (var c in this._classes) {
            if (cssClasses.indexOf(c) !== -1) {
                style = this._classes[c];
                var pairs: string[];
                var pair: string;
                var split: string[];
                var key: string;
                var value: string;
                if (style) {
                    // Simply parse the inline css
                    pairs = style.split(';');
                    for (var j = 0, len = pairs.length; j < len; j++) {
                        pair = pairs[j].trim();
                        if (!pair) {
                            continue;
                        }

                        split = pair.split(':', 2);
                        key = split[0].trim();
                        value = split[1].trim();
                        attributes[key] = value;
                    }
                }
            }
        }
        this.applySvgAttributes(graphics, attributes);
    }

    applySvgAttributes(graphics: GraphicsExt, attributes: Object) {
        const styleAttributeNames = [
            'stroke',
            'stroke-width',
            'vector-effect',
            'stroke-dasharray',
            'fill'
        ]
        const styleAttributes: Object = new Object();
        styleAttributeNames.forEach(attributeName => {
            styleAttributes[attributeName] = attributes[attributeName]; // || this.getInheritedStyleAttribute(graphics, attributeName);
        });

        // Apply stroke style
        var strokeColor: number = 0x000000;
        var strokeWidth: number = 1;
        var strokeAlpha: number = 0;
        var color;
        var intColor;

        if (styleAttributes['stroke']) {
            color = color2color(styleAttributes['stroke'], 'array');
            intColor = 256 * 256 * color[0] + 256 * color[1] + color[2];
            strokeColor = intColor;
            strokeAlpha = color[3];
        }

        if (styleAttributes['stroke-width']) {
            strokeWidth = parseInt(styleAttributes['stroke-width'], 10);
        }

        var vectorEffect = styleAttributes['vector-effect'];
        if (vectorEffect === 'non-scaling-stroke') {
            this._nonScaling = true;
        }

        var strokeSegments: number = 100;
        var strokeDashLength: number = 100;
        var strokeSpaceLength: number = 0;
        var strokeDashed: boolean = false;
        if (styleAttributes['stroke-dasharray'] && styleAttributes['stroke-dasharray'] !== 'none') {
            // Ignore unregular dasharray
            var params = this.splitAttributeParams(styleAttributes['stroke-dasharray']);
            strokeDashLength = parseInt(params[0]);
            strokeSpaceLength = parseInt(params[1]);
            strokeDashed = true;
        }
        graphics.lineSegments = strokeSegments;
        graphics.lineDashed = strokeDashed;
        graphics.lineDashLength = strokeDashLength;
        graphics.lineSpaceLength = strokeSpaceLength;

        graphics.lineStyle(strokeWidth, strokeColor, strokeAlpha)

        // Apply fill style
        var fillColor = 0x000000, fillAlpha = 1
        if (styleAttributes['fill']) {
            color = color2color(styleAttributes['fill'], 'array');
            intColor = 256 * 256 * color[0] + 256 * color[1] + color[2]
            fillColor = intColor
            fillAlpha = color[3]
        }
        graphics.beginFill(fillColor, fillAlpha)
        graphics.styleAttributes = styleAttributes
    }


    getInheritedStyleAttribute(graphics: GraphicsExt, attributeName: string): string {
        if (graphics.styleAttributes && graphics.styleAttributes[attributeName]) {
            return graphics.styleAttributes[attributeName]
        } else if (graphics.parent) {
            const value = this.getInheritedStyleAttribute(graphics.parent, attributeName)
            if (value) {
                return value
            }
        }
        return null
    }

    applyTransformation(graphics: PIXI.Graphics, node: HTMLElement): void {
        if (node.getAttribute('transform')) {
            var transformMatrix: PIXI.Matrix = new PIXI.Matrix()
            var transformAttr: string[] = node.getAttribute('transform').trim().split('(')
            var transformCommand: string = transformAttr[0]
            var transformValues: string[] = this.splitAttributeParams(transformAttr[1].replace(')', ''))

            if (transformCommand === 'matrix') {
                transformMatrix.a = this.parseScientific(transformValues[0])
                transformMatrix.b = this.parseScientific(transformValues[1])
                transformMatrix.c = this.parseScientific(transformValues[2])
                transformMatrix.d = this.parseScientific(transformValues[3])
                transformMatrix.tx = this.parseScientific(transformValues[4])
                transformMatrix.ty = this.parseScientific(transformValues[5])
                graphics.transform.localTransform = transformMatrix
            } else if (transformCommand === 'translate') {
                graphics.x += this.parseScientific(transformValues[0])
                graphics.y += this.parseScientific(transformValues[1])
            } else if (transformCommand === 'scale') {
                graphics.scale.x = this.parseScientific(transformValues[0])
                graphics.scale.y = this.parseScientific(transformValues[1])
            } else if (transformCommand === 'rotate') {
                if (transformValues.length > 1) {
                    graphics.x += this.parseScientific(transformValues[1])
                    graphics.y += this.parseScientific(transformValues[2])
                }

                graphics.rotation = this.parseScientific(transformValues[0])

                if (transformValues.length > 1) {
                    graphics.x -= this.parseScientific(transformValues[1])
                    graphics.y -= this.parseScientific(transformValues[2])
                }
            }
        }
    }

    splitAttributeParams(attr: string): string[] {
        if (attr.indexOf(",") >= 0) {
            return attr.split(",");
        }
        return attr.split(" ");
    }

    parseScientific(numberString: string): number {
        var info: RegExpExecArray = /([\d\.]+)e-(\d+)/i.exec(numberString);
        if (!info) {
            return parseFloat(numberString);
        }

        var num: string = info[1].replace('.', '');
        var numDecs: number = info[2].length - 1;
        var output: string = "0.";
        for (var i = 0; i < numDecs; i++) {
            output += "0";
        }
        output += num;
        return parseFloat(output);
    }

}

export default GraphicsSVG;