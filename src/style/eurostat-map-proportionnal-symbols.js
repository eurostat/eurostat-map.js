import { select } from "d3-selection";
import { scaleSqrt } from "d3-scale";
import * as mt from '../eurostat-map-template';
import * as lgps from '../legend/legend-proportionnal-symbols';


export const map = function () {

	//the map object to return
	var out = mt.mapTemplate();

	//proportional symbols
	out.psMaxSize_ = 30;
	out.psMinSize_ = 0.8;
	out.psMinValue_ = 0;
	out.psFill_ = "#B45F04";
	out.psFillOpacity_ = 0.7;
	out.psStroke_ = "#fff";
	out.psStrokeWidth_ = 0.5;

	//the classifier: a function which return a class number from a stat value.
	out.classifier_ = undefined;



    //TODO add getters and setters



    out.legend = function (v) {
		if (!arguments.length) {
			//create legend if needed
			if(!out.legend_) out.legend_ = lgps.legendProportionnalSymbols(out);
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

		out.classifier( scaleSqrt().domain([out.psMinValue_, Math.max.apply(Math, out._values)]).range([out.psMinSize_ * 0.5, out.psMaxSize_ * 0.5]) );

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

			//see https://bl.ocks.org/mbostock/4342045 and https://bost.ocks.org/mike/bubble-map/

			if(out._nutsRG)
			//TODO add circle creation in map template buid method ? - change the radius here, only
			out.svg().select("#g_ps").selectAll("circle")
				.data(out._nutsRG.sort(function (a, b) { return b.properties.val - a.properties.val; }))
				.enter().filter(function (d) { return d.properties.val; })
				.append("circle")
				.attr("transform", function (d) { return "translate(" + out._path.centroid(d) + ")"; })
				.attr("r", function (d) { return d.properties.val ? out.classifier()(+d.properties.val) : 0; })
				.attr("class", "symbol")
				.on("mouseover", function (rg) {
					select(this).style("fill", out.nutsrgSelectionFillStyle_);
					if (out.tooltipText_) { out._tooltip.mouseover(out.tooltipText_(rg, out)); }
				}).on("mousemove", function () {
					if (out.tooltipText_) out._tooltip.mousemove();
				}).on("mouseout", function () {
					select(this).style("fill", out.psFill_);
					if (out.tooltipText_) out._tooltip.mouseout();
				})
				.style("fill", out.psFill_)
				.style("fill-opacity", out.psFillOpacity_)
				.style("stroke", out.psStroke_)
				.style("stroke-width", out.psStrokeWidth_);

        return out;
	};


    return out;
}
