import { scaleSqrt, scaleQuantile, scaleQuantize, scaleThreshold } from "d3-scale";
import { select } from "d3-selection";
import { interpolateOrRd } from "d3-scale-chromatic";
import * as smap from '../core/stat-map';
import * as lgps from '../legend/legend-proportional-symbols';
import { symbol, symbolCircle, symbolDiamond, symbolStar, symbolCross, symbolSquare, symbolTriangle, symbolWye } from 'd3-shape';
import { spaceAsThousandSeparator } from "../lib/eurostat-map-util";

/**
 * Returns a proportional symbol map.
 * 
 * @param {*} config 
 */
export const map = function (config) {

	//create map object to return, using the template
	const out = smap.statMap(config, true);

	//shape
	out.psShape_ = "circle"; // accepted values: circle, bar, square, star, diamond, wye, cross
	out.psCustomShape_; // see http://using-d3js.com/05_10_symbols.html#h_66iIQ5sJIT
	out.psCustomPath_; // see http://bl.ocks.org/jessihamel/9648495
	out.psOffset_ = { x: 0, y: 0 }

	//size
	out.psMaxSize_ = 30; // max symbol size
	out.psMinSize_ = 5; // min symbol size
	out.psBarWidth_ = 10; //for vertical bars
	out.psMaxValue_ = undefined; // allow the user to manually define the domain of the sizing scale. E.g. if the user wants to use the same scale across different maps.
	out.psMinValue_ = undefined;

	//colour
	out.psFill_ = "#2d50a0"; //same fill for all symbols when no visual variable (setData()) for 'color' is specified
	out.psFillOpacity_ = 0.7;
	out.psStroke_ = "#000";
	out.psStrokeWidth_ = 0.3;
	out.psClasses_ = 5; // number of classes to use for colouring
	out.psColors_ = null; //colours to use for threshold colouring
	out.psColorFun_ = interpolateOrRd;
	out.psClassToFillStyle_ = undefined; //a function returning the color from the class i
	out.noDataFillStyle_ = "lightgray"; //style for no data regions

	//the threshold, when the classification method is 'threshold'
	out.psThreshold_ = [0];
	//the classification method
	out.psClassifMethod_ = "quantile"; // or: equinter, threshold
	//when computed automatically, ensure the threshold are nice rounded values
	out.makeClassifNice_ = true;
	//
	//the classifier: a function which return the symbol size/color from the stat value.
	out.classifierSize_ = undefined;
	out.classifierColor_ = undefined;
	//specific tooltip text function
	out.tooltip_.textFunction = tooltipTextFunPs;

	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	["psMaxSize_", "psMinSize_","psMaxValue_", "psMinValue_", "psFill_", "psFillOpacity_", "psStroke_", "psStrokeWidth_", "classifierSize_", "classifierColor_",
		"psShape_", "psCustomShape_", "psBarWidth_", "psClassToFillStyle_", "psColorFun_", "noDataFillStyle_", "psThreshold_", "psColors_", "psCustomPath_", "psOffset_", "psClassifMethod_", "psClasses_"]
		.forEach(function (att) {
			out[att.substring(0, att.length - 1)] = function (v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
		});

	//override attribute values with config values
	if (config) ["psMaxSize", "psMinSize", "psFill", "psFillOpacity", "psStroke", "psStrokeWidth", "classifierSize", "classifierColor",
		"psShape", "psCustomShape", "psBarWidth", "psClassToFillStyle", "psColorFun", "noDataFillStyle", "psThreshold", "psColors", "psCustomPath", "psOffset", "psClassifMethod", "psClasses"].forEach(function (key) {
			if (config[key] != undefined) out[key](config[key]);
		});

	//override of some special getters/setters
	out.psColorFun = function (v) { if (!arguments.length) return out.psColorFun_; out.psColorFun_ = v; out.psClassToFillStyle_ = getColorLegend(out.psColorFun_, out.psColors_); return out; };
	out.psThreshold = function (v) { if (!arguments.length) return out.psThreshold_; out.psThreshold_ = v; out.psClasses(v.length + 1); return out; };

	//@override
	out.updateClassification = function () {

		//define classifiers for sizing and colouring (out.classifierSize_ & out.classifierColor_)
		defineClassifiers();

		if (out.svg()) {
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
		}

		return out;
	};


	function defineClassifiers() {
		//simply return the array [0,1,2,3,...,nb-1]
		const getA = function (nb) { return [...Array(nb).keys()]; }

		// use size dataset
		let sizeDomain;
		let data = out.statData("size").getArray();
		let min = out.psMinValue_ ? out.psMinValue_ : out.statData("size").getMin();
		let max = out.psMaxValue_ ? out.psMaxValue_ : out.statData("size").getMax();

		sizeDomain = data ? [min, max] : [out.statData().getMin(), out.statData().getMax()];

		out.classifierSize(scaleSqrt().domain(sizeDomain).range([out.psMinSize_, out.psMaxSize_]));

		// colour
		if (out.statData("color").getArray()) {
			//use suitable classification type for colouring
			if (out.psClassifMethod_ === "quantile") {
				//https://github.com/d3/d3-scale#quantile-scales
				const domain = out.statData("color").getArray();
				const range = getA(out.psClasses_);
				out.classifierColor(scaleQuantile().domain(domain).range(range));
			} else if (out.psClassifMethod_ === "equinter") {
				//https://github.com/d3/d3-scale#quantize-scales
				const domain = out.statData("color").getArray();
				const range = getA(out.psClasses_);
				out.classifierColor(scaleQuantize().domain([min(domain), max(domain)]).range(range));
				if (out.makeClassifNice_) out.classifierColor().nice();
			} else if (out.psClassifMethod_ === "threshold") {
				//https://github.com/d3/d3-scale#threshold-scales
				out.psClasses(out.psThreshold().length + 1);
				const range = getA(out.psClasses_);
				out.classifierColor(scaleThreshold().domain(out.psThreshold()).range(range));
			}

		}

	}

	//@override
	out.updateStyle = function () {
		//see https://bl.ocks.org/mbostock/4342045 and https://bost.ocks.org/mike/bubble-map/

		//define style per class
		if (!out.psClassToFillStyle())
			out.psClassToFillStyle(getColorLegend(out.psColorFun_, out.psColors_))

		// symbol selection
		let symb;
		// if size dataset not defined then use default
		let data = out.statData("size").getArray() ? out.statData("size") : out.statData();

		if (out.svg()) {
			//clear previous symbols
			let prevSymbols = out.svg_.selectAll("g.symbol > *");
			prevSymbols.remove();

			//set paths of symbols

			//custom symbol
			if (out.psCustomPath_) {
				symb = out.svg().select("#g_ps").selectAll("g.symbol")
					.append("path").attr("class", "ps").attr("d", out.psCustomPath_).attr('transform', rg => {
						//calculate size
						const sv = data.get(rg.properties.id);
						let size;
						if (!sv || !sv.value) {
							size = 0;
						} else {
							size = out.classifierSize_(+sv.value);
						}
						return `translate(${out.psOffset_.x * size},${out.psOffset_.y * size}) scale(${size})`
					})

				// bars

			} else if (out.psShape_ == "bar") {
				// vertical bars
				symb = out.svg().select("#g_ps").selectAll("g.symbol")
					.append("rect")
					.attr("width", out.psBarWidth_)
					//for vertical bars we scale the height attribute using the classifier
					.attr("height", function (rg) {
						const sv = data.get(rg.properties.id);
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

				symb = out.svg().selectAll("g.symbol")
					.append("path").attr("class", "ps").attr("d", rg => {

						const v = out.statData("size") ? out.statData("size") : out.statData();
						if (!v) return;
						const sv = v.get(rg.properties.id);
						//calculate size
						if (sv != 0 && !sv) return;
						let size = out.classifierSize_(+sv.value) || 0;

						//apply size to shape
						if (out.psCustomShape_) {
							return out.psCustomShape_.size(size * size)()
						} else {
							const symbolType = symbolsLibrary[out.psShape_] || symbolsLibrary["circle"];
							return symbol().type(symbolType).size(size * size)()
						}
					})
			}

			

			// set style of symbols

			 if (out.nutsLvl_ == "mixed") {
				// Toggle symbol visibility - only show regions with stat values when mixing different NUTS levels
				out.svg().selectAll("g.symbol")
					.style("display", function (rg) {
						const sv = data.get(rg.properties.id);
						if (!sv || !sv.value || !out.countriesToShow_.includes(rg.properties.id[0] + rg.properties.id[1])) {
							return "none"
						} else if (out.countriesToShow_.includes(rg.properties.id[0] + rg.properties.id[1])) {
							return "block";
						}
					})

				// nuts border visibility - only show regions with stat values when mixing different NUTS levels
				out.svg().selectAll("path.nutsrg")
				.style("display", function (rg) {
					const sv = data.get(rg.properties.id);
					if (!sv || !sv.value || sv.value==":" || !out.countriesToShow_.includes(rg.properties.id[0] + rg.properties.id[1])) {
						return "none"
					} else if (out.countriesToShow_.includes(rg.properties.id[0] + rg.properties.id[1])) {
						return "block";
					}
				})

				// nuts border stroke
				.style("stroke", function (bn) {
					const lvl = select(this).attr("lvl");
					const sv = data.get(bn.properties.id);
					if (!sv || !sv.value || sv.value==":" || !out.countriesToShow_.includes(bn.properties.id[0] + bn.properties.id[1])) {
						return;
					} else if (out.countriesToShow_.includes(bn.properties.id[0] + bn.properties.id[1])) {
						if (lvl !== "0") {
							return out.nutsbnStroke_[parseInt(lvl)] || "#777";
						}
					}
				})
				// nuts border stroke width
				.style("stroke-width", function (bn) {
					const lvl = select(this).attr("lvl");
					const sv = data.get(bn.properties.id);
					if (!sv || !sv.value || sv.value==":" || !out.countriesToShow_.includes(bn.properties.id[0] + bn.properties.id[1])) {
						return;
					} else if (out.countriesToShow_.includes(bn.properties.id[0] + bn.properties.id[1])) {
						if (lvl !== "0") {
							return out.nutsbnStrokeWidth_[parseInt(lvl)] || "#777";
						}
					}
				});
			 }

			symb.style("fill-opacity", out.psFillOpacity())
				.style("stroke", out.psStroke())
				.style("stroke-width", out.psStrokeWidth())
				.style("fill", function () {
					// use colour classifier when applicable
					if (out.classifierColor_) {
						//for ps, ecl attribute belongs to the parent g.symbol node created in map-template
						const ecl = select(this.parentNode).attr("ecl");
						if (!ecl || ecl === "nd") return out.noDataFillStyle() || "gray";
						let color = out.psClassToFillStyle_(ecl, out.psClasses_);
						return color;
					} else {
						return out.psFill();
					}
				})

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
export const getColorLegend = function (colorFun, colorArray) {
	colorFun = colorFun || interpolateOrRd;
	if (colorArray) {
		return function (ecl, clnb) { return colorArray[ecl]; }
	}
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
	if (rg.properties.id) {
		//name and code
		buf.push("<b>" + rg.properties.na + "</b> (" + rg.properties.id + ") <br>");
	} else {
		//region name
		buf.push("<b>" + rg.properties.na + "</b><br>");
	}

	//stat 1 value
	const v1 = map.statData("size").getArray() ? map.statData("size") : map.statData();
	const sv1 = v1.get(rg.properties.id);
	if (!sv1 || (sv1.value != 0 && !sv1.value)) buf.push(map.noDataText_);
	else {
		buf.push(spaceAsThousandSeparator(sv1.value));
		//unit 1
		const unit1 = v1.unitText();
		if (unit1) buf.push(" " + unit1);
	}
	buf.push("<br>");


	//stat 2 value
	if (map.statData("color").getArray()) {
		const sv2 = map.statData("color").get(rg.properties.id);
		if (!sv2 || (sv2.value != 0 && !sv2.value)) buf.push(map.noDataText_);
		else {
			buf.push(spaceAsThousandSeparator(sv2.value));
			//unit 2
			const unit2 = map.statData("color").unitText();
			if (unit2) buf.push(" " + unit2);
		}
	}

	return buf.join("");
};
