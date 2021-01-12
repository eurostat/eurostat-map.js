import { scaleSqrt } from "d3-scale";
import * as smap from '../core/stat-map';
import * as lgps from '../legend/legend-proportional-symbols';
import { symbol, symbolDiamond, symbolStar, symbolCross, symbolSquare, symbolTriangle, symbolWye } from 'd3-shape';

/**
 * Returns a proportionnal symbol map.
 * 
 * @param {*} config 
 */
export const map = function (config) {

	//create map object to return, using the template
	const out = smap.statMap(config, true);

	out.psShape_ = "circle"; // accepted values: circle, rectangle, square, star, diamond, wye, cross or custom
	out.psCustomShape_; // see http://using-d3js.com/05_10_symbols.html#h_66iIQ5sJIT
	out.psMaxSize_ = 30;
	out.psMinSize_ = 0.8; //for circle
	out.psWidth_ = 5; //for rect
	out.psMinHeight_ = 5;
	out.psMaxHeight_ = 150;
	out.psMinValue_ = 0;
	out.psFill_ = "#B45F04";
	out.psFillOpacity_ = 0.7;
	out.psStroke_ = "#fff";
	out.psStrokeWidth_ = 0.3;
	//the classifier: a function which return a class number from a stat value.
	out.classifier_ = undefined;

	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	["psMaxSize_", "psMinSize_", "psMinValue_", "psFill_", "psFillOpacity_", "psStroke_", "psStrokeWidth_", "classifier_", "psShape_", "psCustomShape_"]
		.forEach(function (att) {
			out[att.substring(0, att.length - 1)] = function (v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
		});

	//override attribute values with config values
	if(config) ["psMaxSize", "psMinSize", "psMinValue", "psFill", "psFillOpacity", "psStroke", "psStrokeWidth", "classifier", "psShape", "psCustomShape"].forEach(function (key) {
		if(config[key]!=undefined) out[key](config[key]);
	});

	//@override
	out.updateClassification = function () {
		//get max value
		const maxValue = out.statData().getMax();
		//define classifier
		if (out.psShape_ == "rectangle") {
			out.classifier(scaleSqrt().domain([out.psMinValue_, maxValue]).range([out.psMinHeight_ * 0.5, out.psMaxHeight_ * 0.5]));
		} else {
			out.classifier(scaleSqrt().domain([out.psMinValue_, maxValue]).range([out.psMinSize_ * 0.5, out.psMaxSize_ * 0.5]));
		}
		return out;
	};



	//@override
	out.updateStyle = function () {
		//see https://bl.ocks.org/mbostock/4342045 and https://bost.ocks.org/mike/bubble-map/

		//set circle Size depending on stat value
		if (out.psShape_ == "circle") {
			out.svg().select("#g_ps").selectAll("g.symbol")
				.append("circle")
				//TODO no need to execute that everytime stat values change - should be extracted somewhere else. Use a new "updateStaticStyle" function?
				.style("fill", out.psFill())
				.style("fill-opacity", out.psFillOpacity())
				.style("stroke", out.psStroke())
				.style("stroke-width", out.psStrokeWidth())

				.transition().duration(out.transitionDuration())
				.attr("r", function (rg) {
					const sv = out.getStat(rg.properties.id);
					if (!sv || !sv.value) return 0;
					return out.classifier()(+sv.value);
				})
		} else if (out.psShape_ == "rectangle") {
			let rect = out.svg().select("#g_ps").selectAll("g.symbol")
				.append("rect");

			rect.style("fill", out.psFill())
				.style("fill-opacity", out.psFillOpacity())
				.style("stroke", out.psStroke())
				.style("stroke-width", out.psStrokeWidth())
				.attr("width", out.psWidth_)
				.attr("height", function (rg) {
					const sv = out.getStat(rg.properties.id);
					if (!sv || !sv.value) {
						return 0;
					}
					let v = out.classifier()(+sv.value);
					return v;
				})
				.attr('transform', function () {
					let bRect = this.getBoundingClientRect();
					//console.log(bRect)
					return `translate(${-this.getAttribute('width') / 2}` +
						`, -${this.getAttribute('height')})`;
				})
				.transition().duration(out.transitionDuration())
		} else {
			// d3.symbol symbols
			// circle, cross, star, triangle, diamond, square, wye

			let path = out.svg().select("#g_ps").selectAll("g.symbol")
				.append("path");

			let symbolType;
			if (out.psShape_ == "cross") {
				symbolType = symbolCross;
			} else if (out.psShape_ == "square") {
				symbolType = symbolSquare;
			} else if (out.psShape_ == "diamond") {
				symbolType = symbolDiamond;
			} else if (out.psShape_ == "triangle") {
				symbolType = symbolTriangle;
			} else if (out.psShape_ == "star") {
				symbolType = symbolStar;
			} else if (out.psShape_ == "wye") {
				symbolType = symbolWye;
			} else if (out.psShape_ == "custom") {
				symbolType = symbolWye;
			} else {
				symbolType = symbolCircle;
			}


			path.attr("d", rg => {
				const sv = out.statData().get(rg.properties.id);
				let size;
				if (!sv || !sv.value) {
					size = 0;
				} else {
					size = out.classifier()(+sv.value);
				}
				if (out.psCustomShape_) {
					return out.psCustomShape_.size(size * size)()
				} else {
					return symbol().type(symbolType).size(size * size)()
				}

			})
				.style("fill", out.psFill())
				.style("fill-opacity", out.psFillOpacity())
				.style("stroke", out.psStroke())
				.style("stroke-width", out.psStrokeWidth())
		}

		return out;
	};


	//@override
	out.getLegendConstructor = function() {
		return lgps.legendProportionalSymbols;
	}


	return out;
}
