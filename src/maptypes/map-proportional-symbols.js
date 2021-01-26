import { scaleSqrt, scaleQuantile, scaleQuantize, scaleThreshold } from "d3-scale";
import { select } from "d3-selection";
import { interpolateBlues } from "d3-scale-chromatic";
import * as smap from '../core/stat-map';
import * as lgps from '../legend/legend-proportional-symbols';
import { symbol, symbolCircle, symbolDiamond, symbolStar, symbolCross, symbolSquare, symbolTriangle, symbolWye } from 'd3-shape';

/**
 * Returns a proportionnal symbol map.
 * 
 * @param {*} config 
 */
export const map = function (config) {

	//create map object to return, using the template
	const out = smap.statMap(config, true);

	out.psShape_ = "circle"; // accepted values: circle, bar, square, star, diamond, wye, cross or custom
	out.psCustomShape_; // see http://using-d3js.com/05_10_symbols.html#h_66iIQ5sJIT
	out.psMaxSize_ = 30;
	out.psMinSize_ = 1; //for circle
	out.psBarWidth_ = 5; //for vertical bars
	out.psMinValue_ = 0;
	out.psFill_ = "#B45F04"; //same fill for all symbols
	out.psFillOpacity_ = 0.7;
	out.psStroke_ = "#fff";
	out.psStrokeWidth_ = 0.3;
	//colour
	out.psClasses_ = 5; // number of classes to use for colouring
	out.psColorFun_ = interpolateBlues;
	out.noDataFillStyle_ = "darkgray"; //style for no data regions

	//the threshold, when the classificatio method is 'threshold'
	out.threshold_ = [0];
	//the classification method
	out.classifMethod_ = "quantile"; // or: equinter, threshold
	//when computed automatically, ensure the threshold are nice rounded values
	out.makeClassifNice_ = true;
	//the classifier: a function which return the symbol size/color from the stat value.
	out.classifierSize_ = undefined;
	out.classifierColor_ = undefined;
	//specific tooltip text function
	out.tooltipText_ = tooltipTextFunPs;

	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	["psMaxSize_", "psMinSize_", "psMinValue_", "psFill_", "psFillOpacity_", "psStroke_", "psStrokeWidth_", "classifierSize_", "classifierColor_",
		"psShape_", "psCustomShape_", "psBarWidth_", "classToFillStyle_", "psColorFun_", "noDataFillStyle_", "threshold_"]
		.forEach(function (att) {
			out[att.substring(0, att.length - 1)] = function (v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
		});

	//override attribute values with config values
	if (config) ["psMaxSize", "psMinSize", "psMinValue", "psFill", "psFillOpacity", "psStroke", "psStrokeWidth", "classifierSize", "classifierColor",
		"psShape", "psCustomShape", "psBarWidth", "classToFillStyle", "psColorFun", "noDataFillStyle", "threshold"].forEach(function (key) {
			if (config[key] != undefined) out[key](config[key]);
		});

	//@override
	out.updateClassification = function () {

		//define classifiers for sizing and colouring (out.classifierSize_ & out.classifierColor_)
		defineClassifiers();

		if (out.classifierColor_) {
			//assign color class to each symbol, based on their value
			// at this point, the symbol path hasnt been appended. Only the parent g.symbol element (in map-template)
			out.svg().selectAll(".symbol")
				.attr("ecl", function (rg) {
					const sv = out.statData("color").get(rg.properties.id);
					if (!sv) return "nd";
					const v = sv.value;
					if (v != 0 && !v) return "nd";
					let c = +out.classifierColor()(+v);
					return c
				})
		}

		return out;
	};


	function defineClassifiers() {
		//simply return the array [0,1,2,3,...,nb-1]
		const getA = function (nb) { return [...Array(nb).keys()]; }

		let sizeDomain = out.statData("size") ? [out.statData("size").getMin(), out.statData("size").getMax()] : [out.statData().getMin(), out.statData().getMax()];
		out.classifierSize(scaleSqrt().domain(sizeDomain).range([out.psMinSize_, out.psMaxSize_]));


		if (out.statData("color")) {
			//use suitable classification type for colouring
			if (out.classifMethod_ === "quantile") {
				//https://github.com/d3/d3-scale#quantile-scales
				const domain = out.statData("color").getArray();
				const range = getA(out.psClasses_);
				out.classifierColor(scaleQuantile().domain(domain).range(range));
			} else if (out.classifMethod_ === "equinter") {
				//https://github.com/d3/d3-scale#quantize-scales
				const domain = out.statData("color").getArray();
				const range = getA(out.psClasses_);
				out.classifierColor(scaleQuantize().domain([min(domain), max(domain)]).range(range));
				if (out.makeClassifNice_) out.classifierColor().nice();
			} else if (out.classifMethod_ === "threshold") {
				//https://github.com/d3/d3-scale#threshold-scales
				out.psClasses_(out.threshold().length + 1);
				const range = getA(out.psClasses_);
				out.classifierColor(scaleThreshold().domain(out.threshold()).range(range));
			}

		}

	}

	//@override
	out.updateStyle = function () {
		//see https://bl.ocks.org/mbostock/4342045 and https://bost.ocks.org/mike/bubble-map/

		//define style per class
		if (!out.classToFillStyle())
			out.classToFillStyle(getColorLegend(out.psColorFun()))

		// vertical bars
		if (out.psShape_ == "bar") {
			let rect = out.svg().select("#g_ps").selectAll("g.symbol")
				.append("rect");
			rect.style("fill", out.psFill())
				.style("fill-opacity", out.psFillOpacity())
				.style("stroke", out.psStroke())
				.style("stroke-width", out.psStrokeWidth())
				.attr("width", out.psBarWidth_)
				//for vertical bars we scale the height attribute using the classifier
				.attr("height", function (rg) {
					const s = out.statData("size") ? out.statData("size") : out.statData();
					const sv = s.get(rg.properties.id);
					if (!sv || !sv.value) {
						return 0;
					}
					let v = out.classifierSize_(+sv.value);
					return v;
				})
				.attr('transform', function () {
					let bRect = this.getBoundingClientRect();
					return `translate(${-this.getAttribute('width') / 2}` +
						`, -${this.getAttribute('height')})`;
				})
				.transition().duration(out.transitionDuration())
		} else {
			// d3.symbol symbols
			// circle, cross, star, triangle, diamond, square, wye or custom

			let path = out.svg().select("#g_ps").selectAll("g.symbol")
				.append("path").attr("class", "ps");

			// we define the d attribute of the path as the d3 symbol
			path.attr("d", rg => {
				const v = out.statData("size") ? out.statData("size") : out.statData();
				const sv = v.get(rg.properties.id);
				let size;

				//calculate size
				if (!sv || !sv.value) {
					size = 0;
				} else {
					size = out.classifierSize_(+sv.value);
				}

				//apply size to shape
				if (out.psCustomShape_) {
					return out.psCustomShape_.size(size * size)()
				} else {
					const symbolType = symbolsLibrary[out.psShape_] || symbolsLibrary["circle"];
					return symbol().type(symbolType).size(size * size)()
				}
			})

				// apply color
				.style("fill", function () {
					// use colour classifier when applicable
					if (out.classifierColor_) {
						//for ps, ecl attribute belongs to the parent g.symbol node created in map-template
						var ecl = select(this.parentNode).attr("ecl");
						if (!ecl || ecl === "nd") return out.noDataFillStyle() || "gray";
						return out.classToFillStyle()(ecl, out.psClasses_);
					} else {
						return out.psFill();
					}
				})
				.style("fill-opacity", out.psFillOpacity())
				.style("stroke", out.psStroke())
				.style("stroke-width", out.psStrokeWidth())
		}
		return out;
	};


	//@override
	out.getLegendConstructor = function () {
		return lgps.legend;
	}

	return out;
}

//build a color legend object
export const getColorLegend = function (colorFun) {
	colorFun = colorFun || interpolateYlOrRd;
	return function (ecl, clnb) { return colorFun(ecl / (clnb - 1)); }
}

/**
* @description give a d3 symbol from a shape name
*/
export const symbolsLibrary = {
	cross: symbolCross,
	square: symbolSquare,
	diamond: symbolDiamond,
	triangle: symbolTriangle,
	star: symbolStar,
	wye: symbolWye,
	circle: symbolCircle,
}


/**
 * Specific function for tooltip text.
 * 
 * @param {*} rg The region to show information on.
 * @param {*} map The map element
 */
const tooltipTextFunPs = function (rg, map) {
	const buf = [];
	//region name
	buf.push("<b>" + rg.properties.na + "</b><br>");

	//stat 1 value
	const v1 = map.statData("size") ? map.statData("size") : map.statData();
	const sv1 = v1.get(rg.properties.id);
	if (!sv1 || (sv1.value != 0 && !sv1.value)) buf.push(map.noDataText_);
	else {
		buf.push(sv1.value);
		//unit 1
		const unit1 = v1.unitText();
		if (unit1) buf.push(" " + unit1);
	}
	buf.push("<br>");


	//stat 2 value
	if (map.statData("color")) {
		const sv2 = map.statData("color").get(rg.properties.id);
		if (!sv2 || (sv2.value != 0 && !sv2.value)) buf.push(map.noDataText_);
		else {
			buf.push(sv2.value);
			//unit 2
			const unit2 = map.statData("color").unitText();
			if (unit2) buf.push(" " + unit2);
		}
	}

	return buf.join("");
};
