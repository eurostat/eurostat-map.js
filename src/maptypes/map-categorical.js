import { select } from "d3-selection";
import { scaleOrdinal } from "d3-scale";
import * as smap from '../core/stat-map';
import * as lgct from '../legend/legend-categorical';

/**
 * Returns a categorical map.
 * 
 * @param {*} config 
 */
export const map = function (config) {

	//create map object to return, using the template
	const out = smap.statMap(config);

	/** Fill style for each category/class. Ex.: { urb: "#fdb462", int: "#ffffb3", rur: "#ccebc5" } */
	out.classToFillStyle_ = undefined;
	/** Text label for each category/class. Ex.: { "urb": "Urban", "int": "Intermediate", "rur": "Rural" } */
	out.classToText_ = undefined;
	/** The color for non data regions */
	out.noDataFillStyle_ = "darkgray";
	//specific tooltip text function
	out.tooltipText_ = tooltipTextFunCat;

	//override attribute values with config values
	if(config) for (let key in config) out[key+"_"] = config[key];

	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	["classToFillStyle_","classToText_","noDataFillStyle_"]
	.forEach(function(att) {
		out[att.substring(0, att.length - 1)] = function (v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
	});

	//the classifier: a function which return a class number from a stat value.
	let classifier = undefined;

	//@override
	out.updateClassification = function () {

		//get domain (unique values)
		const domain = out.statData("stat").getUniqueValues();

		//get range [0,1,2,3,...,domain.length-1]
		const range = [...Array(domain.length).keys()];

		//make classifier
		classifier = scaleOrdinal().domain(domain).range(range);

		//assign class to nuts regions, based on their value
		out.svg().selectAll("path.nutsrg")
			.attr("ecl", function (rg) {
				const sv = out.statData("stat").get(rg.properties.id);
				if (!sv) return "nd";
				const v = sv.value;
				if (v != 0 && !v) return "nd";
				return +classifier(isNaN(v) ? v : +v);
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
				return out.classToFillStyle_[classifier.domain()[ecl]] || out.noDataFillStyle_ || "gray";
		});

		return out;
	};


	//@override
	out.getLegendConstructor = function() {
		return lgct.legendCategorical;
	}


	return out;
}


/**
 * Specific function for tooltip text.
 * 
 * @param {*} rg The region to show information on.
 * @param {*} map The map element
 */
const tooltipTextFunCat = function (rg, map) {
	const buf = [];
	//region name
	buf.push("<b>" + rg.properties.na + "</b><br>");
	//get stat value
	const sv = map.statData("stat").get(rg.properties.id);
	//case when no data available
	if (!sv || (sv.value != 0 && !sv.value)) {
		buf.push(map.noDataText_);
		return buf.join("");
	}
	const val = sv.value;
	if (map.classToText_) {
		const lbl = map.classToText_[val];
		buf.push(lbl ? lbl : val);
		return buf.join("");
	}
	//display value
	buf.push(val);
	return buf.join("");
};
