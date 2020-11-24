import { select } from "d3-selection";
import { scaleOrdinal } from "d3-scale";
import * as mt from '../eurostat-map-template';
import * as lgct from '../legend/legend-categorical';


export const map = function () {

	//create map object to return, using the template
	var out = mt.mapTemplate();

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
	["classToFillStyleCT_","classToText_","classifier_","classifierInverse_"]
	.forEach(function(att) {
		out[att.substring(0, att.length - 1)] = function (v) { if (!arguments.length) return out[att]; out[att] = v; return out; };
	});



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



    	/**
	 * Update the map after classification attributes have been changed.
	 * For example, if the number of classes, or the classification method has changed, call this method to update the map.
	*/
	out.updateClassificationAndStyle = function () {

		//simply return the array [0,1,2,3,...,nb-1]
		//TODO: use 'range' ?
		var getA = function (nb) { var a = []; for (var i = 0; i < nb; i++) a.push(i); return a; }

			//get unique values
			var dom = out._values.filter(function (item, i, ar) { return ar.indexOf(item) === i; });
			out.clnb(dom.length);
			var rg = getA(out.clnb_);
			out.classifier(scaleOrdinal().domain(dom).range(rg));
			out.classifierInverse(scaleOrdinal().domain(rg).range(dom));

			//assign class to nuts regions, based on their value
			out.svg().selectAll("path.nutsrg")
				.attr("ecl", function (rg) {
					var v = rg.properties.val;
					if (v != 0 && !v) return "nd";
					return +out.classifier_(isNaN(v) ? v : +v);
				})

		//update legend, if any
		if(out.legend_) out.legend().update();

		//update style
		out.updateStyle();

		return out;
	};



	/**
	 * Update the map after styling attributes have been changed.
	 * For example, if the style (color?) for one legend element has changed, call this method to update the map.
	*/
	out.updateStyle = function () {

			//apply style to nuts regions depending on class
			out.svg().selectAll("path.nutsrg")
				.attr("fill", function () {
					var ecl = select(this).attr("ecl");
					if (!ecl || ecl === "nd") return out.noDataFillStyle_ || "gray";
					if (out.type_ == "ch") return out.classToFillStyleCH_(ecl, out.clnb_);
					if (out.type_ == "ct") { return out.classToFillStyleCT_[out.classifierInverse()(ecl)] || out.noDataFillStyle_ || "gray"; }
					return out.noDataFillStyle_ || "gray";
				});

		return out;
	};

    return out;
}
