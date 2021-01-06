import { select } from "d3-selection";
import { min, max } from "d3-array";
import { scaleQuantile, scaleQuantize, scaleThreshold } from "d3-scale";
import { interpolateYlOrBr } from "d3-scale-chromatic";
import * as smap from '../core/stat-map';
import * as lgch from '../legend/legend-choropleth';

/**
 * Returns a chroropleth map.
 * 
 * @param {*} config 
 */
export const map = function (config) {

	//create map object to return, using the template
	const out = smap.statMap(config);

	//the number of classes
	out.clnb_ = 7;
	//the classification method
	out.classifMethod_ = "quantile"; // or: equinter, threshold
	//the threshold, when the classificatio method is 'threshold'
	out.threshold_ = [0];
	//when computed automatically, ensure the threshold are nice rounded values
	out.makeClassifNice_ = true;
	//the color function [0,1] -> color
	out.colorFun_ = interpolateYlOrBr;
	//a function returning the color from the class i
	out.classToFillStyle_ = getColorLegend(out.colorFun_);
	//style for no data regions
	out.noDataFillStyle_ = "darkgray";
	//the classifier: a function which return a class number from a stat value.
	out.classifier_ = undefined;

	//override attribute values with config values
	if(config) for (let key in config) out[key+"_"] = config[key];

	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	["clnb_", "classifMethod_", "threshold_", "makeClassifNice_", "colorFun_", "classToFillStyle_", "noDataFillStyle_", "classifier_"]
		.forEach(function (att) {
			out[att.substring(0, att.length - 1)] = function(v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
		}
	);

	//override of some special getters/setters
	out.colorFun = function (v) { if (!arguments.length) return out.colorFun_; out.colorFun_ = v; out.classToFillStyle_ = getColorLegend(out.colorFun_); return out; };
	out.threshold = function (v) { if (!arguments.length) return out.threshold_; out.threshold_ = v; out.clnb(v.length + 1); return out; };


	//@override
	out.updateClassification = function () {

		//simply return the array [0,1,2,3,...,nb-1]
		//TODO: use 'range' ?
		const getA = function (nb) { const a = []; for (let i = 0; i < nb; i++) a.push(i); return a; }

		//TODO: make it possible to use continuous color ramps?

		//use suitable classification type
		if (out.classifMethod_ === "quantile") {
			//https://github.com/d3/d3-scale#quantile-scales
			const statValues = out.stat().getArray();
			out.classifier(scaleQuantile().domain(statValues).range(getA(out.clnb_)));
		} else if (out.classifMethod_ === "equinter") {
			//https://github.com/d3/d3-scale#quantize-scales
			const statValues = out.stat().getArray();
			out.classifier(scaleQuantize().domain([min(statValues), max(statValues)]).range(getA(out.clnb_)));
			if (out.makeClassifNice_) out.classifier().nice();
		} else if (out.classifMethod_ === "threshold") {
			//https://github.com/d3/d3-scale#threshold-scales
			out.clnb(out.threshold_.length + 1);
			out.classifier(scaleThreshold().domain(out.threshold_).range(getA(out.clnb_)));
		}

		//assign class to nuts regions, based on their value
		out.svg().selectAll("path.nutsrg")
			.attr("ecl", function (rg) {
				const sv = out.stat().get(rg.properties.id);
				if (!sv) return "nd";
				const v = sv.value;
				if (v != 0 && !v) return "nd";
				return +out.classifier_(+v);
			})

		return out;
	};


	//@override
	out.updateStyle = function () {

		//apply style to nuts regions depending on class
		out.svg().selectAll("path.nutsrg")
			.transition().duration(out.transitionDuration())
			.attr("fill", function () {
				const ecl = select(this).attr("ecl");
				if (!ecl || ecl === "nd") return out.noDataFillStyle_ || "gray";
				return out.classToFillStyle_(ecl, out.clnb_);
			});

		return out;
	};


	//@override
	out.getLegendConstructor = function() {
		return lgch.legendChoropleth;
	}

	return out;
}



//build a color legend object
export const getColorLegend = function (colorFun) {
	colorFun = colorFun || interpolateYlOrRd;
	return function (ecl, clnb) { return colorFun(ecl / (clnb - 1)); }
}
