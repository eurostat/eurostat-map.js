import { scaleSqrt, scaleLinear } from "d3-scale";
import { interpolateYlOrBr } from "d3-scale-chromatic";
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
	out.psColorClasses_ = 5;
	out.psColorFun_ = interpolateYlOrBr;
	out.psStroke_ = "#fff";
	out.psStrokeWidth_ = 0.3;
	//the classifier: a function which return the symbol size/color from the stat value.
	out.classifierSize_ = undefined;
	out.classifierColor_ = undefined;

	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	["psMaxSize_", "psMinSize_", "psMinValue_", "psFill_", "psFillOpacity_", "psStroke_", "psStrokeWidth_", "classifierSize_", "classifierColor_", "psShape_", "psCustomShape_", "psBarWidth_"]
		.forEach(function (att) {
			out[att.substring(0, att.length - 1)] = function (v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
		});

	//override attribute values with config values
	if (config) ["psMaxSize", "psMinSize", "psMinValue", "psFill", "psFillOpacity", "psStroke", "psStrokeWidth", "classifierSize_", "classifierColor_", "psShape", "psCustomShape", "psBarWidth"].forEach(function (key) {
		if (config[key] != undefined) out[key](config[key]);
	});

	//@override
	out.updateClassification = function () {

		//define classifiers for sizing and colouring
		//out.classifier(scaleSqrt().domain([out.psMinValue_, maxValue]).range());
		let sizeDomain = [out.statData("size").getMin(), out.statData("size").getMax()];
		let colorDomain = [out.statData("color").getMin(), out.statData("color").getMax()];
		out.classifierSize(scaleSqrt().domain(sizeDomain).range([out.psMinSize_, out.psMaxSize_]));
		out.classifierColor(scaleLinear().domain(colorDomain).range([...Array(out.psColorClasses_).keys()]));

		//assign color class to each symbol, based on their value
		out.svg().selectAll("path.ps")
			.attr("ecl", function (rg) {
				const sv = out.statData("color").get(rg.properties.id);
				if (!sv) return "nd";
				const v = sv.value;
				if (v != 0 && !v) return "nd";
				return +out.classifierColor()(+v);
			})

		return out;
	};



	//@override
	out.updateStyle = function () {
		//see https://bl.ocks.org/mbostock/4342045 and https://bost.ocks.org/mike/bubble-map/

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
					const sv = out.statData().get(rg.properties.id);
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
				const sv = out.statData("size").get(rg.properties.id);
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
				.style("fill", d => {
					if (out.classifierColor_) {
						const sv = out.statData("color").get(d.properties.id);
						//calculate color
						let color;
						if (!sv || !sv.value) {
							color = 0;
						} else {
							color = out.classifierColor_(+sv.value)
						}
						return out.psColorFun_(color);
					} else {
						return out.psFill(); //single color for all symbols
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
