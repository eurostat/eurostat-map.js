import { select } from "d3-selection";


/**
 * A eurostat-map legend. This is an abstract method.
 * A legend is provided as an independant g element to be nested within a SVG image.
*/
export const legend = function (map) {
	const out = {};

	out.map_ = map;

	out.gId_ = "legend_" + Math.round(10e15*Math.random());
	out.g_ = undefined;

	out.width_ = undefined;
	out.height_ = undefined;
	out.position_ = undefined;

	out.boxMargin_ = 10;
	out.boxPadding_ = 10;
	out.boxCornerRadius_ = out.boxPadding_;
	out.boxFill_ = "#EEEEEE";
	out.boxOpacity_ = 0.5;

	out.fontFamily_ = "Helvetica, Arial, sans-serif";
	out.titleText_ = "Legend";
	out.titleFontSize_ = 17;
	out.titleWidth_ = 140;

	out.ascending_ = true;
	out.shapeWidth_ = 15;
	out.shapeHeight_ = 13;
	out.shapePadding_ = 2;
	out.labelFontSize_ = 13;
	out.labelDelimiter_ = " - ";
	out.labelWrap_ = 140;
	out.labelDecNb_ = 2;
	out.labelOffset_ = 5;

	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	for (let att in out)
		(function () {
			const att_ = att;
			out[att_.substring(0, att_.length - 1)] = function (v) { if (!arguments.length) return out[att_]; out[att_] = v; return out.map(); };
		})();


	/**
	 * Private variables.
	 */


	/**
	 * Build legeng element.
	 */
	out.build = function () {

		//create svg
		out.g( select("#" + out.gId()) );

		//set size
		if(!out.width_) out.width_ = out.computeWidth();
		if(!out.height_) out.height_ = out.computeHeight();

		//set position
		if(!out.position_) out.position_ = out.computePosition();
		out.g().attr("transform", "translate(" + out.position()[0] + "," + out.position()[1] + ")");
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
	out.computeWidth = function() {
		console.log("Legend computeWidth not implemented")
		return 100;
	}

	/**
	 * Return a default value for the legend height.
	 * This is an abstract method.
	 */
	out.computeHeight = function() {
		console.log("Legend computeHeight not implemented")
		return 100;
	}

	/**
	 * Return a default value for the legend position.
	 * This is an abstract method.
	 */
	out.computePosition = function() {
		console.log("Legend computePosition not implemented")
		return [0,0];
	}

	return out;
}