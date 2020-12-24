import { select } from "d3-selection";
import { scaleOrdinal } from "d3-scale";
import * as smap from '../core/stat-map';
import * as lgct from '../legend/legend-categorical';


export const map = function () {

	//create map object to return, using the template
	const out = smap.statMap();

	out.classToFillStyleCT_ = undefined;
	out.classToText_ = undefined;
	out.noDataFillStyle_ = "lightgray";
	out.legend_ = lgct.legendCategorical(out);

	//the classifier: a function which return a class number from a stat value.
	out.classifier_ = undefined;
	//the inverse classifier: a function returning the category value from the category class (used only for categorical maps).
	out.classifierInverse_ = undefined;

	/**
	 * Definition of getters/setters for all previously defined attributes.
	 * Each method follow the same pattern:
	 *  - There is a single method as getter/setter of each attribute. The name of this method is the attribute name, without the trailing "_" character.
	 *  - To get the attribute value, call the method without argument.
	 *  - To set the attribute value, call the same method with the new value as single argument.
	*/
	["classToFillStyleCT_","classToText_","noDataFillStyle_","classifier_","classifierInverse_"]
	.forEach(function(att) {
		out[att.substring(0, att.length - 1)] = function (v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
	});

	//override of some special getters/setters
    out.legend = function (config) {
		if (!arguments.length) {
			//create legend if needed
			if(!out.legend_) {
				out.legend_ = lgct.legendCategorical(out);
			}
			return out.legend_;
		}

		for (let key in config) {
			out.legend_[key] = config[key];
		  }

		//setter: link map and legend
		// out.legend_ = v; 
		// v.map(out);
		return out;
	};



	//@override
	out.updateClassification = function () {

		//simply return the array [0,1,2,3,...,nb-1]
		//TODO: use 'range' ?
		const getA = function (nb) { const a = []; for (let i = 0; i < nb; i++) a.push(i); return a; }

		//get domain: unique values
		const dom = out.stat().getUniqueValues();

		const rg = getA(dom.length);
		out.classifier(scaleOrdinal().domain(dom).range(rg));
		out.classifierInverse(scaleOrdinal().domain(rg).range(dom));

		//assign class to nuts regions, based on their value
		out.svg().selectAll("path.nutsrg")
			.attr("ecl", function (rg) {
				const sv = out.stat().get(rg.properties.id);
				if (!sv) return "nd";
				const v = sv.value;
				if (v != 0 && !v) return "nd";
				return +out.classifier_(isNaN(v) ? v : +v);
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
				return out.classToFillStyleCT_[out.classifierInverse()(ecl)] || out.noDataFillStyle_ || "gray";
		});

		return out;
	};


	/**
	 * Specific function for tooltip text.
	 * 
	 * @param {*} rg 
	 * @param {*} map 
	 */
	out.tooltipText_ = function (rg, map) {
		const buf = [];
		//region name
		buf.push("<b>" + rg.properties.na + "</b><br>");
		//get stat value
		const sv = out.stat().get(rg.properties.id);
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

	return out;
}
