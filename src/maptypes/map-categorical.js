import { select } from "d3-selection";
import { scaleOrdinal } from "d3-scale";
import * as mt from '../map-template';
import * as lgct from '../legend/legend-categorical';


export const map = function () {

	//create map object to return, using the template
	const out = mt.mapTemplate();

	out.clnb_ = 7;
	out.classToFillStyleCT_ = undefined;
	out.classToText_ = undefined;
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
	["clnb_","classToFillStyleCT_","classToText_","classifier_","classifierInverse_"]
	.forEach(function(att) {
		out[att.substring(0, att.length - 1)] = function (v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
	});

	//override of some special getters/setters
    out.legend = function (v) {
		if (!arguments.length) {
			//create legend if needed
			if(!out.legend_) out.legend_ = lgct.legendCategorical(out);
			return out.legend_;
		}
		//setter: link map and legend
		out.legend_ = v; v.map(out);
		return out;
	};


	//@override
	out.updateClassification = function () {

		//simply return the array [0,1,2,3,...,nb-1]
		//TODO: use 'range' ?
		const getA = function (nb) { const a = []; for (let i = 0; i < nb; i++) a.push(i); return a; }

		//get unique values
		const dom = out._values.filter(function (item, i, ar) { return ar.indexOf(item) === i; });
		out.clnb(dom.length);
		const rg = getA(out.clnb_);
		out.classifier(scaleOrdinal().domain(dom).range(rg));
		out.classifierInverse(scaleOrdinal().domain(rg).range(dom));

		//assign class to nuts regions, based on their value
		out.svg().selectAll("path.nutsrg")
			.attr("ecl", function (rg) {
				const sv = out.getStat(rg.properties.id);
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
		const sv = out.getStat(rg.properties.id);
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
