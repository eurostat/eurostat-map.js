import { select } from "d3-selection";

/**
 * A eurostat-map legend. This is an abstract method.
*/
export const legend = function (map, config) {

	//build legend object
	const out = {};

	//link map to legend
	out.map = map;

	//the SVG where to make the legend
	out.svgId = "legend_" + Math.round(10e15 * Math.random());
	out.svg = undefined;

	//the legend element dimension
	out.width = undefined;
	out.height = undefined;
	//the legend element position, in case it is embeded within the map SVG
	out.x = undefined;
	out.y = undefined;

	//the legend box
	//TODO: move legend box drawing to generic build function ?
	out.boxMargin = 10;
	out.boxPadding = 7;
	out.boxCornerRad = 7;
	out.boxFill = "#eeeeee";
	out.boxOpacity = 0.5;

	//font
	out.fontFamily = "Helvetica, Arial, sans-serif";

	//legend title
	out.title = "";
	out.titleFontSize = 15;
	out.titleWidth = 140;

	//legend element labels
	out.labelFontSize = 12;
	out.labelDelim = " - "; //TODO still needed ?
	out.labelWrap = 140; //TODO still needed?
	out.labelDecNb = 2;
	out.labelOffset = 5;

	//TODO: move those to the legends where it is used, only?
	out.ascending = true;
	out.shapeWidth = 13;
	out.shapeHeight = 15;
	out.shapePadding = 5;

	//override attribute values with config values
	if(config) for (let key in config) out[key] = config[key];

	/**
	 * Build legend element.
	 */
	out.build = function () {

		//set SVG element
		out.svg = select("#" + out.svgId);

		//set size
		//TODO use instead https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox
		if (!out.width) out.width = out.computeWidth();
		if (!out.height) out.height = out.computeHeight();
	}

	/**
	 * Update the legend element.
	 * This is an abstract method.
	 */
	out.update = function () {
		console.log("Legend update function not implemented")
		return out;
	};

	//TODO use instead https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox
	/**
	 * Return a default value for the legend width.
	 * This is an abstract method.
	 */
	out.computeWidth = function () {
		console.log("Legend computeWidth not implemented")
		return 100;
	}

	//TODO use instead https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getBBox
	/**
	 * Return a default value for the legend height.
	 * This is an abstract method.
	 */
	out.computeHeight = function () {
		console.log("Legend computeHeight not implemented")
		return 100;
	}

	return out;
}
