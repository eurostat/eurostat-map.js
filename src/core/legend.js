import { select } from "d3-selection";

/**
 * A eurostat-map legend. This is an abstract method.
 * A legend is provided as an independant g element to be nested within a SVG image.
*/
export const legend = function (map) {
	const out = {};

	out.map_ = map;

	//the SVG 'g' element where to make the legend
	out.gId_ = "legend_" + Math.round(10e15 * Math.random());
	out.g_ = null;

	//the legend element dimension
	out.width = null;
	out.height = null;

	//the legend box
	out.boxMargin = 10;
	out.boxPadding = 10;
	out.boxCornerRad = 10;
	out.boxFill = "#eeeeee";
	out.boxOpacity = 0.5;

	out.fontFamily = "Helvetica, Arial, sans-serif";

	//legend title
	out.titleText = "Legend";
	out.titleFontSize = 17;
	out.titleWidth = 140;

	//legeng element labels
	out.labelFontSize = 13;
	out.labelDelim = " - ";
	out.labelWrap = 140;
	out.labelDecNb = 2;
	out.labelOffset = 5;

	//TODO: move those to the legends where it is used, only?
	out.ascending = true;
	out.shapeWidth = 15;
	out.shapeHeight = 13;
	out.shapePadding = 2;


	/**
	 * Private variables.
	 */


	/**
	 * Build legend element.
	 */
	out.build = function () {

		//set SVG group
		//TODO use d3.create ?
		out.g_ = select("#" + out.gId_);

		//set size
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

	/**
	 * Return a default value for the legend width.
	 * This is an abstract method.
	 */
	out.computeWidth = function () {
		console.log("Legend computeWidth not implemented")
		return 100;
	}

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
