import { min, max } from "d3-array";
import { select } from "d3-selection";
import { scaleQuantile, scaleQuantize, scaleThreshold } from "d3-scale";
import { interpolateYlOrBr } from "d3-scale-chromatic";

import * as mt from './eurostat-map-template';
import * as lgch from './legend/legend-choropleth';


export const map = function () {

	//the map object to return
	var out = mt.mapTemplate();

	//choropleth map
	out.classifMethod_ = "quantile"; // or: equinter  threshold
	out.threshold_ = [0];
	out.makeClassifNice_ = true;
	out.clnb_ = 7;
	out.colorFun_ = interpolateYlOrBr;
	out.classToFillStyleCH_ = getColorLegend(out.colorFun_);
	out.filtersDefinitionFun_ = function () { };
	out.noDataFillStyle_ = "lightgray";
	out.noDataText_ = "No data available";

	//the classifier: a function which return a class number from a stat value.
	out.classifier_ = undefined;

    //TODO add getters and setters


   	//override of some special getters/setters
	out.colorFun = function (v) { if (!arguments.length) return out.colorFun_; out.colorFun_ = v; out.classToFillStyleCH_ = getColorLegend(out.colorFun_); return out; };
	out.threshold = function (v) { if (!arguments.length) return out.threshold_; out.threshold_ = v; out.clnb(v.length + 1); return out; };


	out.legend = function (v) {
		if (!arguments.length) {
			//create legend if needed
			if(!out.legend_) out.legend_ = lgch.legendChoropleth(out);
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

			//TODO: make it possible to use continuous color ramps?

			//use suitable classification type
			if (out.classifMethod_ === "quantile") {
				//https://github.com/d3/d3-scale#quantile-scales
				out.classifier( scaleQuantile().domain(out._values).range(getA(out.clnb_)) );
			} else if (out.classifMethod_ === "equinter") {
				//https://github.com/d3/d3-scale#quantize-scales
				out.classifier( scaleQuantize().domain([min(out._values), max(out._values)]).range(getA(out.clnb_)) );
				if (out.makeClassifNice_) classif.nice();
			} else if (out.classifMethod_ === "threshold") {
				//https://github.com/d3/d3-scale#threshold-scales
				out.clnb(out.threshold_.length + 1);
				out.classifier( scaleThreshold().domain(out.threshold_).range(getA(out.clnb_)) );
			}

			//assign class to nuts regions, based on their value
			out.svg().selectAll("path.nutsrg")
				.attr("ecl", function (rg) {
					var v = rg.properties.val;
					if (v != 0 && !v) return "nd";
					return +out.classifier_(+v);
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
